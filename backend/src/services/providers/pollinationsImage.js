// Tier 1 (free) image provider — Pollinations.ai needs no signup, API key,
// or account at all (PROVIDER-001, ADR-019). A plain GET returns the image
// bytes directly.
//
// FR-7 continuity: this adapter accepts (and forwards) the shared seed and
// negative prompt built by services/continuityPrompt.js. Two parameters
// matter beyond the obvious `seed`:
//   - `enhance=false` is set explicitly. Pollinations' enhancer rewrites the
//     incoming prompt with an LLM before generating, which would rewrite the
//     invariant world_state block differently for every shot and destroy the
//     exact thing continuity depends on.
//   - `nofeed=true` keeps storyboard frames off the public feed.
// Image-to-image is deliberately not wired here: Pollinations' `image[]`
// parameter takes a publicly-fetchable URL, and generated assets live on the
// backend's local /media mount, which Pollinations cannot reach. Reference
// anchoring is therefore a Cloudflare-only tier (see cloudflareImage.js).
const BASE_URL = 'https://image.pollinations.ai/prompt';

// 16:9 at 1080p so stills drop straight into the 1920x1080 Remotion
// storyboard composition without letterboxing, and with enough resolution
// left over for the Ken Burns push to crop into without visible softening.
const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;

function sanitizePrompt(text, hasApiKey, maxLen = 120) {
  if (!text) return '';
  // Normalize unicode characters and remove non-ASCII glyphs
  let cleaned = text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2011\u2013\u2014]/g, '-')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Pollinations unauthenticated public gateway returns 402 if prompt query exceeds ~140 characters.
  // We trim gracefully at a natural word boundary for free tier so every request succeeds with a 200.
  if (!hasApiKey && cleaned.length > maxLen) {
    cleaned = cleaned.slice(0, maxLen).replace(/,?\s+\S*$/, '').trim();
  }
  return cleaned;
}

async function fetchPollinations(safePrompt, params, headers) {
  const url = `${BASE_URL}/${encodeURIComponent(safePrompt)}?${params.toString()}`;
  try {
    return await fetch(url, { headers });
  } catch (cause) {
    throw new Error(`Pollinations unreachable: ${cause.message}`);
  }
}

async function generateImage(prompt, options = {}) {
  const {
    seed,
    negativePrompt,
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
  } = options;

  const hasApiKey = Boolean(process.env.POLLINATIONS_API_KEY);
  let safePrompt = sanitizePrompt(prompt, hasApiKey, 120);

  const params = new URLSearchParams({
    nologo: 'true',
    nofeed: 'true',
    enhance: 'false',
    width: String(width),
    height: String(height),
  });

  const selectedModel = options.model || process.env.POLLINATIONS_MODEL;
  if (selectedModel) {
    params.set('model', selectedModel);
  }
  if (Number.isInteger(seed)) params.set('seed', String(seed));

  if (negativePrompt && hasApiKey) {
    params.set('negative_prompt', negativePrompt);
  }

  const headers = {};
  if (hasApiKey) {
    headers.Authorization = `Bearer ${process.env.POLLINATIONS_API_KEY}`;
  }

  let res = await fetchPollinations(safePrompt, params, headers);

  // If 503 (server busy) or 402 (length limit reached), retry with a tighter prompt
  if (!res.ok && (res.status === 503 || res.status === 402) && !hasApiKey) {
    await new Promise((r) => setTimeout(r, 1200));
    safePrompt = sanitizePrompt(prompt, false, 85);
    res = await fetchPollinations(safePrompt, params, headers);
  }

  if (!res.ok) {
    throw new Error(`Pollinations returned ${res.status}`);
  }


  return {
    provider: 'pollinations',
    tier: 1,
    model: process.env.POLLINATIONS_MODEL || 'pollinations-default',
    seed: Number.isInteger(seed) ? seed : undefined,
    buffer: Buffer.from(await res.arrayBuffer()),
    contentType: res.headers.get('content-type') || 'image/jpeg',
  };
}

module.exports = { generateImage };
