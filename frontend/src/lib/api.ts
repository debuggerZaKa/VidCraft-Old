// Thin typed client over the backend REST API. Requests hit the Vite dev
// proxy at /api (vite.config.ts), which forwards to the Express backend on
// :5000. Override with VITE_API_URL in production builds.
//
// When `demo` is true, calls resolve from local sample data (lib/demo.ts)
// instead — used so the UI is fully explorable while the backend/ai-service
// stack is offline.

import type {
  AnalyzeResponse,
  ClarifyResponse,
  GenerateResponse,
  ImageProvider,
  JobStatus,
  RenderProvider,
  Shot,
  SingleImageResponse,
  StoryboardResponse,
} from './types'
import {
  demoAnalyze,
  demoClarify,
  demoGetJob,
  demoSingleImage,
  demoStartGeneration,
  demoStoryboard,
} from './demo'

const BASE = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  status: number
  offline: boolean
  constructor(status: number, message: string, offline = false) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.offline = offline
  }
}

// 0 (fetch threw) and 502/503/504 (dev proxy can't reach :5000) all mean the
// backend stack isn't up — surface that as an "offline" error so the UI can
// offer Demo Mode instead of showing a raw status code.
const OFFLINE_STATUSES = new Set([0, 502, 503, 504])

async function request<T>(path: string, body: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'Backend not reachable on :5000.', true)
  }

  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    /* non-JSON (e.g. proxy error page) */
  }

  if (!res.ok) {
    if (OFFLINE_STATUSES.has(res.status)) {
      throw new ApiError(res.status, 'Backend not reachable on :5000.', true)
    }
    const msg =
      (data as { error?: string; message?: string })?.error ??
      (data as { message?: string })?.message ??
      `Request failed (${res.status})`
    throw new ApiError(res.status, msg)
  }

  return data as T
}

