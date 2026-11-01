const path = require('node:path');
const fs = require('node:fs');
const aiServiceClient = require('./aiServiceClient');

// Load the Fooocus SDXL curated image styles corpus
const STYLES_DATA_PATH = path.join(__dirname, '..', 'constants', 'imageStyles.json');
let stylesCatalog = {
  masterNegativePrompt: '',
  defaultStyle: 'sai-photographic',
  categories: [],
  styles: [],
};

try {
  const raw = fs.readFileSync(STYLES_DATA_PATH, 'utf-8');
  stylesCatalog = jsonSafeParse(raw, stylesCatalog);
} catch (err) {
  console.warn(`[imagePromptEnhancer] Failed to load imageStyles.json: ${err.message}`);
}

function jsonSafeParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

// Build index maps for O(1) lookup
const styleById = new Map();
const styleByName = new Map();

for (const s of stylesCatalog.styles || []) {
  if (s.id) styleById.set(s.id.toLowerCase(), s);
  if (s.name) styleByName.set(s.name.toLowerCase(), s);
}

// Common style alias shortcuts
const ALIAS_MAP = {
  cinematic: 'sai-cinematic',
  film: 'sai-cinematic',
  photorealistic: 'sai-photographic',
  photo: 'sai-photographic',
  photography: 'sai-photographic',
  portrait: 'sai-photographic',
  anime: 'sai-anime',
  manga: 'sai-anime',
  comic: 'sai-comic-book',
  '3d': 'sai-3d-model',
  '3d-model': 'sai-3d-model',
  octane: 'sai-3d-model',
  render: 'sai-3d-model',
  cyberpunk: 'futuristic-cyberpunk-cityscape',
  'sai-cyberpunk': 'futuristic-cyberpunk-cityscape',
  scifi: 'futuristic-cyberpunk-cityscape',
  'sci-fi': 'futuristic-cyberpunk-cityscape',
  fantasy: 'sai-fantasy-art',
  noir: 'cinematic-diva',
  analog: 'sai-analog-film',
  'analog-film': 'sai-analog-film',
  pixel: 'sai-pixel-art',
  'pixel-art': 'sai-pixel-art',
  origami: 'sai-origami',
  isometric: 'sai-isometric',
  advertising: 'ads-advertising',
  commercial: 'ads-advertising',
  food: 'ads-food-photography',
  fashion: 'ads-fashion-editorial',
};

/**
 * Returns the entire styles catalog and categories for frontend display.
 */
function getAvailableStyles() {
  return {
    defaultStyle: stylesCatalog.defaultStyle || 'sai-photographic',
    categories: stylesCatalog.categories || [],
    styles: (stylesCatalog.styles || []).map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      source: s.source,
      tags: s.tags,
      description: s.description,
    })),
    totalCount: (stylesCatalog.styles || []).length,
  };
}

/**
 * Lookup style by ID or Name (supports exact, alias, and fuzzy slug matching).
 */
function getStyle(identifier) {
  if (!identifier || typeof identifier !== 'string') return null;
  const key = identifier.trim().toLowerCase();
  if (ALIAS_MAP[key]) {
    const aliased = styleById.get(ALIAS_MAP[key]);
    if (aliased) return aliased;
  }
  const direct = styleById.get(key) || styleByName.get(key);
  if (direct) return direct;

  // Fuzzy match on partial id or name
  for (const [id, style] of styleById.entries()) {
    if (id.includes(key) || key.includes(id)) {
      return style;
    }
  }

  return null;
}


/**
 * Intelligently detect the best matching style from explicit selection, styleTokens, or prompt text.
 */
function detectStyle(basePrompt, styleTokens = [], requestedStyle = null) {
  // 1. Explicit style request takes highest precedence
  if (requestedStyle) {
    const found = getStyle(requestedStyle);
    if (found) return found;
  }

  // 2. Check styleTokens array
  if (Array.isArray(styleTokens)) {
    for (const token of styleTokens) {
      if (typeof token === 'string') {
        const found = getStyle(token);
        if (found) return found;
      }
    }
  }

  // 3. Scan base prompt text for high-signal keywords
  const promptLower = (basePrompt || '').toLowerCase();
  for (const [keyword, mappedStyleId] of Object.entries(ALIAS_MAP)) {
    // Regex boundary check for clean word match
    const regex = new RegExp(`\\b${keyword.replace('-', '[- ]')}\\b`, 'i');
    if (regex.test(promptLower)) {
      const found = styleById.get(mappedStyleId);
      if (found) return found;
    }
  }

  // 4. Default to photographic realism
  const fallback =
    getStyle(stylesCatalog.defaultStyle) ||
    styleById.get('sai-photographic') ||
    stylesCatalog.styles?.[0];

  return fallback;
}

