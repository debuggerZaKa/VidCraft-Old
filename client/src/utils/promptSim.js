const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const scoreFromPrompt = (prompt, min, max) => {
  const base = Math.min(prompt.length * 1.5, 60);
  const jitter = (Math.random() - 0.5) * 20;
  return Math.round(clamp(base + jitter, min, max));
};

export const simulateAnalyze = async (prompt) => {
  await wait(800);
  return {
    rawScores: {
      subject: scoreFromPrompt(prompt, 18, 62),
      action: scoreFromPrompt(prompt, 12, 58),
      environment: scoreFromPrompt(prompt, 10, 55),
      visual: scoreFromPrompt(prompt, 14, 58),
      temporal: scoreFromPrompt(prompt, 10, 50),
    },
    tokBefore: Math.round(prompt.split(/\s+/).length * 4.2 + 20),
  };
};

export const simulateEnhance = async ({ prompt, model, rawScores, tokBefore }) => {
  await wait(1100);
  const boost = (v, lo, hi) => Math.min(97, v + lo + Math.round(Math.random() * hi));
  const enhancedPrompt = `A vividly described scene: ${prompt} — rendered with ${
    model === "phi3"
      ? "domain-adapted cinematic framing, LoRA-optimised lexicon targeting six semantic dimensions"
      : "professional AI-directed composition, full-parameter elaboration across all visual axes"
  }, smooth tracking camera movement transitioning from establishing shot to close-up, detailed environmental context with ${
    model === "phi3"
      ? "natural golden-hour lighting conditions"
      : "studio-quality three-point lighting setup"
  }, rich visual texture and cinematic colour grading, temporally coherent 8-second progression with clear narrative arc, 4K output with professional post-processing, ambient soundscape synchronised to visual events.`;

  return {
    enhancedPrompt,
    enhScores: {
      subject: boost(rawScores.subject, 34, 12),
      action: boost(rawScores.action, 40, 10),
      environment: boost(rawScores.environment, 44, 10),
      visual: boost(rawScores.visual, 42, 11),
      temporal: boost(rawScores.temporal, 47, 10),
    },
    similarity: Number((0.75 + Math.random() * 0.17).toFixed(2)),
    tokAfter: Math.round((tokBefore || 80) * 0.52 + Math.random() * 15),
  };
};

export const simulateGenerate = async ({ path, tier, seconds = 10, outputType }) => {
  await wait(500);
  if (path === "remotion") {
    return { cost: 0, costPerUnit: 0, unit: outputType === "image" ? "image" : "sec" };
  }
  if (outputType === "image") {
    const costPerImage = tier === "premium" ? 20 : tier === "wavespeed" ? 8 : 0;
    return { cost: costPerImage, costPerUnit: costPerImage, unit: "image" };
  }
  const costPerSec = tier === "premium" ? 55 : tier === "wavespeed" ? 27.9 : 0;
  const cost = costPerSec * seconds;
  return { cost, costPerUnit: costPerSec, unit: "sec" };
};
