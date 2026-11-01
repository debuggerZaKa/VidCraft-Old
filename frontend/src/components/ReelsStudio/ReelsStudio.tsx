import { useState, useRef } from 'react'
import {
  Upload,
  Sparkles,
  Flame,
  Clock,
  Download,
  Copy,
  Check,
  Film,
  Scissors,
  Subtitles,
  Loader2,
  RefreshCw,
  AlertCircle,
  FileVideo,
  Sliders,
  Ratio,
  Timer,
  Hash,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Layers,
  UserCheck,
  Users,
  Music,
  FileText,
  Type,
  Volume2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  uploadReelVideo,
  processReelVideo,
  renderReelClip,
  batchRenderReelClips,
  ApiError,
} from '@/lib/api'
import type {
  ReelClip,
  ReelProcessResponse,
  ReelAspectRatio,
  ReelDurationMode,
  ReelLayoutMode,
  ReelSubtitleStyle,
  ReelSubtitlePosition,
  ReelFontSize,
  ReelBgmPreset,
  ReelRenderedData,
} from '@/lib/types'

type Step = 'idle' | 'uploading' | 'transcribing' | 'analyzing' | 'rendering' | 'ready'

export function ReelsStudio() {
  const [file, setFile] = useState<File | null>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
  const [uploadedVideoPath, setUploadedVideoPath] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ReelProcessResponse | null>(null)
  const [activeClip, setActiveClip] = useState<ReelClip | null>(null)
  const [renderingClipId, setRenderingClipId] = useState<number | string | null>(null)
  const [batchRenderingClipId, setBatchRenderingClipId] = useState<number | string | null>(null)
  const [copiedId, setCopiedId] = useState<number | string | null>(null)

  // Configuration Controls (with defaults for zero-friction generation)
  const [aspectRatio, setAspectRatio] = useState<ReelAspectRatio>('9:16')
  const [durationMode, setDurationMode] = useState<ReelDurationMode>('extended') // 1.5 - 3.5 mins
  const [targetClipCount, setTargetClipCount] = useState<number>(0) // 0 = Auto
  const [enableTimeRange, setEnableTimeRange] = useState(false)
  const [timeRangeStart, setTimeRangeStart] = useState<string>('00:00')
  const [timeRangeEnd, setTimeRangeEnd] = useState<string>('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Option 1: Layout & Framing (Default: 'blur')
  const [layoutMode, setLayoutMode] = useState<ReelLayoutMode>('blur')

  // Option 2: Subtitle Styling & Positioning (Default: 'hormozi', 'bottom', 'standard')
  const [subtitleStyle, setSubtitleStyle] = useState<ReelSubtitleStyle>('hormozi')
  const [subtitlePosition, setSubtitlePosition] = useState<ReelSubtitlePosition>('bottom')
  const [fontSizeChoice, setFontSizeChoice] = useState<ReelFontSize>('standard')

  // Option 3: Audio Pacing & BGM (Default: trimSilence: false, bgmPreset: 'none')
  const [trimSilence, setTrimSilence] = useState<boolean>(false)
  const [bgmPreset, setBgmPreset] = useState<ReelBgmPreset>('none')

  // Option 5: Batch renders cache per clip
  const [batchRendersMap, setBatchRendersMap] = useState<Record<number | string, ReelRenderedData[]>>({})

  // Custom Cut Form
  const [showCustomCut, setShowCustomCut] = useState(false)
  const [customTitle, setCustomTitle] = useState('')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [customAspect, setCustomAspect] = useState<ReelAspectRatio>('9:16')

  const fileInputRef = useRef<HTMLInputElement>(null)

  function parseTimeToSeconds(timeStr: string): number | null {
    if (!timeStr || !timeStr.trim()) return null
    const parts = timeStr.trim().split(':').map(Number)
    if (parts.some(isNaN)) return null
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1]
    }
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    return Number(timeStr) || null
  }

  function formatSeconds(secs: number): string {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}m ${s < 10 ? '0' : ''}${s}s`
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return

    setFile(selected)
    setVideoPreviewUrl(URL.createObjectURL(selected))
    setError(null)
    setResult(null)
    setActiveClip(null)
    setBatchRendersMap({})
    setStep('idle')
  }

  async function handleStartPipeline() {
    if (!file) return

    setError(null)
    try {
      // Step 1: Upload
      setStep('uploading')
      const uploadRes = await uploadReelVideo(file)
      setUploadedVideoPath(uploadRes.videoPath)

      // Calculate time range if specified
      let range: [number, number] | undefined = undefined
      if (enableTimeRange) {
        const s = parseTimeToSeconds(timeRangeStart) ?? 0
        const e = parseTimeToSeconds(timeRangeEnd)
        if (e && e > s) {
          range = [s, e]
        }
      }

      // Step 2 & 3: Transcribe & Detect viral moments with full video comprehension
      setStep('transcribing')
      const procRes = await processReelVideo(uploadRes.videoPath, uploadRes.filename, {
        aspectRatio,
        durationMode,
        targetCount: targetClipCount > 0 ? targetClipCount : undefined,
        timeRange: range,
        layoutMode,
        subtitleStyle,
        subtitlePosition,
        fontSizeChoice,
        trimSilence,
        bgmPreset,
      })

      setResult(procRes)
      if (procRes.clips && procRes.clips.length > 0) {
        setActiveClip(procRes.clips[0])
      }
      setStep('ready')
    } catch (err: unknown) {
      setStep('idle')
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError(err instanceof Error ? err.message : 'Processing failed. Please try again.')
      }
    }
  }

  async function handleRenderSpecificClip(
    clip: ReelClip,
    targetRatio: ReelAspectRatio = aspectRatio,
  ) {
    if (!uploadedVideoPath || !result) return
    setRenderingClipId(clip.id)
    setError(null)
    try {
      const renderRes = await renderReelClip(
        uploadedVideoPath,
        clip.start_time,
        clip.end_time,
        result.words,
        {
          aspectRatio: targetRatio,
          layoutMode,
          subtitleStyle,
          subtitlePosition,
          fontSizeChoice,
          trimSilence,
          bgmPreset,
        },
      )

      const updatedClips = result.clips.map((c) =>
        c.id === clip.id ? { ...c, rendered_reel: renderRes.reel } : c,
      )
      const updatedResult = { ...result, clips: updatedClips }
      setResult(updatedResult)
      setActiveClip({ ...clip, rendered_reel: renderRes.reel })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Clip rendering failed.')
    } finally {
      setRenderingClipId(null)
    }
  }

  // Option 5: Multi-ratio Batch Export (9:16 + 1:1 + 16:9)
  async function handleBatchRenderClip(clip: ReelClip) {
    if (!uploadedVideoPath || !result) return
    setBatchRenderingClipId(clip.id)
    setError(null)
    try {
      const batchRes = await batchRenderReelClips(
        uploadedVideoPath,
        clip.start_time,
        clip.end_time,
        result.words,
        ['9:16', '1:1', '16:9'],
        {
          layoutMode,
          subtitleStyle,
          subtitlePosition,
          fontSizeChoice,
          trimSilence,
          bgmPreset,
        },
      )

      const updatedBatchMap = {
        ...batchRendersMap,
        [clip.id]: batchRes.renders,
      }
      setBatchRendersMap(updatedBatchMap)

      const mainReel =
        batchRes.renders.find((r) => r.aspect_ratio === aspectRatio) || batchRes.renders[0]
      const updatedClips = result.clips.map((c) =>
        c.id === clip.id
          ? { ...c, rendered_reel: mainReel, batch_renders: batchRes.renders }
          : c,
      )
      setResult({ ...result, clips: updatedClips })
      if (activeClip?.id === clip.id) {
        setActiveClip({ ...activeClip, rendered_reel: mainReel, batch_renders: batchRes.renders })
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Batch rendering failed.')
    } finally {
      setBatchRenderingClipId(null)
    }
  }

  async function handleCreateCustomClip() {
    if (!uploadedVideoPath || !result) return
    const s = parseTimeToSeconds(customStart)
    const e = parseTimeToSeconds(customEnd)
    if (s === null || e === null || e <= s) {
      setError('Please provide valid Start and End times (e.g. 02:30 to 04:45).')
      return
    }

    setRenderingClipId('custom')
    setError(null)
    try {
      const renderRes = await renderReelClip(
        uploadedVideoPath,
        s,
        e,
        result.words,
        {
          aspectRatio: customAspect,
          layoutMode,
          subtitleStyle,
          subtitlePosition,
          fontSizeChoice,
          trimSilence,
          bgmPreset,
        },
      )

      const newClip: ReelClip = {
        id: result.clips.length + 1,
        title: customTitle.trim() || `Custom Clip (${formatSeconds(e - s)})`,
        topic: customTitle.trim() || 'Custom Selected Shot',
        summary: `User custom cut from ${customStart} to ${customEnd}`,
        hook: `Custom clip segment [${customStart} - ${customEnd}]`,
        start_time: s,
        end_time: e,
        duration: e - s,
        virality_score: 95,
        virality_reason: 'Custom curated user selection with exact timestamps.',
        suggested_caption: `${customTitle.trim() || 'Key takeaway'} 🔥 #insight #clip`,
        rendered_reel: renderRes.reel,
      }

      const updatedClips = [newClip, ...result.clips]
      setResult({ ...result, clips: updatedClips })
      setActiveClip(newClip)
      setShowCustomCut(false)
      setCustomTitle('')
      setCustomStart('')
      setCustomEnd('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Custom clip rendering failed.')
    } finally {
      setRenderingClipId(null)
    }
  }

  // Option 6: Transcript & Subtitles Exporters
  function downloadTextFile(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleDownloadFullSrt() {
    if (result?.full_srt) {
      downloadTextFile('full_video_subtitles.srt', result.full_srt)
    } else if (result?.words) {
      const formatTime = (s: number) => {
        const h = Math.floor(s / 3600)
        const m = Math.floor((s % 3600) / 60)
        const sec = Math.floor(s % 60)
        const ms = Math.floor((s % 1) * 1000)
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms).padStart(3, '0')}`
      }
      let srt = ''
      let idx = 1
      for (let i = 0; i < result.words.length; i += 4) {
        const grp = result.words.slice(i, i + 4)
        srt += `${idx}\n${formatTime(grp[0].start)} --> ${formatTime(grp[grp.length - 1].end)}\n${grp.map((w) => w.word).join(' ')}\n\n`
        idx++
      }
      downloadTextFile('full_video_subtitles.srt', srt)
    }
  }

  function handleDownloadFullTxt() {
    if (result?.full_txt) {
      downloadTextFile('full_video_transcript.txt', result.full_txt)
    } else if (result?.transcription?.text) {
      downloadTextFile('full_video_transcript.txt', result.transcription.text)
    }
  }

  function handleDownloadClipSrt(clip: ReelClip) {
    if (!result?.words) return
    const clipWords = result.words.filter(
      (w) => w.start >= clip.start_time - 0.2 && w.end <= clip.end_time + 0.2,
    )
    const formatTime = (s: number) => {
      const h = Math.floor(s / 3600)
      const m = Math.floor((s % 3600) / 60)
      const sec = Math.floor(s % 60)
      const ms = Math.floor((s % 1) * 1000)
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms).padStart(3, '0')}`
    }
    let srt = ''
    let idx = 1
    for (let i = 0; i < clipWords.length; i += 4) {
      const group = clipWords.slice(i, i + 4)
      const startS = Math.max(0, group[0].start - clip.start_time)
      const endS = Math.max(startS + 0.4, group[group.length - 1].end - clip.start_time)
      srt += `${idx}\n${formatTime(startS)} --> ${formatTime(endS)}\n${group.map((w) => w.word).join(' ')}\n\n`
      idx++
    }
    const cleanTitle = (clip.topic || clip.title).replace(/[^a-zA-Z0-9_-]/g, '_')
    downloadTextFile(`${cleanTitle}_subtitles.srt`, srt)
  }

  function handleCopyCaption(clip: ReelClip) {
    if (!clip.suggested_caption) return
    navigator.clipboard.writeText(clip.suggested_caption)
    setCopiedId(clip.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function resetAll() {
    setFile(null)
    setVideoPreviewUrl(null)
    setUploadedVideoPath(null)
    setStep('idle')
    setResult(null)
    setActiveClip(null)
    setBatchRendersMap({})
    setError(null)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Top Hero Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
          <Sparkles className="size-3.5" />
          Intelligent Video Repurposer & Reel Studio
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Turn Long Videos Into <span className="text-primary">Complete, High-Value Clips</span>
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-3xl mx-auto">
          Deep topic discovery, full dialogues (1.5 to 3.5 mins), smart framing layouts, subtitle
          styling, and multi-format batch exports.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive flex items-start gap-3">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Notice</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Settings & Configuration Card (Pre-configured defaults ready for lazy users) */}
      {step === 'idle' && !result && (
        <Card className="border-border/80 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2 font-semibold text-base">
                <Sliders className="size-4 text-primary" />
                <span>Video Generation & Formatting Controls</span>
                <span className="text-xs font-normal text-muted-foreground ml-2">
                  (Defaults are pre-selected for optimal engagement)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-muted-foreground gap-1"
              >
                {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced / Time Cut'}
                {showAdvanced ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              </Button>
            </div>

            {/* Core Row 1: Aspect Ratio, Length, Clip Count */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 1. Aspect Ratio */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Ratio className="size-3.5 text-primary" />
                  Primary Aspect Ratio
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAspectRatio('9:16')}
                    className={`p-2.5 rounded-lg border text-xs font-semibold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      aspectRatio === '9:16'
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-border/70 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <span className="font-bold text-sm">9:16 (Default)</span>
                    <span className="text-[10px] opacity-80">Reels / TikTok</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio('1:1')}
                    className={`p-2.5 rounded-lg border text-xs font-semibold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      aspectRatio === '1:1'
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-border/70 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <span className="font-bold text-sm">1:1</span>
                    <span className="text-[10px] opacity-80">Square Feed</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio('16:9')}
                    className={`p-2.5 rounded-lg border text-xs font-semibold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      aspectRatio === '16:9'
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-border/70 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <span className="font-bold text-sm">16:9</span>
                    <span className="text-[10px] opacity-80">Landscape</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio('4:5')}
                    className={`p-2.5 rounded-lg border text-xs font-semibold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      aspectRatio === '4:5'
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-border/70 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <span className="font-bold text-sm">4:5</span>
                    <span className="text-[10px] opacity-80">Portrait Feed</span>
                  </button>
                </div>
              </div>

              {/* 2. Clip Length / Depth */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Timer className="size-3.5 text-primary" />
                  Clip Length Preference
                </label>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setDurationMode('extended')}
                    className={`w-full p-2 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                      durationMode === 'extended'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/70 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <div className="font-bold">Deep Topic (1.5 – 3.5 mins) ★ Default</div>
                    <div className="text-[10px] opacity-80">Full thought, no hurried cuts</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationMode('standard')}
                    className={`w-full p-2 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                      durationMode === 'standard'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/70 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <div className="font-bold">Standard Narrative (60 – 120s)</div>
                    <div className="text-[10px] opacity-80">Balanced story & pacing</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationMode('short')}
                    className={`w-full p-2 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                      durationMode === 'short'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/70 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <div className="font-bold">Quick Hook (30 – 60s)</div>
                    <div className="text-[10px] opacity-80">Fast-paced soundbites</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationMode('auto')}
                    className={`w-full p-2 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                      durationMode === 'auto'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/70 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <div className="font-bold">Auto (Adaptive)</div>
                    <div className="text-[10px] opacity-80">AI fits duration to topic</div>
                  </button>
                </div>
              </div>

              {/* 3. Number of Clips */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Hash className="size-3.5 text-primary" />
                  Total Clips to Generate
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetClipCount(0)}
                    className={`p-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      targetClipCount === 0
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/70 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <div className="font-bold">Auto Detect (Default)</div>
                    <div className="text-[10px] opacity-80">Based on video length</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetClipCount(5)}
                    className={`p-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      targetClipCount === 5
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/70 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <div className="font-bold">5 Clips</div>
                    <div className="text-[10px] opacity-80">Top 5 core topics</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetClipCount(8)}
                    className={`p-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      targetClipCount === 8
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/70 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <div className="font-bold">8 Clips</div>
                    <div className="text-[10px] opacity-80">Great for 20-30m</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetClipCount(10)}
                    className={`p-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      targetClipCount === 10
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/70 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <div className="font-bold">10 Clips</div>
                    <div className="text-[10px] opacity-80">Comprehensive set</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Core Row 2: Layout Framing (Option 1) & Subtitle Styling (Option 2) */}
            <div className="pt-4 border-t border-border/60 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option 1: Video Framing & Layout Mode */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Layers className="size-3.5 text-primary" />
                  Option 1: Framing & Layout Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLayoutMode('blur')}
                    className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                      layoutMode === 'blur'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/70 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-bold">
                      <Layers className="size-3.5 text-primary" />
                      Ambient Blur ★ Default
                    </div>
                    <div className="text-[10px] opacity-80 mt-0.5">
                      Full original frame with ambient blurred borders
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLayoutMode('face_track')}
                    className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                      layoutMode === 'face_track'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/70 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-bold">
                      <UserCheck className="size-3.5 text-primary" />
                      Face Tracking (CV)
                    </div>
                    <div className="text-[10px] opacity-80 mt-0.5">
                      AI detects & centers on the speaker's face
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLayoutMode('split_screen')}
                    className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                      layoutMode === 'split_screen'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/70 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-bold">
                      <Users className="size-3.5 text-primary" />
                      Podcast Split-Screen
                    </div>
                    <div className="text-[10px] opacity-80 mt-0.5">
                      Stacked 50/50 vertical crop for 2 speakers
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLayoutMode('direct_crop')}
                    className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                      layoutMode === 'direct_crop'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/70 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-bold">
                      <Ratio className="size-3.5 text-primary" />
                      Direct Center Crop
                    </div>
                    <div className="text-[10px] opacity-80 mt-0.5">
                      Static crop to center of frame
                    </div>
                  </button>
                </div>
              </div>

              {/* Option 2: Subtitle Styling */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Type className="size-3.5 text-primary" />
                  Option 2: Subtitle Styling & Pacing
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSubtitleStyle('hormozi')}
                    className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                      subtitleStyle === 'hormozi'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/70 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <div className="font-bold">Hormozi Gold ★ Default</div>
                    <div className="text-[10px] opacity-80 mt-0.5">
                      Bold uppercase, yellow/white contrast, drop-shadow
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubtitleStyle('beast')}
                    className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                      subtitleStyle === 'beast'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/70 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <div className="font-bold">MrBeast Neon</div>
                    <div className="text-[10px] opacity-80 mt-0.5">
                      Vibrant electric cyan & yellow stroke pop
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubtitleStyle('minimal')}
                    className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                      subtitleStyle === 'minimal'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/70 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <div className="font-bold">Clean Minimalist</div>
                    <div className="text-[10px] opacity-80 mt-0.5">
                      Sleek typography on translucent pill backdrop
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubtitleStyle('cyberpunk')}
                    className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                      subtitleStyle === 'cyberpunk'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/70 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <div className="font-bold">Cyberpunk Glow</div>
                    <div className="text-[10px] opacity-80 mt-0.5">
                      Futuristic neon magenta & cyan borders
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubtitleStyle('urdu_nastaliq')}
                    className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                      subtitleStyle === 'urdu_nastaliq'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                        : 'border-border/70 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <div className="font-bold text-amber-400">اردو شاہی نستعلیق</div>
                    <div className="text-[10px] opacity-80 mt-0.5">
                      Authentic Urdu Nastaliq script & shimmering gold
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubtitleStyle('urdu_gulzar')}
                    className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                      subtitleStyle === 'urdu_gulzar'
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                        : 'border-border/70 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <div className="font-bold text-cyan-400">اردو گلزار سیان</div>
                    <div className="text-[10px] opacity-80 mt-0.5">
                      Modern Gulzar Urdu display font & electric cyan
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Core Row 3: Option 3 Audio Pacing & Advanced Options */}
            {showAdvanced && (
              <div className="pt-4 border-t border-border/60 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Subtitle Position */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground block">
                      Subtitle Position
                    </label>
                    <select
                      value={subtitlePosition}
                      onChange={(e) => setSubtitlePosition(e.target.value as ReelSubtitlePosition)}
                      className="w-full p-2 rounded-lg border border-border bg-background text-xs cursor-pointer"
                    >
                      <option value="bottom">Bottom (Default - Recommended)</option>
                      <option value="middle">Center / Middle Screen</option>
                      <option value="top">Top Header</option>
                    </select>
                  </div>

                  {/* Subtitle Font Size */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground block">
                      Font Size
                    </label>
                    <select
                      value={fontSizeChoice}
                      onChange={(e) => setFontSizeChoice(e.target.value as ReelFontSize)}
                      className="w-full p-2 rounded-lg border border-border bg-background text-xs cursor-pointer"
                    >
                      <option value="standard">Standard (Default - 42pt)</option>
                      <option value="large">Large Bold (52pt)</option>
                      <option value="compact">Compact (32pt)</option>
                    </select>
                  </div>

                  {/* Option 3: BGM Presets */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Music className="size-3.5 text-primary" />
                      Option 3: Background Music (BGM)
                    </label>
                    <select
                      value={bgmPreset}
                      onChange={(e) => setBgmPreset(e.target.value as ReelBgmPreset)}
                      className="w-full p-2 rounded-lg border border-border bg-background text-xs cursor-pointer"
                    >
                      <option value="none">No BGM (Voice Only) ★ Default</option>
                      <option value="lofi">Lofi Chill (Auto-Ducked)</option>
                      <option value="motivational">Motivational Uplift (Auto-Ducked)</option>
                      <option value="tension">Dramatic Tension (Auto-Ducked)</option>
                    </select>
                  </div>
                </div>

                {/* Option 3: Silence Trimming Toggle */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 max-w-lg">
                  <input
                    type="checkbox"
                    id="trimSilenceCheckbox"
                    checked={trimSilence}
                    onChange={(e) => setTrimSilence(e.target.checked)}
                    className="rounded border-border text-primary cursor-pointer size-4"
                  />
                  <div>
                    <label
                      htmlFor="trimSilenceCheckbox"
                      className="text-xs font-bold cursor-pointer flex items-center gap-1.5"
                    >
                      <Volume2 className="size-3.5 text-primary" />
                      Option 3: Trim Dead Silences (&gt;0.6s)
                    </label>
                    <p className="text-[10px] text-muted-foreground">
                      Removes awkward pauses, coughs, and silent gaps to maximize viewer retention
                      (Default: Off).
                    </p>
                  </div>
                </div>

                {/* Optional Specific Time Period Cut */}
                <div className="pt-2 border-t border-border/40 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="enableTimeRange"
                      checked={enableTimeRange}
                      onChange={(e) => setEnableTimeRange(e.target.checked)}
                      className="rounded border-border text-primary cursor-pointer"
                    />
                    <label htmlFor="enableTimeRange" className="text-xs font-semibold cursor-pointer">
                      Filter whole video by Specific Time Period (Optional)
                    </label>
                  </div>
                  {enableTimeRange && (
                    <div className="flex items-center gap-4 text-xs bg-muted/40 p-3 rounded-lg max-w-md">
                      <div>
                        <label className="text-muted-foreground block mb-1">Start Time (mm:ss)</label>
                        <input
                          type="text"
                          value={timeRangeStart}
                          onChange={(e) => setTimeRangeStart(e.target.value)}
                          placeholder="00:00"
                          className="p-1.5 rounded border border-border bg-background w-24 font-mono text-center"
                        />
                      </div>
                      <span className="text-muted-foreground pt-4">to</span>
                      <div>
                        <label className="text-muted-foreground block mb-1">End Time (mm:ss)</label>
                        <input
                          type="text"
                          value={timeRangeEnd}
                          onChange={(e) => setTimeRangeEnd(e.target.value)}
                          placeholder="25:00"
                          className="p-1.5 rounded border border-border bg-background w-24 font-mono text-center"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Upload Area */}
      {step === 'idle' && !result && (
        <Card className="border-border/70 border-dashed border-2 hover:border-primary/50 transition-colors">
          <CardContent className="p-8 sm:p-12 text-center space-y-6">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="video/mp4,video/quicktime,video/x-matroska,video/webm"
              className="hidden"
            />

            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer space-y-4 py-8 flex flex-col items-center justify-center group"
              >
                <div className="size-16 rounded-2xl bg-muted/80 group-hover:bg-primary/15 transition-colors flex items-center justify-center text-muted-foreground group-hover:text-primary">
                  <Upload className="size-8" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Click to upload your long video (MP4, MOV, MKV)</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Supports 10–30+ minute full podcasts, interviews, or lectures up to 500 MB
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
                  <span className="flex items-center gap-1">
                    <Scissors className="size-3.5" /> Full dialogue topic segmentation
                  </span>
                  <span className="flex items-center gap-1">
                    <Film className="size-3.5" /> {layoutMode} layout
                  </span>
                  <span className="flex items-center gap-1">
                    <Subtitles className="size-3.5" /> {subtitleStyle} dynamic subtitles
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-w-md mx-auto">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/60 text-left">
                  <FileVideo className="size-8 text-primary shrink-0" />
                  <div className="overflow-hidden flex-1">
                    <p className="text-sm font-semibold truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB · Format: {aspectRatio} · Layout:{' '}
                      {layoutMode}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null)
                      setVideoPreviewUrl(null)
                    }}
                  >
                    Change
                  </Button>
                </div>

                {videoPreviewUrl && (
                  <div className="relative rounded-lg overflow-hidden border border-border bg-black aspect-video max-h-56">
                    <video src={videoPreviewUrl} controls className="w-full h-full object-contain" />
                  </div>
                )}

                <Button
                  onClick={handleStartPipeline}
                  size="lg"
                  className="w-full font-semibold gap-2 shadow-lg shadow-primary/20"
                >
                  <Sparkles className="size-4" />
                  Analyze Whole Video & Generate Topic Clips
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stepper / In-Progress Animation */}
      {step !== 'idle' && step !== 'ready' && (
        <Card className="border-border">
          <CardContent className="p-8 sm:p-12 space-y-6">
            <div className="text-center space-y-2">
              <Loader2 className="size-10 animate-spin text-primary mx-auto" />
              <h3 className="text-lg font-bold">VidCraft AI is Reading Your Video</h3>
              <p className="text-sm text-muted-foreground">
                Transcribing full audio, analyzing topics with Groq 120B model, and identifying hooks...
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-4">
              <div
                className={`p-3 rounded-lg border text-center transition-all ${
                  step === 'uploading'
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border/60 text-muted-foreground'
                }`}
              >
                <div className="text-xs uppercase tracking-wider mb-1">Step 1</div>
                <div className="text-sm">Video Ingestion & Extraction</div>
              </div>
              <div
                className={`p-3 rounded-lg border text-center transition-all ${
                  step === 'transcribing'
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border/60 text-muted-foreground'
                }`}
              >
                <div className="text-xs uppercase tracking-wider mb-1">Step 2</div>
                <div className="text-sm">Full Whisper ASR (Word Timestamps)</div>
              </div>
              <div
                className={`p-3 rounded-lg border text-center transition-all ${
                  step === 'analyzing'
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border/60 text-muted-foreground'
                }`}
              >
                <div className="text-xs uppercase tracking-wider mb-1">Step 3</div>
                <div className="text-sm">Holistic Topic & Hook Segmentation</div>
              </div>
              <div
                className={`p-3 rounded-lg border text-center transition-all ${
                  step === 'rendering'
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border/60 text-muted-foreground'
                }`}
              >
                <div className="text-xs uppercase tracking-wider mb-1">Step 4</div>
                <div className="text-sm">{aspectRatio} Reframe & Subtitles Ready</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results View */}
      {result && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span>Extracted Topic Clips</span>
                <Badge variant="outline" className="text-xs font-mono">
                  {result.clips.length} Extracted
                </Badge>
                <Badge variant="outline" className="text-xs font-semibold">
                  Layout: {layoutMode}
                </Badge>
                <Badge variant="outline" className="text-xs font-semibold">
                  Subtitles: {subtitleStyle}
                </Badge>
              </h2>
              <p className="text-sm text-muted-foreground">
                Each clip captures a complete thought/story from the video without rushed mid-sentence cuts.
              </p>
            </div>

            {/* Option 6: Transcript & SRT Downloads + Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadFullSrt}
                className="gap-1.5 text-xs"
                title="Download full video subtitles with word timing"
              >
                <FileText className="size-3.5 text-primary" />
                Download .SRT
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadFullTxt}
                className="gap-1.5 text-xs"
                title="Download full video text transcript"
              >
                <FileText className="size-3.5" />
                Download .TXT
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomCut(!showCustomCut)}
                className="gap-1.5 text-xs"
              >
                <PlusCircle className="size-3.5" />
                Custom Cut
              </Button>

              <Button variant="outline" size="sm" onClick={resetAll} className="gap-1.5 text-xs">
                <RefreshCw className="size-3.5" />
                New Video
              </Button>
            </div>
          </div>

          {/* Custom Cut Sub-Card */}
          {showCustomCut && (
            <Card className="border-primary/50 bg-primary/5 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm flex items-center gap-2">
                  <Scissors className="size-4 text-primary" />
                  <span>Cut Your Own Specific Time Period</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowCustomCut(false)}>
                  Close
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-muted-foreground block mb-1 font-medium">Clip Title</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. My Favorite Insight"
                    className="w-full p-2 rounded border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground block mb-1 font-medium">Start Time (mm:ss)</label>
                  <input
                    type="text"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    placeholder="e.g. 04:15"
                    className="w-full p-2 rounded border border-border bg-background font-mono"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground block mb-1 font-medium">End Time (mm:ss)</label>
                  <input
                    type="text"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    placeholder="e.g. 06:45"
                    className="w-full p-2 rounded border border-border bg-background font-mono"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground block mb-1 font-medium">Aspect Ratio</label>
                  <select
                    value={customAspect}
                    onChange={(e) => setCustomAspect(e.target.value as ReelAspectRatio)}
                    className="w-full p-2 rounded border border-border bg-background"
                  >
                    <option value="9:16">9:16 (Vertical Reel)</option>
                    <option value="1:1">1:1 (Square)</option>
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="4:5">4:5 (Portrait)</option>
                  </select>
                </div>
              </div>

              <Button
                onClick={handleCreateCustomClip}
                disabled={renderingClipId === 'custom'}
                size="sm"
                className="gap-2 font-semibold"
              >
                {renderingClipId === 'custom' ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Rendering Custom Cut...
                  </>
                ) : (
                  <>
                    <Scissors className="size-3.5" />
                    Cut & Render This Segment
                  </>
                )}
              </Button>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Clips List */}
            <div className="lg:col-span-7 space-y-4">
              {result.clips.map((clip) => {
                const isSelected = activeClip?.id === clip.id
                const isRendered = !!clip.rendered_reel?.reelUrl
                const isCurrentlyRendering = renderingClipId === clip.id
                const isBatchRendering = batchRenderingClipId === clip.id

                return (
                  <Card
                    key={clip.id}
                    onClick={() => setActiveClip(clip)}
                    className={`cursor-pointer transition-all border ${
                      isSelected
                        ? 'border-primary ring-1 ring-primary/40 bg-card shadow-md'
                        : 'border-border/70 hover:border-border bg-card/60'
                    }`}
                  >
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base">{clip.topic || clip.title}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="size-3" />
                              {Math.floor(clip.start_time)}s – {Math.floor(clip.end_time)}s (
                              {formatSeconds(clip.duration)})
                            </span>
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                              {clip.duration >= 90 ? 'Deep Dive' : 'Short'}
                            </Badge>
                          </div>
                        </div>

                        <Badge
                          variant="default"
                          className="bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1 shrink-0 font-bold"
                        >
                          <Flame className="size-3.5 fill-amber-500" />
                          {clip.virality_score}% Retention
                        </Badge>
                      </div>

                      {/* Summary */}
                      {clip.summary && (
                        <p className="text-xs text-foreground/80">{clip.summary}</p>
                      )}

                      {/* Hook Quote */}
                      <blockquote className="text-xs italic border-l-2 border-primary/50 pl-3 py-1 text-muted-foreground bg-muted/30 rounded-r">
                        "{clip.hook}"
                      </blockquote>

                      {/* Virality Reason */}
                      <p className="text-[11px] text-muted-foreground">{clip.virality_reason}</p>

                      {/* Social Media Caption Box */}
                      {clip.suggested_caption && (
                        <div className="flex items-center justify-between p-2 rounded bg-muted/50 text-xs">
                          <p className="truncate text-muted-foreground mr-2 text-[11px]">
                            {clip.suggested_caption}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopyCaption(clip)
                            }}
                            title="Copy caption"
                          >
                            {copiedId === clip.id ? (
                              <Check className="size-3.5 text-green-500" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </Button>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-medium">
                          {isRendered ? (
                            <span className="text-green-500 flex items-center gap-1">
                              <Check className="size-3.5" /> Video Ready ({clip.rendered_reel?.aspect_ratio || aspectRatio})
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Ready to compile</span>
                          )}
                        </span>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownloadClipSrt(clip)
                            }}
                            className="gap-1 text-xs text-muted-foreground"
                            title="Download subtitles for this clip only"
                          >
                            <FileText className="size-3" />
                            .SRT
                          </Button>

                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={isCurrentlyRendering || isBatchRendering}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRenderSpecificClip(clip, aspectRatio)
                            }}
                            className="gap-1.5 text-xs"
                          >
                            {isCurrentlyRendering ? (
                              <>
                                <Loader2 className="size-3.5 animate-spin" />
                                Rendering...
                              </>
                            ) : (
                              <>
                                <Scissors className="size-3.5" />
                                {isRendered ? 'Re-render' : `Render (${aspectRatio})`}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Right Column: Dynamic Player Preview & Option Controls */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="sticky top-20 space-y-4 w-full max-w-sm">
                <div className="text-center">
                  <h3 className="font-bold text-sm tracking-wide uppercase text-muted-foreground">
                    Video Player Preview
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {activeClip ? activeClip.title : 'Select a clip to preview'}
                  </p>
                </div>

                {/* Adaptive Player Frame */}
                <div
                  className={`relative mx-auto rounded-[32px] p-3 bg-neutral-900 border-4 border-neutral-700 shadow-2xl flex flex-col overflow-hidden w-full ${
                    aspectRatio === '9:16'
                      ? 'aspect-[9/16] max-w-[280px] sm:max-w-[300px]'
                      : aspectRatio === '1:1'
                        ? 'aspect-square max-w-[340px]'
                        : aspectRatio === '16:9'
                          ? 'aspect-video max-w-[380px]'
                          : 'aspect-[4/5] max-w-[320px]'
                  }`}
                >
                  {/* Phone Screen Area */}
                  <div className="relative w-full h-full rounded-[22px] overflow-hidden bg-black flex items-center justify-center">
                    {activeClip?.rendered_reel?.reelUrl ? (
                      <video
                        src={activeClip.rendered_reel.reelUrl}
                        controls
                        autoPlay
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-6 space-y-3">
                        <Film className="size-10 text-muted-foreground/40 mx-auto" />
                        <p className="text-xs text-muted-foreground">
                          Click "Render" to compile {aspectRatio} with {layoutMode} layout and{' '}
                          {subtitleStyle} subtitles.
                        </p>
                        {activeClip && (
                          <Button
                            size="sm"
                            disabled={renderingClipId === activeClip.id || batchRenderingClipId === activeClip.id}
                            onClick={() => handleRenderSpecificClip(activeClip, aspectRatio)}
                            className="gap-1 text-xs"
                          >
                            {renderingClipId === activeClip.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Scissors className="size-3" />
                            )}
                            Render ({formatSeconds(activeClip.duration)})
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Clip Controls & Downloads */}
                {activeClip && (
                  <div className="space-y-3">
                    {/* Live Customization for Active Clip */}
                    <div className="p-3 rounded-lg border border-border/70 bg-card/70 space-y-2 text-xs">
                      <div className="font-semibold text-muted-foreground flex items-center justify-between">
                        <span>Format & Style for this Clip:</span>
                        <span className="text-[10px] text-primary font-mono">{layoutMode}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <select
                          value={layoutMode}
                          onChange={(e) => setLayoutMode(e.target.value as ReelLayoutMode)}
                          className="p-1.5 rounded border border-border bg-background text-[11px]"
                          title="Framing layout"
                        >
                          <option value="blur">Blur BG (Universal)</option>
                          <option value="face_track">Face Tracking (CV)</option>
                          <option value="split_screen">Podcast Split Screen</option>
                          <option value="direct_crop">Center Crop</option>
                        </select>

                        <select
                          value={subtitleStyle}
                          onChange={(e) => setSubtitleStyle(e.target.value as ReelSubtitleStyle)}
                          className="p-1.5 rounded border border-border bg-background text-[11px]"
                          title="Subtitle font style"
                        >
                          <option value="hormozi">Hormozi Gold</option>
                          <option value="beast">MrBeast Neon</option>
                          <option value="minimal">Minimal Clean</option>
                          <option value="cyberpunk">Cyberpunk Glow</option>
                          <option value="urdu_nastaliq">Urdu Nastaliq (اردو)</option>
                          <option value="urdu_gulzar">Urdu Gulzar (گلزار)</option>
                        </select>
                      </div>
                    </div>

                    {/* Main Render / Re-render Button */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={renderingClipId === activeClip.id || batchRenderingClipId === activeClip.id}
                        onClick={() => handleRenderSpecificClip(activeClip, aspectRatio)}
                        className="w-full gap-1.5 text-xs font-semibold"
                      >
                        {renderingClipId === activeClip.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Scissors className="size-3.5" />
                        )}
                        {activeClip.rendered_reel ? 'Re-render' : `Render ${aspectRatio}`}
                      </Button>

                      {/* Option 5: Multi-Ratio Batch Export Button */}
                      <Button
                        size="sm"
                        variant="default"
                        disabled={renderingClipId === activeClip.id || batchRenderingClipId === activeClip.id}
                        onClick={() => handleBatchRenderClip(activeClip)}
                        className="w-full gap-1.5 text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 shadow-sm"
                        title="Render 9:16, 1:1, and 16:9 simultaneously"
                      >
                        {batchRenderingClipId === activeClip.id ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" />
                            Exporting 3...
                          </>
                        ) : (
                          <>
                            <Sparkles className="size-3.5" />
                            Batch All Ratios
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Option 5: Batch Downloads Area */}
                    {(activeClip.batch_renders || batchRendersMap[activeClip.id]) && (
                      <div className="p-2.5 rounded-lg border border-primary/30 bg-primary/5 space-y-1.5 text-xs">
                        <div className="font-semibold text-primary text-[11px] flex items-center gap-1">
                          <Check className="size-3.5" />
                          Multi-Format Downloads Ready:
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(activeClip.batch_renders || batchRendersMap[activeClip.id] || []).map((render) => (
                            <a
                              key={render.aspect_ratio || render.filename}
                              href={render.reelUrl}
                              download={`VidCraft_${activeClip.id}_${(render.aspect_ratio || 'ratio').replace(':', 'x')}.mp4`}
                              className="text-center"
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-[10px] px-1 py-1 h-auto flex flex-col items-center gap-0.5 hover:bg-primary/10 hover:border-primary"
                              >
                                <Download className="size-3" />
                                <span>{render.aspect_ratio || 'Video'}</span>
                              </Button>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Single Active Reel Download Button */}
                    {activeClip.rendered_reel?.reelUrl && (
                      <div className="flex gap-2">
                        <a
                          href={activeClip.rendered_reel.reelUrl}
                          download={`VidCraft_${activeClip.id}_${aspectRatio.replace(':', 'x')}.mp4`}
                          className="w-full"
                        >
                          <Button className="w-full gap-2 font-semibold shadow-md text-xs">
                            <Download className="size-4" />
                            Download Video ({activeClip.rendered_reel.aspect_ratio || aspectRatio} MP4)
                          </Button>
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
