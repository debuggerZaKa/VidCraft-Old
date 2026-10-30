import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import {
  CODEGEN_SYSTEM,
  OUTLINE_SYSTEM,
  buildEmergencyComposition,
  ensureGeneratedExports,
  extractCodeBlock,
  writeGeneratedComposition,
} from "./remotionCodegen.js";
import { connectDb } from "./db.js";
import { requireAuth } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import historyRoutes from "./routes/history.js";
import { Generation } from "./models/Generation.js";
import { generateHfVideo, getVideoConfig } from "./hfVideo.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootEnvPath = path.resolve(__dirname, "..", "..", ".env");
dotenv.config({ path: rootEnvPath });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const PY_API_BASE = (process.env.PY_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

app.use(cors());
app.use(express.json({ limit: "18mb" }));

const MODEL_MAP = {
  vidcraft: process.env.HF_MODEL_DEFAULT || "black-forest-labs/FLUX.1-schnell",
  huggingface: process.env.HF_MODEL_DEFAULT || "black-forest-labs/FLUX.1-schnell",
  "sdxl-turbo": process.env.HF_MODEL_SDXL_TURBO || "stabilityai/sdxl-turbo",
  "kandinsky-3": process.env.HF_MODEL_KANDINSKY_3 || "kandinsky-community/kandinsky-3",
  "flux-pro": process.env.HF_MODEL_FLUX_PRO || "black-forest-labs/FLUX.1-schnell",
};

const MODEL_LABELS = {
  vidcraft: "VidCraft",
  huggingface: "VidCraft",
  "vidcraft-ref": "VidCraft Ref",
  "sdxl-turbo": "SDXL Turbo",
  "kandinsky-3": "Kandinsky 3",
  "flux-pro": "FLUX Pro",
  "wan-2.1": "Wan 2.1 (HF)",
  "wavespeed-v1": "Wan 2.1 (HF)",
};

const IMG2IMG_MODEL =
  process.env.HF_MODEL_IMG2IMG ||
  process.env.HF_MODEL_DEFAULT ||
  "black-forest-labs/FLUX.1-schnell";

const resolveModelId = (model) => MODEL_MAP[model] || MODEL_MAP.vidcraft;
const resolveModelLabel = (model) => MODEL_LABELS[model] || "VidCraft";

const computeCost = ({ tier, outputType, seconds = 10 }) => {
  if (outputType === "image") {
    const costPerImage = tier === "premium" ? 20 : tier === "wavespeed" ? 8 : 0;
    return { cost: costPerImage, costPerUnit: costPerImage, unit: "image" };
  }
  const costPerSec = tier === "premium" ? 55 : tier === "wavespeed" ? 27.9 : 0;
  return { cost: costPerSec * seconds, costPerUnit: costPerSec, unit: "sec" };
};

const readErrorBody = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const payload = await response.json();
      return payload?.error || payload?.message || payload?.detail || JSON.stringify(payload);
    } catch {
      return "Failed to parse JSON error body.";
    }
  }
  return response.text();
};

const extractJsonObject = (text) => {
  if (!text || typeof text !== "string") {
    throw new Error("Empty model response.");
  }
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] || text).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return JSON.");
  }
  return JSON.parse(candidate.slice(start, end + 1));
};

const getQwenConfig = (apiKey) => {
  const key =
    (typeof apiKey === "string" && apiKey.trim()) ||
    process.env.DASHSCOPE_API_KEY ||
    process.env.QWEN_API_KEY ||
    process.env.WAVESPEED_API_KEY ||
    "";

  const baseUrl = (
    process.env.QWEN_BASE_URL ||
    process.env.DASHSCOPE_BASE_URL ||
    "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
  ).replace(/\/$/, "");

  const model = process.env.QWEN_MODEL || process.env.DASHSCOPE_MODEL || "qwen-plus";
  return { key, baseUrl, model };
};

const qwenChat = async ({ key, baseUrl, model, system, user, temperature = 0.35, maxTokens = 8192 }) => {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    const message = await readErrorBody(response);
    const error = new Error(message || "Qwen Cloud request failed.");
    error.status = response.status;
    throw error;
  }

  const payload = await response.json();
  return payload?.choices?.[0]?.message?.content || "";
};