// GET variant of the above (no body) — for polling job status.
async function getRequest<T>(path: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}/api${path}`)
  } catch {
    throw new ApiError(0, 'Backend not reachable on :5000.', true)
  }

  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    /* non-JSON */
  }

  if (!res.ok) {
    if (OFFLINE_STATUSES.has(res.status)) {
      throw new ApiError(res.status, 'Backend not reachable on :5000.', true)
    }
    const msg =
      (data as { error?: string; message?: string })?.error ??
      (data as { message?: string })?.message ??
      `Request failed (${res.status})`
    throw new ApiError(res.status, msg)
  }

  return data as T
}

export function analyzePrompt(prompt: string, demo = false) {
  return demo ? demoAnalyze(prompt) : request<AnalyzeResponse>('/prompts', { prompt })
}

export function clarifyPrompt(
  promptId: string,
  questions: string[],
  answers: string[],
  demo = false,
) {
  return demo
    ? demoClarify(answers)
    : request<ClarifyResponse>(`/prompts/${promptId}/clarify`, {
        questions,
        answers,
      })
}

export function generateStoryboard(
  promptId: string,
  styleTokens: string[] = [],
  renderProvider: RenderProvider = 'remotion',
  demo = false,
) {
  // styleTokens (FRONTEND-003) are sent in the payload so the ai-service can
  // seed world_state.style_tokens. The backend currently ignores the extra
  // field (see PROJECT_ARCHITECTURE.md §9 — full wiring is INTEG-001); demo
  // mode reflects them locally. renderProvider (ADR-020) IS consumed by the
  // real backend (BACKEND-006) — stamped onto every shot.
  return demo
    ? demoStoryboard(styleTokens, renderProvider)
    : request<StoryboardResponse>('/storyboards', {
        promptId,
        styleTokens,
        renderProvider,
      })
}

// INTEG-001 (ADR-023): kick off async generation for a created storyboard.
// Returns a job handle (202); poll pollJob() below. `shots` is only used in
// demo mode (to simulate per-shot generation client-side) — the real backend
// derives everything from the storyboard id.
export function startGeneration(
  storyboardId: string,
  shots: Shot[],
  demo = false,
) {
  return demo
    ? demoStartGeneration(shots)
    : request<GenerateResponse>(`/storyboards/${storyboardId}/generate`, {})
}

// Poll a generation job's status (GET /api/jobs/:id).
export function getJob(jobId: string, demo = false) {
  return demo ? demoGetJob(jobId) : getRequest<JobStatus>(`/jobs/${jobId}`)
}

// Single-image mode: skips the Screenwriter/storyboard decomposition
// entirely (POST /api/images) — one enhanced-prompt-in, one image-out.
export function generateSingleImage(
  promptId: string,
  provider: ImageProvider,
  styleTokens: string[] = [],
  useCorpus = true,
  seed?: number,
  refImageOrDemo?: string | boolean,
  strength?: number,
  demo = false,
  steps?: number,
) {
  const isRefString = typeof refImageOrDemo === 'string'
  const isDemo = typeof refImageOrDemo === 'boolean' ? refImageOrDemo : demo
  const refImage = isRefString ? refImageOrDemo : undefined

  return isDemo
    ? demoSingleImage(promptId, provider, styleTokens)
    : request<SingleImageResponse>('/images', {
        promptId,
        provider,
        styleTokens,
        useCorpus,
        seed,
        refImage,
        strength,
        steps,
      })
}

export async function generateImageComparison(
  promptId: string,
  provider: ImageProvider,
  styleTokens: string[] = [],
  seed?: number,
  refImageOrDemo?: string | boolean,
  strength?: number,
  demo = false,
  steps?: number,
): Promise<{
  promptId: string
  provider: ImageProvider
  seed: number
  withoutCorpus: SingleImageResponse
  withCorpus: SingleImageResponse | null
  counterpartError?: string | null
}> {
  const isRefString = typeof refImageOrDemo === 'string'
  const isDemo = typeof refImageOrDemo === 'boolean' ? refImageOrDemo : demo
  const refImage = isRefString ? refImageOrDemo : undefined

  if (isDemo) {
    const single = await demoSingleImage(promptId, provider, styleTokens)
    return {
      promptId,
      provider,
      seed: seed ?? 42,
      withoutCorpus: { ...single, useCorpus: false },
      withCorpus: { ...single, useCorpus: true },
    }
  }
  return request('/images/compare', {
    promptId,
    provider,
    styleTokens,
    seed,
    refImage,
    strength,
    steps,
  })
}

// --- Reels & Shorts Studio API ---

export async function uploadReelVideo(file: File): Promise<{
  filename: string
  originalName: string
  size: number
  videoPath: string
  videoUrl: string
}> {
  const formData = new FormData()
  formData.append('video', file)

  let res: Response
  try {
    res = await fetch(`${BASE}/api/reels/upload`, {
      method: 'POST',
      body: formData,
    })
  } catch {
    throw new ApiError(0, 'Backend not reachable on :5000.', true)
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(res.status, (data as { error?: string })?.error || 'Video upload failed')
  }
  return data
}

export function processReelVideo(
  videoPath: string,
  filename?: string,
  options?: import('./types').ReelProcessOptions,
) {
  return request<import('./types').ReelProcessResponse>('/reels/process', {
    videoPath,
    filename,
    autoRenderFirst: false,
    aspectRatio: options?.aspectRatio || '9:16',
    durationMode: options?.durationMode || 'auto',
    targetCount: options?.targetCount,
    timeRange: options?.timeRange,
    layoutMode: options?.layoutMode || 'blur',
    subtitleStyle: options?.subtitleStyle || 'hormozi',
    subtitlePosition: options?.subtitlePosition || 'bottom',
    fontSizeChoice: options?.fontSizeChoice || 'standard',
    trimSilence: options?.trimSilence || false,
    bgmPreset: options?.bgmPreset || 'none',
  })
}

export function renderReelClip(
  videoPath: string,
  startTime: number,
  endTime: number,
  words?: import('./types').ReelWord[],
  options?: import('./types').ReelRenderOptions | import('./types').ReelAspectRatio,
) {
  // Support either passing just aspectRatio or a full options object
  const opts: import('./types').ReelRenderOptions =
    typeof options === 'string'
      ? { aspectRatio: options }
      : options || {}

  return request<{ status: string; reel: import('./types').ReelRenderedData }>('/reels/render', {
    videoPath,
    startTime,
    endTime,
    words: words || [],
    aspectRatio: opts.aspectRatio || '9:16',
    layoutMode: opts.layoutMode || 'blur',
    subtitleStyle: opts.subtitleStyle || 'hormozi',
    subtitlePosition: opts.subtitlePosition || 'bottom',
    fontSizeChoice: opts.fontSizeChoice || 'standard',
    trimSilence: opts.trimSilence || false,
    bgmPreset: opts.bgmPreset || 'none',
  })
}

export function batchRenderReelClips(
  videoPath: string,
  startTime: number,
  endTime: number,
  words?: import('./types').ReelWord[],
  ratios: import('./types').ReelAspectRatio[] = ['9:16', '1:1', '16:9'],
  options?: import('./types').ReelRenderOptions,
) {
  return request<{ status: string; renders: import('./types').ReelRenderedData[] }>('/reels/batch-render', {
    videoPath,
    startTime,
    endTime,
    words: words || [],
    ratios,
    layoutMode: options?.layoutMode || 'blur',
    subtitleStyle: options?.subtitleStyle || 'hormozi',
    subtitlePosition: options?.subtitlePosition || 'bottom',
    fontSizeChoice: options?.fontSizeChoice || 'standard',
    trimSilence: options?.trimSilence || false,
    bgmPreset: options?.bgmPreset || 'none',
  })
}

// Presentation Studio Endpoints
export async function generatePresentation(
  params: import('./types').GeneratePresentationParams,
) {
  return request<{ status: string; deck: import('./types').PresentationDeck }>(
    '/presentations/generate',
    params,
  )
}

export async function exportPresentationPptx(
  deck: import('./types').PresentationDeck,
  filename?: string,
) {
  return request<{ status: string; downloadUrl: string; filename: string }>(
    '/presentations/export-pptx',
    { deck, filename },
  )
}

export async function narratePresentationSlide(text: string, voice?: string) {
  return request<{
    duration_s: number
    audio_base64: string
    voice: string
  }>('/presentations/narrate', { text, voice })
}

// Auto Captioning Studio API Endpoints
export async function uploadCaptionMedia(file: File) {
  const formData = new FormData()
  formData.append('media', file)

  let res: Response
  try {
    res = await fetch(`${BASE}/api/captions/upload`, {
      method: 'POST',
      body: formData,
    })
  } catch {
    throw new ApiError(0, 'Backend not reachable on :5000.', true)
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(res.status, (data as { error?: string })?.error || 'Media upload failed')
  }
  return data as {
    status: string
    filename: string
    originalName: string
    mediaPath: string
    mediaUrl: string
    isAudioOnly: boolean
  }
}

export function transcribeCaptionMedia(mediaPath: string, language?: string, filename?: string) {
  return request<import('./types').CaptionTranscribeResponse>('/captions/transcribe', {
    mediaPath,
    filename,
    language,
  })
}

export function exportCaptionSubtitles(
  format: 'srt' | 'vtt' | 'ass' | 'txt' | 'json',
  words: import('./types').CaptionWord[],
  settings: import('./types').CaptionSettings,
  title?: string,
) {
  return request<{
    status: string
    filename: string
    downloadUrl: string
    content: string
  }>('/captions/export', {
    format,
    words,
    settings,
    title,
  })
}




