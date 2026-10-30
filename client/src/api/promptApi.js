import {
  simulateAnalyze,
  simulateEnhance,
  simulateGenerate,
} from "../utils/promptSim";
import { getStoredToken } from "../auth/session";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const readErrorMessage = async (response) => {
  const raw = await response.text();
  if (!raw) return `Request failed (${response.status})`;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.detail === "string") return parsed.detail;
    if (Array.isArray(parsed?.detail)) {
      return parsed.detail.map((item) => item?.msg || JSON.stringify(item)).join("; ");
    }
    if (parsed?.message) return parsed.message;
  } catch {
    // keep raw text
  }
  return raw;
};

const authHeaders = () => {
  const headers = { "Content-Type": "application/json" };
  const token = getStoredToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const postJson = async (baseUrl, path, payload, { timeoutMs } = {}) => {
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
      ...(timeoutMs ? { signal: AbortSignal.timeout(timeoutMs) } : {}),
    });
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      throw new Error("Generation timed out. Try a shorter prompt or retry.");
    }
    throw new Error(
      `Cannot reach VidCraft API at ${baseUrl}. Make sure the server is running on port 5000.`
    );
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
};

export const analyzePrompt = async (prompt) => {
  try {
    return await postJson(API_BASE, "/api/analyze", { prompt });
  } catch (error) {
    return simulateAnalyze(prompt);
  }
};

export const enhancePrompt = async ({ prompt, model, rawScores, tokBefore }) => {
  try {
    return await postJson(API_BASE, "/api/enhance", {
      prompt,
      model,
      rawScores,
      tokBefore,
    });
  } catch (error) {
    return simulateEnhance({ prompt, model, rawScores, tokBefore });
  }
};

export const generateVideo = async ({
  path,
  tier,
  seconds,
  outputType,
  model,
  contentType,
  templateId,
  prompt,
  resolution,
  aspectRatio,
  width,
  height,
}) => {
  // Video calls HF providers and can take several minutes.
  const timeoutMs = outputType === "video" ? 600000 : 120000;
  try {
    return await postJson(
      API_BASE,
      "/api/generate",
      {
        path,
        tier,
        seconds,
        outputType,
        model,
        contentType,
        templateId,
        prompt,
        resolution,
        aspectRatio,
        width,
        height,
      },
      { timeoutMs }
    );
  } catch (error) {
    // Never fake a successful video — surface the real error.
    if (outputType === "video" || outputType === "image") {
      throw error;
    }
    return simulateGenerate({ path, tier, seconds, outputType, model, prompt });
  }
};

export const generateRemotionPlan = async ({ prompt, apiKey, contentType }) => {
  let response;
  try {
    response = await fetch(`${API_BASE}/api/remotion/generate`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        prompt,
        apiKey: apiKey || undefined,
        contentType,
      }),
      // Outline + full Remotion codegen can take several minutes
      signal: AbortSignal.timeout(600000),
    });
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      throw new Error("Remotion codegen timed out. Try a shorter script or retry.");
    }
    throw new Error(
      `Cannot reach VidCraft API at ${API_BASE}. Make sure the Node server is running on port 5000.`
    );
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
};

export const generateFromRef = async ({
  prompt,
  refImage,
  strength,
  resolution,
  aspectRatio,
  width,
  height,
  tier,
  contentType,
}) =>
  postJson(API_BASE, "/api/generate-from-ref", {
    prompt,
    refImage,
    strength,
    resolution,
    aspectRatio,
    width,
    height,
    tier,
    contentType,
  });
