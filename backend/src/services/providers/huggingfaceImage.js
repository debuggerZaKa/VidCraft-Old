// Tier 1 / Paid Image Provider — Hugging Face Inference Providers.
// Default model: black-forest-labs/FLUX.1-schnell (12B parameter rectified flow transformer).
// Uses the official @huggingface/inference client with direct REST router fallback.

const { InferenceClient } = require('@huggingface/inference');

const DEFAULT_MODEL = 'black-forest-labs/FLUX.1-schnell';
const DEFAULT_WIDTH = 1024;
const DEFAULT_HEIGHT = 1024;

/**
 * Generates a high-fidelity image via Hugging Face Inference Providers.
 * @param {string} prompt Text prompt to generate from
 * @param {object} options Generation options (model, width, height, seed)
 */
async function generateImage(prompt, options = {}) {
  const token =
    process.env.HUGGINGFACE_API_TOKEN ||
    process.env.HF_API_TOKEN ||
    process.env.HF_TOKEN;

  if (!token) {
    throw new Error(
      'Hugging Face credentials not configured. Please add HUGGINGFACE_API_TOKEN or HF_TOKEN in your .env file.'
    );
  }

  const model = options.model || process.env.HF_MODEL_IMAGE || DEFAULT_MODEL;
  const width = options.width || DEFAULT_WIDTH;
  const height = options.height || DEFAULT_HEIGHT;
  const seed = Number.isInteger(options.seed) ? options.seed : undefined;

  let blob;
  let lastError = null;

  // Primary path: official @huggingface/inference client
  try {
    const client = new InferenceClient(token);
    const providerChoice = options.provider || process.env.HF_IMAGE_PROVIDER || 'auto';
    blob = await client.textToImage({
      model,
      provider: providerChoice,
      inputs: prompt.trim(),
      parameters: {
        width,
        height,
        ...(seed !== undefined ? { seed } : {}),
        ...(options.steps || options.numSteps
          ? { num_inference_steps: options.steps || options.numSteps }
          : {}),
      },
    });
  } catch (clientErr) {
    lastError = clientErr;
    const msg = clientErr.message || '';
    // If it's a credits or auth error, throw immediately so the user gets the clear, actionable message
    if (
      msg.includes('no remaining credits') ||
      msg.includes('credits') ||
      msg.includes('401') ||
      msg.includes('Unauthorized') ||
      msg.includes('Forbidden')
    ) {
      throw new Error(`Hugging Face error: ${msg}`);
    }

    console.warn(`[huggingfaceImage] InferenceClient error (${msg})`);
  }

  if (!blob) {
    throw new Error(
      `Hugging Face FLUX.1 generation failed: ${lastError?.message || 'Unknown error'}`
    );
  }

  const arrayBuffer = await blob.arrayBuffer();
  return {
    provider: 'huggingface',
    tier: 1,
    model,
    seed,
    buffer: Buffer.from(arrayBuffer),
    contentType: blob.type || 'image/png',
  };
}

module.exports = { generateImage, DEFAULT_MODEL };

