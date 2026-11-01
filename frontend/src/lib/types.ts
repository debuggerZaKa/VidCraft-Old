// Shared API types — mirror the backend REST contract
// (backend/src/routes/prompts.js, storyboards.js) and the ai-service
// analyzer schema (ai-service/analyzer/scoring.py).

export type DimensionKey =
  | 'subject_clarity'
  | 'action_specificity'
  | 'environment_detail'
  | 'visual_richness'
  | 'temporal_coherence'

export type Dimensions = Record<DimensionKey, number>

export interface Analysis {
  overall_score: number
  dimensions: Dimensions
  flags: string[]
  suggestions: string[]
}

export interface AnalyzeResponse {
  promptId: string
  analysis: Analysis
  clarificationQuestions?: string[]
}

// The ai-service returns `brief` as a structured object (e.g.
// {setting, style, lighting}) whose keys vary with the LLM output; older
// paths may return a plain string. Handle both.
export type Brief = string | Record<string, string>

export interface ClarifyResponse {
  clarifiedPrompt: string
  brief: Brief
}

export type Pathway = 'remotion' | 'external_api'

// FR-6 / ADR-020: the user picks exactly one of these, by name, before
// generation — no agent decides this anymore (Producer/Router, AI-005,
// is retired).
export type RenderProvider = 'remotion' | 'pollinations' | 'cloudflare' | 'huggingface'

// The subset of RenderProvider that can generate a single still image on
// demand (single-image mode, POST /api/images) — mirrors backend
// constants/renderProviders.js's IMAGE_PROVIDERS.
export type ImageProvider = 'huggingface' | 'pollinations' | 'cloudflare'

// Single-image mode skips the Screenwriter/storyboard shot decomposition
// entirely and generates exactly one image from the enhanced prompt;
// storyboard mode is the existing multi-shot flow (stills or video,
// depending on which RenderProvider is picked within it).
export type GenerationMode = 'single_image' | 'storyboard'

export type ShotStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  // 'on_hold' = deliberately not attempted (currently the huggingface video
  // provider, paused pending a paid key) — distinct from 'failed'.
  | 'on_hold'

export interface Shot {
  shot_id: number
  description: string
  camera: string
  duration_s: number
  pathway: Pathway
  provider: RenderProvider
  status?: ShotStatus
  retry_count?: number
  // Populated by generation (INTEG-001): the public /media URL of the
  // rendered/generated asset, and any per-shot error/hold message.
  asset_url?: string
  error?: string
  // CRITIC-001 (FR-8): the vision model's verdict on this shot's most recent
  // asset. `null` until the critic has actually run — a shot that failed or
  // was held never reaches it, and Remotion-pathway shots are skipped by
  // design (ADR-026). `retry_count` above doubles as the critic's retry
  // counter, bounded by CRITIC_MAX_RETRIES.
  critic_passed?: boolean | null
  critic_reason?: string
}

export interface WorldState {
  characters: string[]
  setting: string
  style_tokens: string[]
  reference_image_url?: string
}

export interface StoryboardResponse {
  storyboardId: string
  status: string
  worldState: WorldState
  shots: Shot[]
}

// POST /api/storyboards/:id/generate response (INTEG-001, ADR-023) — async:
// returns a job handle, not the finished storyboard. Poll GET /api/jobs/:id.
export interface GenerateResponse {
  jobId: string
  storyboardId: string
  status: string
}