/**
 * Cleans, merges, and deduplicates positive/negative prompt tokens.
 */
function mergeNegativePrompts(styleNeg, customNeg) {
  const master = stylesCatalog.masterNegativePrompt || '';
  const parts = [styleNeg, customNeg, master].filter(Boolean);
  const seen = new Set();
  const mergedTokens = [];

  for (const part of parts) {
    const tokens = part.split(',').map((t) => t.trim()).filter(Boolean);
    for (const token of tokens) {
      const lower = token.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        mergedTokens.push(token);
      }
    }
  }

  return mergedTokens.join(', ');
}

/**
 * Core image prompt enhancement:
 * Injects optical cues, render engines, film grain, and negative prompt guardrails.
 *
 * @param {string} basePrompt - The user's subject description
 * @param {string[]} [styleTokens] - Extra visual tokens or tags
 * @param {object} [options]
 * @param {string} [options.requestedStyle] - Explicit style id or alias
 * @param {string} [options.negativePrompt] - Custom negative prompt overrides
 * @param {string} [options.provider] - Image provider ('pollinations' or 'cloudflare')
 */
function enhanceImagePrompt(basePrompt, styleTokens = [], options = {}) {
  const cleanBase = (basePrompt || '').trim();
  const matchedStyle = detectStyle(cleanBase, styleTokens, options.requestedStyle);

  let template = matchedStyle?.prompt_template || '{prompt}, professional 4k photograph, highly detailed';

  // Interpolate user prompt into {prompt}
  let enhancedPrompt = template.includes('{prompt}')
    ? template.replace(/\{prompt\}/g, cleanBase)
    : `${template}, ${cleanBase}`;

  // If user provided extra style tokens that weren't the matched style itself, append them cleanly
  if (Array.isArray(styleTokens) && styleTokens.length > 0) {
    const extraTokens = styleTokens
      .filter((t) => typeof t === 'string' && t.trim())
      .map((t) => t.trim())
      .filter((t) => !enhancedPrompt.toLowerCase().includes(t.toLowerCase()));

    if (extraTokens.length > 0) {
      enhancedPrompt = `${enhancedPrompt}, ${extraTokens.join(', ')}`;
    }
  }

  // Clean trailing punctuation or double spaces
  enhancedPrompt = enhancedPrompt.replace(/\s*,\s*,/g, ',').replace(/\s{2,}/g, ' ').trim();

  // Build master negative prompt
  const finalNegativePrompt = mergeNegativePrompts(
    matchedStyle?.negative_prompt,
    options.negativePrompt
  );

  return {
    prompt: enhancedPrompt,
    negativePrompt: finalNegativePrompt,
    styleId: matchedStyle?.id || 'default',
    styleName: matchedStyle?.name || 'Default Photographic',
    category: matchedStyle?.category || 'photographic',
    source: matchedStyle?.source || 'curated',
  };
}

/**
 * Advanced Prompt Architect Enhancement (RAG + Groq LLM):
 * Queries 12,000+ Midjourney exemplar vector database and synthesizes
 * an award-winning scene brief with real optics and lighting.
 * Seamlessly falls back to Fooocus templates if ai-service is unreachable.
 */
async function enhanceImagePromptAsync(basePrompt, styleTokens = [], options = {}) {
  const cleanBase = (basePrompt || '').trim();
  const matchedStyle = detectStyle(cleanBase, styleTokens, options.requestedStyle);
  const styleName = matchedStyle?.name || options.requestedStyle || 'photographic';

  try {
    const aiResult = await aiServiceClient.expandImagePrompt(cleanBase, styleName, styleTokens);
    if (aiResult?.enhanced_prompt) {
      const mergedNeg = mergeNegativePrompts(
        aiResult.negative_prompt,
        options.negativePrompt || matchedStyle?.negative_prompt
      );
      return {
        prompt: aiResult.enhanced_prompt,
        negativePrompt: mergedNeg,
        styleId: matchedStyle?.id || 'architect',
        styleName: matchedStyle?.name || 'Prompt Architect',
        category: matchedStyle?.category || 'cinematic',
        source: 'rag_midjourney_12k',
        lighting: aiResult.lighting,
        camera: aiResult.camera,
        exemplarsUsed: aiResult.exemplars_used || [],
      };
    }
  } catch (err) {
    console.warn(`[imagePromptEnhancer] Prompt Architect (${err.message}), using Fooocus template fallback.`);
  }

  return enhanceImagePrompt(basePrompt, styleTokens, options);
}

module.exports = {
  enhanceImagePrompt,
  enhanceImagePromptAsync,
  getAvailableStyles,
  getStyle,
  detectStyle,
};