const saveGeneration = async (user, data) => {
  if (!user) return null;
  try {
    const doc = await Generation.create({
      userId: user._id,
      prompt: data.prompt,
      path: data.path || "api",
      contentType: data.contentType || "",
      outputType: data.outputType,
      genModel: data.genModel || "",
      genModelLabel: data.genModelLabel || "VidCraft",
      imageDataUrl: data.imageDataUrl || null,
      videoDataUrl: data.videoDataUrl || null,
      thumb: data.thumb || data.imageDataUrl || null,
      cost: data.cost || 0,
      meta: data.meta || null,
    });
    return doc.toClient();
  } catch (error) {
    console.warn("Failed to save generation history:", error?.message || error);
    return null;
  }
};

const generateImageViaProxy = async (payload) => {
  const response = await fetch(`${PY_API_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await readErrorBody(response);
    const error = new Error(typeof message === "string" ? message : "VidCraft image service failed.");
    error.status = response.status;
    throw error;
  }

  return response.json();
};

const generateFromRefViaProxy = async (payload) => {
  const response = await fetch(`${PY_API_BASE}/api/generate-from-ref`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await readErrorBody(response);
    const error = new Error(
      typeof message === "string" ? message : "VidCraft Ref image service failed."
    );
    error.status = response.status;
    throw error;
  }

  return response.json();
};

const generateImageDirect = async ({ prompt, model, pricing }) => {
  const hfToken = process.env.HF_API_TOKEN || process.env.HF_TOKEN;
  if (!hfToken) {
    throw Object.assign(new Error("Image service is not configured on the server."), { status: 500 });
  }

  const modelId = resolveModelId(model);
  const response = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${hfToken}`,
      "Content-Type": "application/json",
      Accept: "image/png",
    },
    body: JSON.stringify({ inputs: prompt }),
  });

  if (!response.ok) {
    const message = await readErrorBody(response);
    throw Object.assign(new Error(message || "VidCraft image generation failed."), {
      status: response.status,
    });
  }

  const contentType = response.headers.get("content-type") || "image/png";
  if (contentType.includes("application/json")) {
    const payload = await response.json();
    throw Object.assign(new Error(payload?.error || "Unexpected response from image service."), {
      status: 502,
    });
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return {
    ...pricing,
    modelId,
    imageDataUrl: `data:${contentType};base64,${base64}`,
  };
};

app.get("/api/health", async (req, res) => {
  let db = false;
  try {
    const mongoose = (await import("mongoose")).default;
    db = mongoose.connection.readyState === 1;
  } catch {
    db = false;
  }
  res.json({ ok: true, db });
});

app.use("/api/auth", authRoutes);
app.use("/api/history", historyRoutes);

app.post("/api/analyze", (req, res) => {
  res.status(501).send("Analyze endpoint not implemented.");
});

app.post("/api/enhance", (req, res) => {
  res.status(501).send("Enhance endpoint not implemented.");
});

