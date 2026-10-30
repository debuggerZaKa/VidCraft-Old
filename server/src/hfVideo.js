import { InferenceClient } from "@huggingface/inference";

const DEFAULT_MODEL = "Wan-AI/Wan2.1-T2V-1.3B";
const DEFAULT_PROVIDER = "wavespeed";
const DEFAULT_SECONDS = 2;
const DEFAULT_FPS = 16;
const DEFAULT_STEPS = 20;
const PROVIDER_FALLBACKS = ["wavespeed", "fal-ai"];
/** Working fal endpoint (HF's mapped 1.3B path is currently broken). */
const FAL_WAN_ENDPOINT = "fal-ai/wan-t2v";

/** Wan temporal VAE prefers 4n+1 frame counts. */
const toWanFrames = (seconds, fps = DEFAULT_FPS) => {
  const target = Math.max(1, Math.round(Number(seconds) * fps));
  return Math.max(5, Math.round((target - 1) / 4) * 4 + 1);
};

export const getVideoToken = () =>
  (
    process.env.HF_VIDEO_TOKEN ||
    process.env.new_api ||
    process.env.HF_API_TOKEN ||
    process.env.HF_TOKEN ||
    ""
  ).trim();

export const getFalKey = () => (process.env.FAL_API_KEY || process.env.FAL_KEY || "").trim();

export const getVideoConfig = () => {
  const seconds = Math.min(
    DEFAULT_SECONDS,
    Math.max(1, Number(process.env.HF_VIDEO_SECONDS) || DEFAULT_SECONDS)
  );
  const envFrames = Number(process.env.HF_VIDEO_NUM_FRAMES);
  const numFrames = Number.isFinite(envFrames) && envFrames > 0 ? envFrames : toWanFrames(seconds);

  return {
    model: process.env.HF_VIDEO_MODEL || DEFAULT_MODEL,
    provider: process.env.HF_VIDEO_PROVIDER || process.env.HF_PROVIDER || DEFAULT_PROVIDER,
    seconds,
    numFrames,
    numInferenceSteps: Number(process.env.HF_VIDEO_INFERENCE_STEPS) || DEFAULT_STEPS,
    fps: DEFAULT_FPS,
  };
};

const providerOrder = (preferred) => {
  const ordered = [preferred, ...PROVIDER_FALLBACKS.filter((p) => p !== preferred)];
  return [...new Set(ordered)];
};