// GET /api/jobs/:id response (INTEG-001). `state` is the Bull job lifecycle
// (waiting | active | delayed | completed | failed | paused | stuck), plus our
// initial 'queued'; `progress` is 0–100; `shots` carries the live per-shot
// status/asset_url/error from the storyboard doc.
export interface JobStatus {
  jobId: string
  state: string
  progress: number
  storyboardId: string | null
  failedReason?: string
  shots: Shot[]
  // FR-9: the assembled final video — every generated shot concatenated into
  // one MP4, held for its own duration_s, with per-shot camera movement.
  // Absent until the run finishes. `videoError` is set when the per-shot
  // assets succeeded but the stitch itself didn't, which is a different (and
  // much less bad) outcome than the generation failing.
  videoUrl?: string
  videoError?: string
  // FR-9 post-processing (INTEG-002). Independently optional — post-processing
  // is best-effort per artifact and never touches the video above, so a run can
  // legitimately have a video with captions but no poster frame.
  // `thumbnailUrl` is the poster; `subtitlesUrl` is a WebVTT track the <video>
  // element can display natively; `subtitledVideoUrl` is a hardsubbed copy for
  // downloading (captions survive outside a captioning player).
  // `postprocessError` describes only what wasn't produced.
  thumbnailUrl?: string
  subtitlesUrl?: string
  subtitledVideoUrl?: string
  postprocessError?: string
}

// POST /api/images response (single-image mode) — no storyboard/shots,
// just the prompt before/after enhancement and the one generated image.
export interface SingleImageResponse {
  promptId: string
  provider: ImageProvider
  originalPrompt: string
  enhancedPrompt: string
  imageUrl: string
  useCorpus?: boolean
  seed?: number
  negativePrompt?: string | null
  style?: {
    id: string
    name: string
    category?: string
    source?: string
  }
  lighting?: string | null
  camera?: string | null
  exemplarsUsed?: string[]
  subjectAnchor?: string | null
  refImage?: string
  comparison?: {
    withoutCorpus: SingleImageResponse
    withCorpus?: SingleImageResponse | null
    counterpartError?: string | null
  }
}

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  subject_clarity: 'Subject clarity',
  action_specificity: 'Action specificity',
  environment_detail: 'Environment detail',
  visual_richness: 'Visual richness',
  temporal_coherence: 'Temporal coherence',
}

// --- Reels & Shorts Studio Types ---
export type ReelAspectRatio = '9:16' | '1:1' | '16:9' | '4:5'
export type ReelDurationMode = 'auto' | 'short' | 'standard' | 'extended'
export type ReelLayoutMode = 'blur' | 'face_track' | 'split_screen' | 'direct_crop'
export type ReelSubtitleStyle = 'hormozi' | 'beast' | 'minimal' | 'cyberpunk' | 'urdu_nastaliq' | 'urdu_gulzar'
export type ReelSubtitlePosition = 'bottom' | 'middle' | 'top'
export type ReelFontSize = 'compact' | 'standard' | 'large'
export type ReelBgmPreset = 'none' | 'lofi' | 'motivational' | 'tension'

export interface ReelRenderOptions {
  aspectRatio?: ReelAspectRatio
  layoutMode?: ReelLayoutMode
  subtitleStyle?: ReelSubtitleStyle
  subtitlePosition?: ReelSubtitlePosition
  fontSizeChoice?: ReelFontSize
  trimSilence?: boolean
  bgmPreset?: ReelBgmPreset
}

export interface ReelProcessOptions extends ReelRenderOptions {
  durationMode?: ReelDurationMode
  targetCount?: number
  timeRange?: [number, number]
}

export interface ReelRenderedData {
  reel_id: string
  filename: string
  video_path?: string
  reelUrl: string
  start_time: number
  end_time: number
  duration: number
  aspect_ratio?: ReelAspectRatio
}

export interface ReelClip {
  id: number
  title: string
  topic?: string
  summary?: string
  hook: string
  start_time: number
  end_time: number
  duration: number
  virality_score: number
  virality_reason: string
  suggested_caption?: string
  rendered_reel?: ReelRenderedData
  batch_renders?: ReelRenderedData[]
}

export interface ReelWord {
  word: string
  start: number
  end: number
}

export interface ReelProcessResponse {
  status: string
  video_path: string
  aspect_ratio?: string
  layout_mode?: string
  subtitle_style?: string
  transcription: {
    text: string
    word_count: number
    segment_count: number
    is_simulated?: boolean
  }
  full_srt?: string
  full_txt?: string
  words: ReelWord[]
  clips: ReelClip[]
}

