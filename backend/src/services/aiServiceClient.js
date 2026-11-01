// Thin HTTP wrapper around the Python FastAPI ai-service (AI-001..005),
// the same "separate process, invoked over its real interface" pattern
// as remotionService.js uses for Remotion (per ADR-009). Uses Node's
// built-in fetch (Node 18+) rather than adding an HTTP client dependency.

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function post(path, body) {
  let res;
  try {
    res = await fetch(`${AI_SERVICE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15 * 60 * 1000),
    });
  } catch (cause) {
    const err = new Error(`ai-service unreachable at ${AI_SERVICE_URL}${path}: ${cause.message}`);
    err.statusCode = 502;
    throw err;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.detail || `ai-service ${path} returned ${res.status}`);
    // ai-service's own 422s are its input-validation errors, which are a
    // 400 by the time they've bubbled up through this backend's request.
    err.statusCode = res.status === 422 ? 400 : 502;
    throw err;
  }

  return data;
}

function analyzePrompt(prompt) {
  return post('/analyze', { prompt });
}

// `overallScore` is optional (ADR-031): the ai-service sizes the question
// budget from the flags alone without it, but passing the FR-1 overall score
// lets it ask an extra question of a prompt that is weak everywhere rather
// than broken in one dimension.
function getClarificationQuestions(prompt, flags, suggestions, overallScore) {
  return post('/clarify/questions', {
    prompt,
    flags,
    suggestions,
    ...(Number.isFinite(overallScore) ? { overall_score: overallScore } : {}),
  });
}

function resolveClarification(prompt, questions, answers) {
  return post('/clarify/resolve', { prompt, questions, answers });
}

function generateStoryboard(clarifiedPrompt) {
  return post('/storyboard/generate', { clarified_prompt: clarifiedPrompt });
}

// FR-10 (ADR-032). Returns each shot with its beats — every beat carrying
// the MEASURED duration of its own narration and the audio as base64 — plus
// the duration_s the shot must adopt for the voice to stay in sync. The
// caller adopts those numbers; it must never recompute them.
function generateNarration(shots, worldState, voice) {
  return post('/narration/script', {
    shots,
    world_state: worldState,
    ...(voice ? { voice } : {}),
  });
}

function criticEvaluate(imageBase64, description) {
  return post('/critic/evaluate', { image_base64: imageBase64, description });
}

function processReels(videoPath, autoRenderFirst = false, outputDir = null, options = {}) {
  return post('/reels/process', {
    video_path: videoPath,
    auto_render_first: autoRenderFirst,
    output_dir: outputDir,
    aspect_ratio: options.aspectRatio || '9:16',
    duration_mode: options.durationMode || 'auto',
    layout_mode: options.layoutMode || 'blur',
    subtitle_style: options.subtitleStyle || 'hormozi',
    subtitle_position: options.subtitlePosition || 'bottom',
    font_size_choice: options.fontSizeChoice || 'standard',
    trim_silence: !!options.trimSilence,
    bgm_preset: options.bgmPreset || 'none',
    ...(options.targetCount ? { target_count: options.targetCount } : {}),
    ...(Array.isArray(options.timeRange) ? { time_range: options.timeRange } : {}),
  });
}

function renderReel(videoPath, startTime, endTime, words = [], outputDir = null, options = {}) {
  const opts = typeof options === 'string' ? { aspectRatio: options } : (options || {});
  return post('/reels/render', {
    video_path: videoPath,
    start_time: startTime,
    end_time: endTime,
    words,
    output_dir: outputDir,
    aspect_ratio: opts.aspectRatio || '9:16',
    layout_mode: opts.layoutMode || 'blur',
    subtitle_style: opts.subtitleStyle || 'hormozi',
    subtitle_position: opts.subtitlePosition || 'bottom',
    font_size_choice: opts.fontSizeChoice || 'standard',
    trim_silence: !!opts.trimSilence,
    bgm_preset: opts.bgmPreset || 'none',
  });
}

function generatePresentation(payload) {
  return post('/presentation/generate', payload);
}

function exportPresentationPptx(deck, outputFilename) {
  return post('/presentation/export-pptx', {
    deck,
    output_filename: outputFilename,
  });
}

function narratePresentationSlide(text, voice) {
  return post('/presentation/narrate', { text, voice });
}

function importPresentationPptx(templateName, filePath) {
  return post('/presentation/import-pptx', {
    template_name: templateName,
    file_path: filePath,
  });
}

function transcribeCaptions(videoPath, language) {
  return post('/captions/transcribe', {
    video_path: videoPath,
    ...(language ? { language } : {}),
  });
}

function expandImagePrompt(prompt, style, styleTokens = []) {
  return post('/images/expand-prompt', {
    prompt,
    ...(style ? { style } : {}),
    style_tokens: styleTokens,
  });
}

function analyzeRefImage(refImage) {
  return post('/images/analyze-ref', { ref_image: refImage });
}

function expandRefPrompt(prompt, refAnalysis, style, styleTokens = [], strength = 0.75) {
  return post('/images/expand-ref-prompt', {
    prompt,
    ref_analysis: refAnalysis,
    ...(style ? { style } : {}),
    style_tokens: styleTokens,
    strength,
  });
}

module.exports = {
  analyzePrompt,
  getClarificationQuestions,
  resolveClarification,
  generateStoryboard,
  generateNarration,
  criticEvaluate,
  processReels,
  renderReel,
  generatePresentation,
  exportPresentationPptx,
  narratePresentationSlide,
  importPresentationPptx,
  transcribeCaptions,
  expandImagePrompt,
  analyzeRefImage,
  expandRefPrompt,
};