app.post("/api/remotion/generate", requireAuth, async (req, res) => {
  const { prompt, apiKey, contentType } = req.body || {};

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).send("Prompt is required.");
  }

  const { key, baseUrl, model } = getQwenConfig(apiKey);
  if (!key) {
    return res
      .status(500)
      .send("DASHSCOPE_API_KEY / QWEN_API_KEY is missing. Add it to .env or Settings → Qwen Cloud.");
  }

  const script = prompt.trim();
  let outline = null;
  let source = "qwen-codegen";
  let warning = "";

  const respondSuccess = async (payload) => {
    const historyEntry = await saveGeneration(req.user, {
      prompt: script,
      path: "remotion",
      contentType: contentType || "animated",
      outputType: "video",
      genModel: payload.source || source,
      genModelLabel: "VidCraft Remotion Engine",
      cost: 0,
      meta: payload.meta || null,
    });
    return res.json({ ...payload, historyEntry });
  };

  try {
    const outlineRaw = await qwenChat({
      key,
      baseUrl,
      model,
      system: OUTLINE_SYSTEM,
      user: `Create a Remotion storyboard outline for this full script:\n\n${script}`,
      temperature: 0.3,
      maxTokens: 4096,
    });
    outline = extractJsonObject(outlineRaw);

    let codeRaw = await qwenChat({
      key,
      baseUrl,
      model,
      system: CODEGEN_SYSTEM,
      user: `Write GeneratedComposition JSX for this outline and script.

OUTLINE JSON:
${JSON.stringify(outline, null, 2)}

FULL SCRIPT:
${script}

Remember: original visuals for THIS story, Sequences for each scene, export GeneratedComposition + GENERATED_META.`,
      temperature: 0.4,
      maxTokens: 8192,
    });

    let code = ensureGeneratedExports(extractCodeBlock(codeRaw), outline);

    try {
      writeGeneratedComposition(code);
    } catch (writeError) {
      throw new Error(
        writeError instanceof Error ? writeError.message : "Failed to write generated composition."
      );
    }

    const metaMatch = code.match(/GENERATED_META\s*=\s*(\{[\s\S]*?\n\})/);
    let meta = {
      title: outline?.title || "Generated Story",
      durationInFrames: Number(outline?.durationInFrames) || 2700,
      fps: 30,
      width: 1280,
      height: 720,
    };
    if (metaMatch) {
      try {
        // eslint-disable-next-line no-new-func
        meta = Function(`"use strict"; return (${metaMatch[1]});`)();
      } catch {
        // keep outline meta
      }
    }

    return respondSuccess({
      cost: 0,
      model,
      source,
      mode: "codegen",
      generationId: Date.now(),
      outline,
      meta: {
        title: meta.title || outline?.title || "Generated Story",
        durationInFrames: Math.min(5400, Math.max(900, Number(meta.durationInFrames) || 2700)),
        fps: 30,
        width: 1280,
        height: 720,
      },
      file: "client/src/remotion/generated/GeneratedComposition.jsx",
      warning,
    });
  } catch (error) {
    const status = error?.status;
    if (status === 401 || status === 403) {
      const emergency = buildEmergencyComposition(script, outline);
      writeGeneratedComposition(emergency);
      return respondSuccess({
        cost: 0,
        model: "emergency-codegen",
        source: "fallback-codegen",
        mode: "codegen",
        generationId: Date.now(),
        outline,
        meta: {
          title: outline?.title || "Generated Story",
          durationInFrames: Math.min(
            5400,
            Math.max(1800, Number(outline?.durationInFrames) || 2700)
          ),
          fps: 30,
          width: 1280,
          height: 720,
        },
        file: "client/src/remotion/generated/GeneratedComposition.jsx",
        warning:
          "Qwen unauthorized — wrote an emergency generated composition from the script outline. Fix DASHSCOPE_API_KEY for full LLM code.",
      });
    }

    try {
      if (outline) {
        writeGeneratedComposition(buildEmergencyComposition(script, outline));
        return respondSuccess({
          cost: 0,
          model,
          source: "repair-codegen",
          mode: "codegen",
          generationId: Date.now(),
          outline,
          meta: {
            title: outline?.title || "Generated Story",
            durationInFrames: Math.min(
              5400,
              Math.max(1800, Number(outline?.durationInFrames) || 2700)
            ),
            fps: 30,
            width: 1280,
            height: 720,
          },
          file: "client/src/remotion/generated/GeneratedComposition.jsx",
          warning: `Codegen repair mode: ${error instanceof Error ? error.message : "LLM code failed validation"}. Wrote a new generated file from the outline (not old presets).`,
        });
      }
    } catch {
      // fall through
    }

    const message =
      error instanceof Error ? error.message : "Failed to generate Remotion code.";
    return res.status(500).send(message);
  }
});