const classifyStatus = (message) => {
  if (/credit|balance|payment|402|insufficient|depleted/i.test(message)) return 402;
  if (/auth|unauthorized|401|token|forbidden|403/i.test(message)) return 401;
  return 502;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const bufferFromVideoBlob = async (videoBlob) => {
  const arrayBuffer = await videoBlob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (!buffer.length) {
    throw new Error("Provider returned an empty video.");
  }
  return buffer;
};

/**
 * Direct fal.ai queue call billed to FAL_API_KEY.
 * fal-ai/wan-t2v requires num_frames >= 81, so we use 81 frames @ 24fps (~3.4s)
 * when the requested clip is shorter than that.
 */
const generateViaFalDirect = async (prompt, config) => {
  const falKey = getFalKey();
  if (!falKey) {
    throw new Error("FAL_API_KEY is not configured.");
  }

  // fal wan-t2v accepts 81-100 frames and 5-24 fps
  const numFrames = Math.max(81, Math.min(100, config.numFrames));
  const fps = Math.min(24, Math.max(5, Math.round(numFrames / Math.max(config.seconds, 1))));
  const effectiveSeconds = Number((numFrames / fps).toFixed(2));

  console.log(
    `[hf-video] generating via fal-direct / ${FAL_WAN_ENDPOINT} (${numFrames} frames @ ${fps}fps ~${effectiveSeconds}s)`
  );

  const submitRes = await fetch(`https://queue.fal.run/${FAL_WAN_ENDPOINT}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${falKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      num_frames: numFrames,
      frames_per_second: fps,
      resolution: "480p",
      aspect_ratio: "16:9",
      enable_safety_checker: true,
      turbo_mode: true,
    }),
  });

  if (!submitRes.ok) {
    const text = await submitRes.text();
    throw new Error(`fal submit failed (${submitRes.status}): ${text}`);
  }

  const submitted = await submitRes.json();
  const requestId = submitted?.request_id;
  const statusUrl = submitted?.status_url;
  const responseUrl = submitted?.response_url;

  if (!requestId || !statusUrl || !responseUrl) {
    throw new Error(`fal submit returned unexpected payload: ${JSON.stringify(submitted)}`);
  }

  const started = Date.now();
  const timeoutMs = 5 * 60 * 1000;

  while (Date.now() - started < timeoutMs) {
    const statusRes = await fetch(statusUrl, {
      headers: { Authorization: `Key ${falKey}` },
    });
    if (!statusRes.ok) {
      const text = await statusRes.text();
      throw new Error(`fal status failed (${statusRes.status}): ${text}`);
    }
    const status = await statusRes.json();
    if (status?.status === "COMPLETED") break;
    if (status?.status === "FAILED") {
      throw new Error(`fal generation failed: ${JSON.stringify(status)}`);
    }
    await sleep(2500);
  }

  const resultRes = await fetch(responseUrl, {
    headers: { Authorization: `Key ${falKey}` },
  });
  if (!resultRes.ok) {
    const text = await resultRes.text();
    throw new Error(`fal result failed (${resultRes.status}): ${text}`);
  }

  const result = await resultRes.json();
  const videoUrl = result?.video?.url;
  if (!videoUrl) {
    throw new Error(`fal result missing video url: ${JSON.stringify(result)}`);
  }

  const videoRes = await fetch(videoUrl);
  if (!videoRes.ok) {
    throw new Error(`Failed to download fal video (${videoRes.status}).`);
  }
  const buffer = Buffer.from(await videoRes.arrayBuffer());
  if (!buffer.length) {
    throw new Error("fal returned an empty video file.");
  }

  return {
    videoDataUrl: `data:video/mp4;base64,${buffer.toString("base64")}`,
    modelId: FAL_WAN_ENDPOINT,
    provider: "fal-direct",
    seconds: effectiveSeconds,
    numFrames,
    bytes: buffer.length,
  };
};

export const generateHfVideo = async (prompt) => {
  const token = getVideoToken();
  const falKey = getFalKey();
  if (!token && !falKey) {
    throw Object.assign(
      new Error("Video service is not configured. Set HF_VIDEO_TOKEN or FAL_API_KEY in .env."),
      { status: 500 }
    );
  }

  const config = getVideoConfig();
  const errors = [];

  // 1) Try Hugging Face Inference Providers (uses HF_VIDEO_TOKEN / free credit)
  if (token) {
    const client = new InferenceClient(token);
    const providers = providerOrder(config.provider);

    for (const provider of providers) {
      try {
        console.log(
          `[hf-video] generating via ${provider} / ${config.model} (${config.numFrames} frames)`
        );
        const videoBlob = await client.textToVideo({
          provider,
          model: config.model,
          inputs: prompt,
          parameters: {
            num_frames: config.numFrames,
            num_inference_steps: config.numInferenceSteps,
          },
        });
        const buffer = await bufferFromVideoBlob(videoBlob);
        return {
          videoDataUrl: `data:video/mp4;base64,${buffer.toString("base64")}`,
          modelId: config.model,
          provider,
          seconds: config.seconds,
          numFrames: config.numFrames,
          bytes: buffer.length,
        };
      } catch (error) {
        const message =
          error?.message ||
          error?.error ||
          (typeof error === "string" ? error : "Hugging Face video generation failed.");
        console.warn(`[hf-video] ${provider} failed:`, message);
        errors.push(`${provider}: ${message}`);
      }
    }
  } else {
    errors.push("hf: HF_VIDEO_TOKEN missing");
  }

  // 2) Fallback: bill fal.ai directly (bypasses depleted HF credits)
  if (falKey) {
    try {
      return await generateViaFalDirect(prompt, config);
    } catch (error) {
      const message = error?.message || "fal-direct generation failed.";
      console.warn("[hf-video] fal-direct failed:", message);
      errors.push(`fal-direct: ${message}`);
    }
  }

  const message = errors.join(" | ") || "Video generation failed.";
  const friendly = /depleted|exhausted balance|insufficient|credits/i.test(message)
    ? "Video credits are exhausted. Add Hugging Face Inference credits (HF_VIDEO_TOKEN) or top up fal.ai (FAL_API_KEY), then try again."
    : message;
  throw Object.assign(new Error(friendly), {
    status: classifyStatus(message),
    details: errors,
  });
};