// Presentation Studio Types
export interface SlideTheme {
  name: string
  bg_color: string
  card_bg: string
  text_primary: string
  text_secondary: string
  accent: string
  accent_secondary?: string
  font_heading?: string
  font_body?: string
}

export type SlideLayout =
  | 'title_cover'
  | 'hero_split'
  | 'three_column'
  | 'stat_callout'
  | 'chart_slide'
  | 'timeline'
  | 'quote'

export interface ColumnItem {
  title: string
  desc: string
}

export interface TimelineStep {
  step: string
  label: string
}

export interface ChartData {
  title?: string
  labels: string[]
  values: number[]
  unit?: string
}

export interface PresentationSlide {
  id: string
  slide_index: number
  layout: SlideLayout
  title: string
  subtitle?: string
  bullet_points: string[]
  speaker_notes: string
  stat_number?: string
  stat_label?: string
  chart_data?: ChartData
  column_items?: ColumnItem[]
  timeline_steps?: TimelineStep[]
  unsplash_keyword?: string
  visual_prompt?: string
  visual_url?: string
  duration_s: number
  audio_url?: string | null
}

export interface PresentationDeck {
  deck_id: string
  title: string
  subtitle?: string
  category?: string
  theme_key: string
  theme: SlideTheme
  master_template?: string
  slides: PresentationSlide[]
  total_slides: number
  total_duration_s: number
}

export interface GeneratePresentationParams {
  topic: string
  target_slides?: number
  theme_key?: string
  master_template?: string
  audience?: string
  tone?: string
}

// Auto Captioning Studio Types
export interface CaptionWord {
  id?: string
  word: string
  start: number
  end: number
}

export type CaptionCategory = 'urdu' | 'english'

export interface CaptionFontOption {
  id: string
  name: string
  family: string
  category: CaptionCategory
  script: 'Urdu Nastaliq' | 'Urdu / Arabic' | 'English / Latin'
  description: string
  previewText: string
  isUrdu?: boolean
}

export interface CaptionEffectOption {
  id: string
  name: string
  tagline: string
  description: string
  category: 'kinetic' | 'glow' | '3d' | 'creative' | 'motion'
  cssClass: string
  popular?: boolean
}

export interface CaptionSettings {
  fontFamily: string
  fontSize: number
  fontWeight: number
  letterSpacing: number
  lineHeight: number
  textTransform: 'none' | 'uppercase' | 'capitalize' | 'lowercase'
  activeTextColor: string
  inactiveTextColor: string
  accentTextColor: string
  strokeColor: string
  strokeWidth: number
  shadowColor: string
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  shadowOpacity: number
  boxEnabled: boolean
  boxColor: string
  boxOpacity: number
  boxPaddingX: number
  boxPaddingY: number
  boxBorderRadius: number
  effect: string
  position: 'bottom' | 'middle' | 'top' | 'custom'
  positionY: number
  textAlign: 'center' | 'left' | 'right'
  direction: 'auto' | 'rtl' | 'ltr'
  wordsPerBatch: number
  // Box Geometry, Drag & Drop, Sizing, Rotation & Cropping
  boxX: number
  boxY: number
  boxWidth: number
  boxHeight?: number
  boxRotation: number
  boxCropEnabled: boolean
  boxCropTop: number
  boxCropBottom: number
  boxCropLeft: number
  boxCropRight: number
  boxBorderWidth: number
  boxBorderStyle: 'none' | 'solid' | 'dashed' | 'dotted' | 'neon'
  boxBorderColor: string
}

export interface CaptionTranscribeResponse {
  status: string
  text: string
  language: string
  words: CaptionWord[]
  segments?: Array<{ id: number; start: number; end: number; text: string }>
  audioUrl?: string
  is_simulated?: boolean
}