app.post("/api/generate", requireAuth, async (req, res) => {
  const {
    prompt,
    outputType,
    model,
    tier,
    seconds,
    path: genPath,
    contentType,
    resolution,
    aspectRatio,
    width,
    height,
  } = req.body || {};

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).send("Prompt is required.");
  }

  const videoConfig = getVideoConfig();
  const effectiveSeconds =
    outputType === "video" ? videoConfig.seconds : seconds;
  const pricing = computeCost({ tier, outputType, seconds: effectiveSeconds });
  const modelKey = model === "huggingface" ? "vidcraft" : model || "vidcraft";

  if (genPath === "remotion") {
    return res.json(pricing);
  }

  // AI video via Hugging Face Inference Providers (Wan 2.1, ~2s)
  if (outputType === "video") {
    try {
      const result = await generateHfVideo(prompt.trim());
      const historyEntry = await saveGeneration(req.user, {
        prompt: prompt.trim(),
        path: "api",
        contentType: contentType || "",
        outputType: "video",
        genModel: modelKey === "vidcraft" ? "wan-2.1" : modelKey,
        genModelLabel: resolveModelLabel(modelKey === "vidcraft" ? "wan-2.1" : modelKey),
        videoDataUrl: result.videoDataUrl,
        cost: pricing.cost,
        meta: {
          modelId: result.modelId,
          provider: result.provider,
          seconds: result.seconds,
          numFrames: result.numFrames,
          bytes: result.bytes,
        },
      });

      return res.json({
        ...pricing,
        videoDataUrl: result.videoDataUrl,
        modelId: result.modelId,
        provider: result.provider,
        seconds: result.seconds,
        numFrames: result.numFrames,
        modelLabel: resolveModelLabel(modelKey === "vidcraft" ? "wan-2.1" : modelKey),
        historyEntry,
      });
    } catch (error) {
      const status = error?.status || 500;
      const message =
        error instanceof Error ? error.message : "Failed to generate video.";
      return res.status(status).send(message);
    }
  }

  if (outputType !== "image") {
    return res.status(400).send("Unsupported output type.");
  }

  try {
    let result;
    try {
      result = await generateImageViaProxy({
        prompt: prompt.trim(),
        outputType,
        model: modelKey,
        tier,
        seconds,
        path: genPath,
        contentType,
        resolution,
        aspectRatio,
        width,
        height,
      });
    } catch (proxyError) {
      console.warn("Image proxy unavailable, using direct path:", proxyError?.message || proxyError);
      result = await generateImageDirect({
        prompt: prompt.trim(),
        model: modelKey,
        pricing,
      });
    }

    const imageDataUrl = result?.imageDataUrl || null;
    const historyEntry = await saveGeneration(req.user, {
      prompt: prompt.trim(),
      path: genPath === "remotion" ? "remotion" : "api",
      contentType: contentType || "",
      outputType: "image",
      genModel: modelKey,
      genModelLabel: resolveModelLabel(modelKey),
      imageDataUrl,
      thumb: imageDataUrl,
      cost: result?.cost ?? pricing.cost,
    });

    return res.json({
      ...pricing,
      ...result,
      cost: result?.cost ?? pricing.cost,
      modelLabel: resolveModelLabel(modelKey),
      historyEntry,
    });
  } catch (error) {
    const status = error?.status || 500;
    const message =
      error instanceof Error ? error.message : "Failed to reach VidCraft image service.";
    return res.status(status).send(message);
  }
});

app.post("/api/generate-from-ref", requireAuth, async (req, res) => {
  const {
    prompt,
    refImage,
    strength,
    guidanceScale,
    tier,
    resolution,
    aspectRatio,
    width,
    height,
    contentType,
  } = req.body || {};

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ message: "Prompt is required." });
  }
  if (!refImage || typeof refImage !== "string") {
    return res.status(400).json({ message: "Reference image is required." });
  }
  if (!refImage.startsWith("data:image/")) {
    return res.status(400).json({ message: "Reference image must be a data URL." });
  }

  const pricing = computeCost({ tier, outputType: "image", seconds: 1 });

  try {
    const result = await generateFromRefViaProxy({
      prompt: prompt.trim(),
      refImage,
      model: IMG2IMG_MODEL,
      tier,
      strength: typeof strength === "number" ? strength : Number(strength) || 0.65,
      guidanceScale:
        guidanceScale === undefined || guidanceScale === null
          ? undefined
          : Number(guidanceScale),
      resolution,
      aspectRatio,
      width,
      height,
    });

    const imageDataUrl = result?.imageDataUrl || null;
    const historyEntry = await saveGeneration(req.user, {
      prompt: prompt.trim(),
      path: "ref",
      contentType: contentType || "ref",
      outputType: "image",
      genModel: "vidcraft-ref",
      genModelLabel: "VidCraft Ref",
      imageDataUrl,
      thumb: imageDataUrl,
      cost: result?.cost ?? pricing.cost,
      meta: {
        strength: result?.strength ?? strength ?? 0.65,
        modelId: result?.modelId || IMG2IMG_MODEL,
        mode: "ref",
      },
    });

    return res.json({
      ...pricing,
      ...result,
      cost: result?.cost ?? pricing.cost,
      modelLabel: "VidCraft Ref",
      historyEntry,
    });
  } catch (error) {
    const status = error?.status || 500;
    const message =
      error instanceof Error ? error.message : "Failed to reach VidCraft Ref service.";
    return res.status(status).json({ message });
  }
});

const start = async () => {
  try {
    await connectDb();
  } catch (error) {
    console.error("MongoDB connection failed:", error?.message || error);
    console.error("Start MongoDB locally or set MONGODB_URI in .env");
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`VidCraft server listening on port ${PORT}`);
  });
};

start();
