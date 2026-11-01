import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Mic,
  MicOff,
  Upload,
  Download,
  Type,
  Sparkles,
  Palette,
  FileText,
  Check,
  Copy,
  Plus,
  Trash2,
  Wand2,
  Volume2,
  VolumeX,
  Zap,
  Crop,
  Move,
  AlignCenter,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CAPTION_FONTS,
  CAPTION_EFFECTS,
  CAPTION_THEME_PRESETS,
  DEFAULT_CAPTION_SETTINGS,
  DEMO_URDU_WORDS,
  DEMO_ENGLISH_WORDS,
  COLOR_SWATCHES,
  STROKE_SWATCHES,
  type CaptionThemePreset,
} from './captionPresets'
import { CaptionOverlay } from './CaptionOverlay'
import type {
  CaptionWord,
  CaptionSettings,
} from '@/lib/types'
import { uploadCaptionMedia, transcribeCaptionMedia, exportCaptionSubtitles } from '@/lib/api'

type StudioTab = 'effects' | 'fonts' | 'styling' | 'editor'
type AspectRatio = '9:16' | '16:9' | '1:1'
type LanguageMode = 'ur' | 'en' | 'auto'

export const AutoCaptionStudio: React.FC = () => {
  // --- Main State ---
  const [activeTab, setActiveTab] = useState<StudioTab>('effects')
  const [language, setLanguage] = useState<LanguageMode>('ur')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16')
  const [settings, setSettings] = useState<CaptionSettings>({
    ...DEFAULT_CAPTION_SETTINGS,
    // Start with Urdu Royal Nastaliq as default for Urdu richness
    fontFamily: "'Noto Nastaliq Urdu', serif",
    fontSize: 48,
    activeTextColor: '#FFD700',
    inactiveTextColor: '#F0E6D2',
    strokeColor: '#000000',
    strokeWidth: 5,
    effect: 'hover-float',
    direction: 'rtl',
    boxX: 50,
    boxY: 80,
    boxWidth: 85,
    boxRotation: 0,
    boxCropEnabled: false,
    boxCropTop: 0,
    boxCropBottom: 0,
    boxCropLeft: 0,
    boxCropRight: 0,
    boxBorderWidth: 0,
    boxBorderStyle: 'none',
    boxBorderColor: '#00F0FF',
  })

  // --- Interactive Transform, Drag & Drop, Sizing & Cropping State ---
  const stageRef = useRef<HTMLDivElement>(null)
  const [showHandles, setShowHandles] = useState<boolean>(true)
  const [isCropMode, setIsCropMode] = useState<boolean>(false)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [activeHandle, setActiveHandle] = useState<string | null>(null)
  const [snapGuides, setSnapGuides] = useState<{ x: boolean; y: boolean }>({ x: false, y: false })

  const [words, setWords] = useState<CaptionWord[]>(DEMO_URDU_WORDS)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [isAudioOnly, setIsAudioOnly] = useState<boolean>(true)
  const [mediaFilename, setMediaFilename] = useState<string | null>(null)

  // Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(16)
  const [playbackRate, setPlaybackRate] = useState<number>(1)
  const [isMuted, setIsMuted] = useState<boolean>(false)

  // Mic & Live Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0)
  const [micAudioLevel, setMicAudioLevel] = useState<number>(0)

  // Status & Progress
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false)
  const [effectCategory, setEffectCategory] = useState<string>('all')
  const [fontCategory, setFontCategory] = useState<'all' | 'urdu' | 'english'>('urdu')

  // Background visualizer preset
  const [bgStyle, setBgStyle] = useState<'dark-studio' | 'neon-grid' | 'warm-sunset' | 'indigo-mesh'>('dark-studio')

  // Media Element Ref
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<number | null>(null)
  const recognitionRef = useRef<any>(null)

  // Total duration based on words
  useEffect(() => {
    if (words.length > 0) {
      const maxEnd = Math.max(...words.map(w => w.end))
      if (!mediaUrl) {
        setDuration(Math.max(12, Math.ceil(maxEnd + 1)))
      }
    }
  }, [words, mediaUrl])

  // Media playback sync
  useEffect(() => {
    const el = mediaRef.current
    if (!el) return

    const onTimeUpdate = () => {
      setCurrentTime(el.currentTime)
    }
    const onLoadedMetadata = () => {
      if (el.duration && !isNaN(el.duration)) {
        setDuration(el.duration)
      }
    }
    const onEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    el.addEventListener('timeupdate', onTimeUpdate)
    el.addEventListener('loadedmetadata', onLoadedMetadata)
    el.addEventListener('ended', onEnded)

    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate)
      el.removeEventListener('loadedmetadata', onLoadedMetadata)
      el.removeEventListener('ended', onEnded)
    }
  }, [mediaUrl])

  // Simulated playback loop if no mediaUrl is loaded
  useEffect(() => {
    if (!mediaUrl && isPlaying) {
      const startTime = performance.now() - (currentTime / playbackRate) * 1000
      const loop = () => {
        const elapsed = ((performance.now() - startTime) / 1000) * playbackRate
        if (elapsed >= duration) {
          setCurrentTime(0)
          setIsPlaying(false)
        } else {
          setCurrentTime(elapsed)
          animFrameRef.current = requestAnimationFrame(loop)
        }
      }
      animFrameRef.current = requestAnimationFrame(loop)

      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [isPlaying, mediaUrl, duration, playbackRate])

  // Play / Pause Toggle
  const togglePlay = () => {
    if (mediaUrl && mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause()
        setIsPlaying(false)
      } else {
        mediaRef.current.play()
        setIsPlaying(true)
      }
    } else {
      setIsPlaying(!isPlaying)
    }
  }

  // Seek
  const handleSeek = (newTime: number) => {
    const clamped = Math.max(0, Math.min(newTime, duration))
    setCurrentTime(clamped)
    if (mediaRef.current) {
      mediaRef.current.currentTime = clamped
    }
  }

  // --- Interactive On-Canvas Drag, Sizing, Rotation & Cropping Engine ---
  const centerBoxHorizontal = () => {
    setSettings(s => ({ ...s, boxX: 50 }))
  }

  const centerBoxVertical = () => {
    setSettings(s => ({ ...s, boxY: 50, positionY: 50 }))
  }

  const resetBoxTransform = () => {
    setSettings(s => ({
      ...s,
      boxX: 50,
      boxY: 80,
      boxWidth: 85,
      boxRotation: 0,
      boxCropEnabled: false,
      boxCropTop: 0,
      boxCropBottom: 0,
      boxCropLeft: 0,
      boxCropRight: 0,
    }))
    setIsCropMode(false)
  }

  const snapToSafeArea = () => {
    setSettings(s => ({ ...s, boxX: 50, boxY: 82, boxWidth: 85, boxRotation: 0 }))
  }

  const handlePointerDown = (handleType: string, e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setActiveHandle(handleType)
    setIsDragging(true)

    const stageEl = stageRef.current
    if (!stageEl) return

    const rect = stageEl.getBoundingClientRect()
    const startClientX = e.clientX
    const startClientY = e.clientY
    const startBoxX = settings.boxX ?? 50
    const startBoxY = settings.boxY ?? settings.positionY ?? 80
    const startWidth = settings.boxWidth ?? 85
    const startRotation = settings.boxRotation ?? 0
    const startCropTop = settings.boxCropTop ?? 0
    const startCropBottom = settings.boxCropBottom ?? 0
    const startCropLeft = settings.boxCropLeft ?? 0
    const startCropRight = settings.boxCropRight ?? 0

    // Center of box in client coordinates for rotation
    const boxCenterX = rect.left + (startBoxX / 100) * rect.width
    const boxCenterY = rect.top + (startBoxY / 100) * rect.height

    const onPointerMove = (moveEv: PointerEvent) => {
      const deltaXPercent = ((moveEv.clientX - startClientX) / rect.width) * 100
      const deltaYPercent = ((moveEv.clientY - startClientY) / rect.height) * 100

      if (handleType === 'drag') {
        let newX = Math.round((startBoxX + deltaXPercent) * 10) / 10
        let newY = Math.round((startBoxY + deltaYPercent) * 10) / 10

        // Magnetic snap to center X (50%) and center Y (50%)
        let snappedX = false
        let snappedY = false
        if (Math.abs(newX - 50) <= 2.5) {
          newX = 50
          snappedX = true
        }
        if (Math.abs(newY - 50) <= 2.5) {
          newY = 50
          snappedY = true
        }
        setSnapGuides({ x: snappedX, y: snappedY })

        newX = Math.max(5, Math.min(95, newX))
        newY = Math.max(5, Math.min(95, newY))

        setSettings(s => ({ ...s, boxX: newX, boxY: newY, positionY: newY }))
      } else if (handleType === 'e' || handleType === 'w') {
        const factor = handleType === 'e' ? deltaXPercent * 2 : -deltaXPercent * 2
        const newW = Math.max(20, Math.min(100, Math.round(startWidth + factor)))
        setSettings(s => ({ ...s, boxWidth: newW }))
      } else if (handleType === 'se' || handleType === 'sw' || handleType === 'ne' || handleType === 'nw') {
        const factorX = (handleType === 'se' || handleType === 'ne') ? deltaXPercent * 2 : -deltaXPercent * 2
        const newW = Math.max(20, Math.min(100, Math.round(startWidth + factorX)))
        setSettings(s => ({ ...s, boxWidth: newW }))
      } else if (handleType === 'rotate') {
        const currentAngle = Math.atan2(moveEv.clientY - boxCenterY, moveEv.clientX - boxCenterX) * (180 / Math.PI)
        const initialAngle = Math.atan2(startClientY - boxCenterY, startClientX - boxCenterX) * (180 / Math.PI)
        let newAngle = Math.round(startRotation + (currentAngle - initialAngle))
        // Magnetic snap to 0, 90, -90, 180
        if (Math.abs(newAngle) <= 3) newAngle = 0
        if (Math.abs(newAngle - 90) <= 3) newAngle = 90
        if (Math.abs(newAngle + 90) <= 3) newAngle = -90
        setSettings(s => ({ ...s, boxRotation: newAngle }))
      } else if (handleType === 'crop-top') {
        const newCrop = Math.max(0, Math.min(45, Math.round(startCropTop + deltaYPercent)))
        setSettings(s => ({ ...s, boxCropEnabled: true, boxCropTop: newCrop }))
      } else if (handleType === 'crop-bottom') {
        const newCrop = Math.max(0, Math.min(45, Math.round(startCropBottom - deltaYPercent)))
        setSettings(s => ({ ...s, boxCropEnabled: true, boxCropBottom: newCrop }))
      } else if (handleType === 'crop-left') {
        const newCrop = Math.max(0, Math.min(45, Math.round(startCropLeft + deltaXPercent)))
        setSettings(s => ({ ...s, boxCropEnabled: true, boxCropLeft: newCrop }))
      } else if (handleType === 'crop-right') {
        const newCrop = Math.max(0, Math.min(45, Math.round(startCropRight - deltaXPercent)))
        setSettings(s => ({ ...s, boxCropEnabled: true, boxCropRight: newCrop }))
      }
    }

    const onPointerUp = () => {
      setIsDragging(false)
      setActiveHandle(null)
      setSnapGuides({ x: false, y: false })
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  // Preset Applier
  const applyPreset = (preset: CaptionThemePreset) => {
    setSettings(prev => ({
      ...prev,
      ...preset.settings,
    }))
    if (preset.category === 'urdu') {
      setLanguage('ur')
      setFontCategory('urdu')
    } else if (preset.category === 'english') {
      setLanguage('en')
      setFontCategory('english')
    }
  }

  // Load Demo Samples
  const loadUrduDemo = () => {
    setLanguage('ur')
    setFontCategory('urdu')
    setWords(DEMO_URDU_WORDS)
    setSettings(prev => ({
      ...prev,
      fontFamily: "'Noto Nastaliq Urdu', serif",
      fontSize: 48,
      activeTextColor: '#FFD700',
      inactiveTextColor: '#F0E6D2',
      strokeColor: '#000000',
      strokeWidth: 5,
      effect: 'hover-float',
      direction: 'rtl',
    }))
    setCurrentTime(0)
    setIsPlaying(true)
  }

  const loadEnglishDemo = () => {
    setLanguage('en')
    setFontCategory('english')
    setWords(DEMO_ENGLISH_WORDS)
    setSettings(prev => ({
      ...prev,
      fontFamily: "'Impact', 'Arial Black', sans-serif",
      fontSize: 52,
      activeTextColor: '#FFE500',
      inactiveTextColor: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 6,
      effect: 'pop-bounce',
      direction: 'ltr',
    }))
    setCurrentTime(0)
    setIsPlaying(true)
  }

  // --- Hear Audio / Microphone Dictation Feature ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(audioBlob)
        setMediaUrl(url)
        setIsAudioOnly(true)

        // Upload and transcribe recorded blob
        try {
          setIsTranscribing(true)
          setUploadProgress('Processing recorded audio...')
          const audioFile = new File([audioBlob], `mic_recording_${Date.now()}.webm`, { type: 'audio/webm' })
          const uploadRes = await uploadCaptionMedia(audioFile)
          const transcribeRes = await transcribeCaptionMedia(uploadRes.mediaPath, language)
          if (transcribeRes && transcribeRes.words && transcribeRes.words.length > 0) {
            setWords(transcribeRes.words)
          }
        } catch (err) {
          console.warn('Backend audio transcription offline, keeping live recognized words', err)
        } finally {
          setIsTranscribing(false)
          setUploadProgress(null)
        }

        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start(250)
      setIsRecording(true)
      setRecordingSeconds(0)

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds(s => s + 1)
        // Pulsate mic level
        setMicAudioLevel(Math.random() * 80 + 20)
      }, 250)

      // Live Web Speech Recognition for instant word streaming
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = language === 'ur' ? 'ur-PK' : 'en-US'

        let lastWordTime = 0.5

        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript.trim()
            if (transcript) {
              const tokens = transcript.split(/\s+/)
              const newWords: CaptionWord[] = tokens.map((tok: string, idx: number) => {
                const dur = Math.max(0.3, tok.length * 0.08)
                const start = Math.round((lastWordTime + idx * (dur + 0.08)) * 10) / 10
                return {
                  id: `rec-${idx}-${Date.now()}`,
                  word: tok,
                  start,
                  end: Math.round((start + dur) * 10) / 10,
                }
              })
              setWords(newWords)
            }
          }
        }
        recognition.start()
        recognitionRef.current = recognition
      }
    } catch (err) {
      alert('Microphone access was denied or is not supported in this browser.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (_) {}
      }
    }
  }

  // --- File Upload Handler ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsTranscribing(true)
      setUploadProgress(`Uploading ${file.name}...`)

      // Create preview object URL immediately
      const objectUrl = URL.createObjectURL(file)
      const isAudio = file.type.startsWith('audio/') || ['.mp3', '.wav', '.m4a', '.ogg'].some(ext => file.name.endsWith(ext))
      setMediaUrl(objectUrl)
      setIsAudioOnly(isAudio)
      setMediaFilename(file.name)

      // Upload to backend
      const uploadRes = await uploadCaptionMedia(file)
      setUploadProgress('Listening & Transcribing with Whisper...')

      // Call transcribe with language
      const transcribeRes = await transcribeCaptionMedia(uploadRes.mediaPath, language)
      if (transcribeRes && transcribeRes.words && transcribeRes.words.length > 0) {
        setWords(transcribeRes.words)
        if (transcribeRes.language === 'ur' || transcribeRes.language === 'urdu') {
          setLanguage('ur')
          setFontCategory('urdu')
          setSettings(s => ({ ...s, direction: 'rtl', fontFamily: "'Noto Nastaliq Urdu', serif" }))
        }
      }
    } catch (err: any) {
      console.warn('Backend upload/transcription fallback:', err)
      // Provide simulated fallback transcript
      if (language === 'ur') {
        loadUrduDemo()
      } else {
        loadEnglishDemo()
      }
    } finally {
      setIsTranscribing(false)
      setUploadProgress(null)
    }
  }

  // Export Subtitle Handler
  const handleExport = async (format: 'srt' | 'vtt' | 'ass' | 'txt' | 'json') => {
    try {
      const res = await exportCaptionSubtitles(format, words, settings, mediaFilename || 'vidcraft_captions')
      if (res && res.downloadUrl) {
        // Trigger download
        const a = document.createElement('a')
        a.href = res.downloadUrl
        a.download = res.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
        // Direct client side fallback download
        downloadClientFile(format)
      }
    } catch (err) {
      downloadClientFile(format)
    }
  }

  const downloadClientFile = (format: string) => {
    let content = ''
    let mime = 'text/plain'
    if (format === 'srt') {
      content = words.map((w, idx) => `${idx + 1}\n00:00:${Math.floor(w.start).toString().padStart(2, '0')},000 --> 00:00:${Math.floor(w.end).toString().padStart(2, '0')},000\n${w.word}\n`).join('\n')
    } else if (format === 'vtt') {
      content = 'WEBVTT\n\n' + words.map(w => `00:00:${Math.floor(w.start).toString().padStart(2, '0')}.000 --> 00:00:${Math.floor(w.end).toString().padStart(2, '0')}.000\n${w.word}\n`).join('\n')
    } else if (format === 'json') {
      content = JSON.stringify({ words, settings }, null, 2)
      mime = 'application/json'
    } else {
      content = words.map(w => w.word).join(' ')
    }

    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `captions.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Copy plain text to clipboard
  const copyTranscript = () => {
    const text = words.map(w => w.word).join(' ')
    navigator.clipboard.writeText(text)
    setCopiedNotification(true)
    setTimeout(() => setCopiedNotification(false), 2000)
  }

  // Update Word in table
  const handleWordChange = (idx: number, field: keyof CaptionWord, val: any) => {
    const updated = [...words]
    updated[idx] = { ...updated[idx], [field]: val }
    setWords(updated)
  }

  const deleteWord = (idx: number) => {
    setWords(words.filter((_, i) => i !== idx))
  }

  const addWord = () => {
    const lastWord = words[words.length - 1]
    const start = lastWord ? lastWord.end + 0.1 : 0
    const newWord: CaptionWord = {
      id: `new-${Date.now()}`,
      word: language === 'ur' ? 'نیا لفظ' : 'NewWord',
      start: Math.round(start * 10) / 10,
      end: Math.round((start + 0.5) * 10) / 10,
    }
    setWords([...words, newWord])
  }

  // Filtered Effects
  const filteredEffects = useMemo(() => {
    if (effectCategory === 'all') return CAPTION_EFFECTS
    return CAPTION_EFFECTS.filter(e => e.category === effectCategory)
  }, [effectCategory])

  // Filtered Fonts
  const filteredFonts = useMemo(() => {
    if (fontCategory === 'all') return CAPTION_FONTS
    return CAPTION_FONTS.filter(f => f.category === fontCategory)
  }, [fontCategory])

  // Aspect ratio dimensions for canvas preview
  const canvasDimensions = useMemo(() => {
    if (aspectRatio === '9:16') {
      return 'w-[320px] h-[568px] sm:w-[350px] sm:h-[622px]'
    } else if (aspectRatio === '16:9') {
      return 'w-[520px] h-[292px] sm:w-[580px] sm:h-[326px]'
    } else {
      return 'w-[380px] h-[380px] sm:w-[420px] sm:h-[420px]'
    }
  }, [aspectRatio])

  const isCurrentLanguageUrdu = language === 'ur' || settings.direction === 'rtl'

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* --- Top Hero & Auto-Caption Control Header --- */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-card/90 via-card/60 to-primary/10 border border-border/80 backdrop-blur-xl shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-gradient-to-br from-amber-500 to-cyan-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
                Auto-Caption Studio
                <span className="text-sm font-arabic font-normal text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  خودکار سب ٹائٹلز
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Urdu & English speech recognition, 28 calligraphic fonts, 26 word animation effects & custom styling.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Live Mic, Language, Demo Clips */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Language Selector */}
          <div className="flex items-center rounded-lg bg-muted/80 p-1 border border-border text-xs font-semibold">
            <button
              onClick={() => {
                setLanguage('ur')
                setFontCategory('urdu')
                setSettings(s => ({ ...s, direction: 'rtl', fontFamily: "'Noto Nastaliq Urdu', serif" }))
              }}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                language === 'ur' ? 'bg-amber-500 text-black shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>اردو (Urdu)</span>
            </button>
            <button
              onClick={() => {
                setLanguage('en')
                setFontCategory('english')
                setSettings(s => ({ ...s, direction: 'ltr', fontFamily: "'Impact', 'Arial Black', sans-serif" }))
              }}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                language === 'en' ? 'bg-primary text-primary-foreground shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>English (EN)</span>
            </button>
          </div>

          {/* Live Mic "Hear Audio" Button */}
          {!isRecording ? (
            <Button
              onClick={startRecording}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-md flex items-center gap-2"
            >
              <Mic className="size-4 animate-pulse" />
              <span>Hear Audio (Live Mic)</span>
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold cursor-pointer shadow-lg animate-pulse flex items-center gap-2"
            >
              <MicOff className="size-4" />
              <span>Listening ({recordingSeconds}s)... Stop</span>
            </Button>
          )}

          {/* Quick Demo Clips */}
          <Button
            variant="outline"
            size="sm"
            onClick={loadUrduDemo}
            className="cursor-pointer border-amber-500/40 text-amber-400 hover:bg-amber-500/10 flex items-center gap-1.5"
          >
            <Zap className="size-3.5" />
            <span>اردو Demo</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadEnglishDemo}
            className="cursor-pointer border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 flex items-center gap-1.5"
          >
            <Zap className="size-3.5" />
            <span>EN Demo</span>
          </Button>
        </div>
      </div>

      {/* --- Main Studio Workspace (Left: Player Stage, Right: Controls & Presets) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ================= LEFT: VIDEO / AUDIO PREVIEW STAGE (5 Cols) ================= */}
        <div className="lg:col-span-5 flex flex-col items-center space-y-4">
          {/* Aspect Ratio & Stage Background Toggles */}
          <div className="w-full flex items-center justify-between px-2 text-xs">
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border">
              <button
                onClick={() => setAspectRatio('9:16')}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer font-medium ${
                  aspectRatio === '9:16' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground'
                }`}
              >
                9:16 Reel
              </button>
              <button
                onClick={() => setAspectRatio('16:9')}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer font-medium ${
                  aspectRatio === '16:9' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground'
                }`}
              >
                16:9 Wide
              </button>
              <button
                onClick={() => setAspectRatio('1:1')}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer font-medium ${
                  aspectRatio === '1:1' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground'
                }`}
              >
                1:1 Post
              </button>
            </div>

            {/* Backdrop Themes */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border">
              <button
                onClick={() => setBgStyle('dark-studio')}
                className={`size-6 rounded-md transition-all cursor-pointer border ${
                  bgStyle === 'dark-studio' ? 'border-primary ring-1 ring-primary' : 'border-transparent'
                } bg-[#0c0e14]`}
                title="Dark Studio"
              />
              <button
                onClick={() => setBgStyle('neon-grid')}
                className={`size-6 rounded-md transition-all cursor-pointer border ${
                  bgStyle === 'neon-grid' ? 'border-primary ring-1 ring-primary' : 'border-transparent'
                } bg-gradient-to-br from-indigo-950 to-purple-950`}
                title="Neon Cyber"
              />
              <button
                onClick={() => setBgStyle('warm-sunset')}
                className={`size-6 rounded-md transition-all cursor-pointer border ${
                  bgStyle === 'warm-sunset' ? 'border-primary ring-1 ring-primary' : 'border-transparent'
                } bg-gradient-to-br from-amber-950 via-zinc-950 to-neutral-900`}
                title="Warm Sunset"
              />
              <button
                onClick={() => setBgStyle('indigo-mesh')}
                className={`size-6 rounded-md transition-all cursor-pointer border ${
                  bgStyle === 'indigo-mesh' ? 'border-primary ring-1 ring-primary' : 'border-transparent'
                } bg-gradient-to-tr from-cyan-950 via-slate-900 to-blue-950`}
                title="Cyan Mesh"
              />
            </div>
          </div>

          {/* Quick Canvas Transform & Snapping Toolbar */}
          <div className="w-full flex items-center justify-between px-1 text-xs">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] px-2 cursor-pointer gap-1 bg-card/60 hover:bg-card border-border"
                onClick={centerBoxHorizontal}
                title="Snap caption box to horizontal center (50%)"
              >
                <AlignCenter className="size-3" />
                <span>Center X</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] px-2 cursor-pointer gap-1 bg-card/60 hover:bg-card border-border"
                onClick={centerBoxVertical}
                title="Snap caption box to vertical center (50%)"
              >
                <Move className="size-3" />
                <span>Center Y</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] px-2 cursor-pointer gap-1 bg-card/60 hover:bg-card border-border"
                onClick={snapToSafeArea}
                title="Snap to Reel safe caption zone (82% bottom)"
              >
                <ShieldCheck className="size-3 text-emerald-400" />
                <span>Safe Area</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] px-2 cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={resetBoxTransform}
                title="Reset box position, size, rotation and crop"
              >
                <RotateCcw className="size-3" />
                <span>Reset</span>
              </Button>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant={isCropMode ? 'default' : 'outline'}
                size="sm"
                className={`h-7 text-[11px] px-2.5 cursor-pointer gap-1 transition-all ${
                  isCropMode
                    ? 'bg-amber-500 text-black font-bold shadow-md hover:bg-amber-600'
                    : 'bg-card/60 hover:bg-card border-border'
                }`}
                onClick={() => setIsCropMode(!isCropMode)}
                title="Toggle 4-edge crop masking handles"
              >
                <Crop className="size-3" />
                <span>Crop {isCropMode ? 'Active' : 'Mode'}</span>
              </Button>
              <Button
                variant={showHandles ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-[11px] px-2 cursor-pointer gap-1"
                onClick={() => setShowHandles(!showHandles)}
                title="Toggle visual bounding box & handles"
              >
                {showHandles ? <Eye className="size-3 text-cyan-400" /> : <EyeOff className="size-3 text-muted-foreground" />}
                <span>{showHandles ? 'Box' : 'Hidden'}</span>
              </Button>
            </div>
          </div>

          {/* Interactive Screen Stage */}
          <div
            ref={stageRef}
            className={`relative rounded-2xl overflow-hidden border-2 border-border/80 shadow-2xl flex items-center justify-center transition-all duration-300 ${canvasDimensions} ${
              bgStyle === 'dark-studio'
                ? 'bg-gradient-to-b from-[#131720] to-[#090b10]'
                : bgStyle === 'neon-grid'
                ? 'bg-gradient-to-br from-indigo-950 via-black to-purple-950'
                : bgStyle === 'warm-sunset'
                ? 'bg-gradient-to-b from-amber-950/40 via-zinc-900 to-black'
                : 'bg-gradient-to-tr from-cyan-950 via-slate-900 to-blue-950'
            }`}
          >
            {/* Visual subtle grid background */}
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Video or Audio Element */}
            {mediaUrl && !isAudioOnly ? (
              <video
                ref={mediaRef as any}
                src={mediaUrl}
                className="w-full h-full object-cover"
                playsInline
                muted={isMuted}
                onClick={togglePlay}
              />
            ) : mediaUrl && isAudioOnly ? (
              <audio ref={mediaRef as any} src={mediaUrl} muted={isMuted} />
            ) : null}

            {/* Sound Wave Graphic when Audio-Only or Demo */}
            {(!mediaUrl || isAudioOnly) && (
              <div className="flex items-center gap-1 opacity-25">
                {[40, 70, 95, 60, 80, 45, 90, 65, 85, 50, 75, 90, 60].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-200 ${
                      isPlaying ? 'bg-primary animate-pulse' : 'bg-muted-foreground'
                    }`}
                    style={{
                      height: `${isPlaying ? Math.max(15, (h * (micAudioLevel || 60)) / 100) : 20}px`,
                      animationDelay: `${i * 0.08}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Magnetic Center Snap Guidelines */}
            {snapGuides.x && (
              <div className="absolute top-0 bottom-0 left-1/2 w-[1.5px] bg-cyan-400 z-30 pointer-events-none shadow-[0_0_8px_#00f0ff]" />
            )}
            {snapGuides.y && (
              <div className="absolute left-0 right-0 top-1/2 h-[1.5px] bg-cyan-400 z-30 pointer-events-none shadow-[0_0_8px_#00f0ff]" />
            )}

            {/* Live Caption Overlay with Synced Animation */}
            <CaptionOverlay
              currentTime={currentTime}
              words={words}
              settings={settings}
              isUrdu={isCurrentLanguageUrdu}
              aspectRatio={aspectRatio}
              scaleFactor={aspectRatio === '16:9' ? 0.9 : 1}
            />

            {/* Interactive Transform Bounding Box & Sizing/Rotate/Crop Handles */}
            {showHandles && (
              <div
                className={`absolute z-30 transition-shadow select-none ${
                  isDragging ? 'cursor-grabbing' : 'cursor-grab'
                } ${
                  isCropMode
                    ? 'border-2 border-dashed border-amber-400/90 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                    : 'border-2 border-dashed border-cyan-400/80 shadow-[0_0_10px_rgba(6,182,212,0.35)] hover:border-cyan-300'
                }`}
                style={{
                  left: `${settings.boxX ?? 50}%`,
                  top: `${settings.boxY ?? settings.positionY ?? 80}%`,
                  width: `${settings.boxWidth ?? 85}%`,
                  height: '76px',
                  transform: `translate(-50%, -50%) rotate(${settings.boxRotation || 0}deg)`,
                }}
                onPointerDown={(e) => handlePointerDown('drag', e)}
              >
                {/* Center Drag Hover Badge */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-cyan-500/10 pointer-events-none rounded">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/80 text-[10px] text-cyan-300 font-medium shadow-sm">
                    <Move className="size-3" />
                    <span>Drag & Drop Position</span>
                  </div>
                </div>

                {/* Top Rotation Knob Pin */}
                <div
                  className="absolute left-1/2 -top-8 -translate-x-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing group z-40"
                  onPointerDown={(e) => handlePointerDown('rotate', e)}
                  title="Rotate Caption Box (Magnetic snap at 0°, 90°, -90°)"
                >
                  <div className="size-4 rounded-full bg-cyan-400 border-2 border-white shadow-md flex items-center justify-center group-hover:scale-125 transition-transform">
                    <RotateCw className="size-2 text-black" />
                  </div>
                  <div className="w-[1.5px] h-3.5 bg-cyan-400" />
                </div>

                {/* Corner Sizing Handles */}
                <div
                  className="absolute -top-1.5 -left-1.5 size-3.5 bg-cyan-400 border-2 border-white rounded-xs cursor-nwse-resize shadow-md hover:scale-125 transition-transform z-40"
                  onPointerDown={(e) => handlePointerDown('nw', e)}
                  title="Resize (NW)"
                />
                <div
                  className="absolute -top-1.5 -right-1.5 size-3.5 bg-cyan-400 border-2 border-white rounded-xs cursor-nesw-resize shadow-md hover:scale-125 transition-transform z-40"
                  onPointerDown={(e) => handlePointerDown('ne', e)}
                  title="Resize (NE)"
                />
                <div
                  className="absolute -bottom-1.5 -right-1.5 size-3.5 bg-cyan-400 border-2 border-white rounded-xs cursor-nwse-resize shadow-md hover:scale-125 transition-transform z-40"
                  onPointerDown={(e) => handlePointerDown('se', e)}
                  title="Resize (SE)"
                />
                <div
                  className="absolute -bottom-1.5 -left-1.5 size-3.5 bg-cyan-400 border-2 border-white rounded-xs cursor-nesw-resize shadow-md hover:scale-125 transition-transform z-40"
                  onPointerDown={(e) => handlePointerDown('sw', e)}
                  title="Resize (SW)"
                />

                {/* Side Width Sizing Handles */}
                <div
                  className="absolute top-1/2 -left-1.5 -translate-y-1/2 size-3.5 bg-primary border-2 border-white rounded-xs cursor-ew-resize shadow-md hover:scale-125 transition-transform z-40"
                  onPointerDown={(e) => handlePointerDown('w', e)}
                  title="Adjust Width (Left)"
                />
                <div
                  className="absolute top-1/2 -right-1.5 -translate-y-1/2 size-3.5 bg-primary border-2 border-white rounded-xs cursor-ew-resize shadow-md hover:scale-125 transition-transform z-40"
                  onPointerDown={(e) => handlePointerDown('e', e)}
                  title="Adjust Width (Right)"
                />

                {/* Interactive 4-Edge Crop Handles when Crop Mode is Active */}
                {isCropMode && (
                  <>
                    <div
                      className="absolute left-4 right-4 top-0 h-2.5 -translate-y-1 bg-amber-400/90 hover:h-3.5 cursor-ns-resize rounded-full transition-all shadow-md z-40 border border-black/40"
                      onPointerDown={(e) => handlePointerDown('crop-top', e)}
                      title={`Drag to Crop Top (${settings.boxCropTop || 0}%)`}
                    />
                    <div
                      className="absolute left-4 right-4 bottom-0 h-2.5 translate-y-1 bg-amber-400/90 hover:h-3.5 cursor-ns-resize rounded-full transition-all shadow-md z-40 border border-black/40"
                      onPointerDown={(e) => handlePointerDown('crop-bottom', e)}
                      title={`Drag to Crop Bottom (${settings.boxCropBottom || 0}%)`}
                    />
                    <div
                      className="absolute top-4 bottom-4 left-0 w-2.5 -translate-x-1 bg-amber-400/90 hover:w-3.5 cursor-ew-resize rounded-full transition-all shadow-md z-40 border border-black/40"
                      onPointerDown={(e) => handlePointerDown('crop-left', e)}
                      title={`Drag to Crop Left (${settings.boxCropLeft || 0}%)`}
                    />
                    <div
                      className="absolute top-4 bottom-4 right-0 w-2.5 translate-x-1 bg-amber-400/90 hover:w-3.5 cursor-ew-resize rounded-full transition-all shadow-md z-40 border border-black/40"
                      onPointerDown={(e) => handlePointerDown('crop-right', e)}
                      title={`Drag to Crop Right (${settings.boxCropRight || 0}%)`}
                    />
                  </>
                )}

                {/* Floating Transform HUD Coordinate Badge */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/90 backdrop-blur-md text-[10px] font-mono text-cyan-300 border border-cyan-500/40 whitespace-nowrap pointer-events-none shadow-md z-40 flex items-center gap-1.5">
                  {activeHandle && <span className="text-amber-400 font-bold uppercase">[{activeHandle}]</span>}
                  <span>X: {(settings.boxX ?? 50).toFixed(0)}%</span>
                  <span>·</span>
                  <span>Y: {(settings.boxY ?? 80).toFixed(0)}%</span>
                  <span>·</span>
                  <span>W: {(settings.boxWidth ?? 85).toFixed(0)}%</span>
                  <span>·</span>
                  <span>∠{settings.boxRotation || 0}°</span>
                  {settings.boxCropEnabled && isCropMode && (
                    <span className="text-amber-400 font-semibold">[Crop: T{settings.boxCropTop}% B{settings.boxCropBottom}%]</span>
                  )}
                </div>
              </div>
            )}

            {/* Watermark / Active Effect Pill */}
            <div className="absolute top-3 left-3 z-30 pointer-events-none">
              <Badge variant="outline" className="bg-black/50 backdrop-blur-md text-[10px] border-white/10 text-white/80">
                Effect: {CAPTION_EFFECTS.find(e => e.id === settings.effect)?.name || settings.effect}
              </Badge>
            </div>

            {/* Transcribing Indicator Overlay */}
            {isTranscribing && (
              <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <div className="text-sm font-semibold text-white">{uploadProgress || 'Transcribing speech...'}</div>
                <div className="text-xs text-muted-foreground">Generating timestamped captions for Urdu & English</div>
              </div>
            )}
          </div>

          {/* Audio / Video Playback Controller */}
          <div className="w-full p-4 rounded-xl bg-card border border-border/80 shadow-md space-y-3">
            {/* Timeline Scrubber */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                <span>{currentTime.toFixed(2)}s</span>
                <span>{duration.toFixed(2)}s</span>
              </div>
              <input
                type="range"
                min="0"
                max={duration || 10}
                step="0.05"
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Player Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 cursor-pointer"
                  onClick={() => handleSeek(currentTime - 2)}
                  title="Rewind 2s"
                >
                  <RotateCcw className="size-3.5" />
                </Button>
                <Button
                  variant="default"
                  size="icon"
                  className="size-9 rounded-full cursor-pointer shadow-md bg-primary text-primary-foreground"
                  onClick={togglePlay}
                >
                  {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 cursor-pointer"
                  onClick={() => handleSeek(currentTime + 2)}
                  title="Forward 2s"
                >
                  <RotateCw className="size-3.5" />
                </Button>
              </div>

              {/* Speed Controller */}
              <div className="flex items-center gap-1 text-xs">
                {[0.75, 1, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      setPlaybackRate(rate)
                      if (mediaRef.current) mediaRef.current.playbackRate = rate
                    }}
                    className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-all cursor-pointer ${
                      playbackRate === rate ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}

                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
                  onClick={() => setIsMuted(!isMuted)}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="size-3.5 text-destructive" /> : <Volume2 className="size-3.5" />}
                </Button>
              </div>

              {/* Upload Media Input Button */}
              <div className="flex items-center gap-1">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="video/*,audio/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-muted hover:bg-muted/80 border border-border text-foreground transition-all">
                    <Upload className="size-3" />
                    <span className="hidden sm:inline">Upload File</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT: STUDIO CONTROLS (7 Cols) ================= */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 bg-muted/70 rounded-xl border border-border text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveTab('effects')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'effects' ? 'bg-background text-foreground shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="size-3.5 text-amber-400" />
              <span>Word Effects (26 FX)</span>
            </button>
            <button
              onClick={() => setActiveTab('fonts')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'fonts' ? 'bg-background text-foreground shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Type className="size-3.5 text-cyan-400" />
              <span>Fonts (28 Types)</span>
            </button>
            <button
              onClick={() => setActiveTab('styling')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'styling' ? 'bg-background text-foreground shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Palette className="size-3.5 text-purple-400" />
              <span>Color, Stroke & Shadow</span>
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'editor' ? 'bg-background text-foreground shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="size-3.5 text-emerald-400" />
              <span>Transcript & Export</span>
            </button>
          </div>

          {/* Quick Preset Theme Bar */}
          <div className="p-3 rounded-xl bg-card border border-border/70 space-y-2">
            <div className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase flex items-center justify-between">
              <span>Quick Aesthetic Presets</span>
              <span className="text-[10px] text-primary">1-Click Apply</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CAPTION_THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className="shrink-0 px-3 py-1.5 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-xs font-medium transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-1.5"
                >
                  <Wand2 className="size-3 text-amber-400" />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ================= TAB 1: WORD ANIMATION EFFECTS (26 FX) ================= */}
          {activeTab === 'effects' && (
            <div className="space-y-4">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1">
                {['all', 'kinetic', 'glow', '3d', 'motion', 'creative'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setEffectCategory(cat)}
                    className={`px-3 py-1 rounded-full capitalize text-xs font-medium cursor-pointer transition-all ${
                      effectCategory === cat
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'bg-muted/70 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Effect Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1">
                {filteredEffects.map((fx) => {
                  const isSelected = settings.effect === fx.id
                  return (
                    <div
                      key={fx.id}
                      onClick={() => setSettings(s => ({ ...s, effect: fx.id }))}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-md ring-1 ring-primary'
                          : 'border-border/80 bg-card hover:bg-muted/40 hover:border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-bold flex items-center gap-1.5">
                            <span>{fx.name}</span>
                            {fx.popular && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/20 text-amber-400 font-bold rounded-full">
                                POPULAR
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-medium">{fx.tagline}</div>
                        </div>
                        {isSelected && <Check className="size-4 text-primary shrink-0" />}
                      </div>

                      <p className="text-xs text-muted-foreground/90 line-clamp-2">
                        {fx.description}
                      </p>

                      {/* Live Animation Mini-Preview Pill */}
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden h-10">
                        <span
                          className={`${fx.cssClass} font-bold text-xs`}
                          style={{
                            color: settings.activeTextColor,
                            fontFamily: settings.fontFamily,
                          }}
                        >
                          {isCurrentLanguageUrdu ? 'کامیابی' : 'DISCIPLINE'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ================= TAB 2: TYPOGRAPHY & 28 FONTS ================= */}
          {activeTab === 'fonts' && (
            <div className="space-y-4">
              {/* Font Language Filter Tabs */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-muted/80 p-1 rounded-lg border border-border text-xs font-semibold">
                  <button
                    onClick={() => setFontCategory('all')}
                    className={`px-3 py-1 rounded transition-all cursor-pointer ${
                      fontCategory === 'all' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground'
                    }`}
                  >
                    All (28)
                  </button>
                  <button
                    onClick={() => setFontCategory('urdu')}
                    className={`px-3 py-1 rounded transition-all cursor-pointer ${
                      fontCategory === 'urdu' ? 'bg-amber-500 text-black font-bold shadow-xs' : 'text-muted-foreground'
                    }`}
                  >
                    🇵🇰 اردو & Nastaliq (10)
                  </button>
                  <button
                    onClick={() => setFontCategory('english')}
                    className={`px-3 py-1 rounded transition-all cursor-pointer ${
                      fontCategory === 'english' ? 'bg-primary text-primary-foreground font-bold shadow-xs' : 'text-muted-foreground'
                    }`}
                  >
                    🇺🇸 English & Display (18)
                  </button>
                </div>
              </div>

              {/* Fonts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                {filteredFonts.map((font) => {
                  const isSelected = settings.fontFamily.includes(font.id) || settings.fontFamily === font.family
                  return (
                    <div
                      key={font.id}
                      onClick={() => {
                        setSettings(s => ({
                          ...s,
                          fontFamily: font.family,
                          direction: font.isUrdu ? 'rtl' : s.direction,
                        }))
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-md ring-1 ring-primary'
                          : 'border-border/80 bg-card hover:bg-muted/40 hover:border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold">{font.name}</div>
                          <div className="text-[10px] text-muted-foreground">{font.script}</div>
                        </div>
                        {isSelected && <Check className="size-4 text-primary shrink-0" />}
                      </div>

                      {/* Font Specimen Preview */}
                      <div
                        className="py-2.5 px-3 rounded-lg bg-black/40 border border-white/5 text-center truncate"
                        dir={font.isUrdu ? 'rtl' : 'ltr'}
                        style={{
                          fontFamily: font.family,
                          fontSize: font.isUrdu ? '20px' : '17px',
                          color: isSelected ? settings.activeTextColor : '#E2E8F0',
                        }}
                      >
                        {font.previewText}
                      </div>

                      <div className="text-[11px] text-muted-foreground line-clamp-1">{font.description}</div>
                    </div>
                  )
                })}
              </div>

              {/* Detailed Typography Sliders */}
              <div className="p-4 rounded-xl bg-card border border-border/80 space-y-3.5">
                <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Typography Fine-Tuning
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Font Size */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>Font Size</span>
                      <span className="font-mono text-primary font-bold">{settings.fontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="24"
                      max="76"
                      value={settings.fontSize}
                      onChange={(e) => setSettings(s => ({ ...s, fontSize: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  {/* Letter Spacing */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>Letter Spacing</span>
                      <span className="font-mono text-primary font-bold">{settings.letterSpacing}px</span>
                    </div>
                    <input
                      type="range"
                      min="-2"
                      max="8"
                      value={settings.letterSpacing}
                      onChange={(e) => setSettings(s => ({ ...s, letterSpacing: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  {/* Text Transform */}
                  <div className="space-y-1.5">
                    <div className="text-xs">Text Case</div>
                    <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border text-xs">
                      {(['none', 'uppercase', 'capitalize'] as const).map((trans) => (
                        <button
                          key={trans}
                          onClick={() => setSettings(s => ({ ...s, textTransform: trans }))}
                          className={`flex-1 py-1 rounded capitalize text-xs transition-all cursor-pointer ${
                            settings.textTransform === trans ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'
                          }`}
                        >
                          {trans === 'none' ? 'As-Is' : trans}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Direction */}
                  <div className="space-y-1.5">
                    <div className="text-xs">Script Direction</div>
                    <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border text-xs">
                      <button
                        onClick={() => setSettings(s => ({ ...s, direction: 'rtl' }))}
                        className={`flex-1 py-1 rounded text-xs transition-all cursor-pointer ${
                          settings.direction === 'rtl' ? 'bg-amber-500 text-black font-bold' : 'text-muted-foreground'
                        }`}
                      >
                        RTL (اردو)
                      </button>
                      <button
                        onClick={() => setSettings(s => ({ ...s, direction: 'ltr' }))}
                        className={`flex-1 py-1 rounded text-xs transition-all cursor-pointer ${
                          settings.direction === 'ltr' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'
                        }`}
                      >
                        LTR (English)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: COLOR, STROKE & SHADOW CONTROLS ================= */}
          {activeTab === 'styling' && (
            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
              {/* Text Color Controls */}
              <div className="p-4 rounded-xl bg-card border border-border/80 space-y-3">
                <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center justify-between">
                  <span>Text Color Controls</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">Active:</span>
                    <input
                      type="color"
                      value={settings.activeTextColor}
                      onChange={(e) => setSettings(s => ({ ...s, activeTextColor: e.target.value }))}
                      className="size-6 rounded cursor-pointer border-0 p-0"
                    />
                  </div>
                </div>

                {/* Swatches */}
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.value}
                      onClick={() => setSettings(s => ({ ...s, activeTextColor: swatch.value }))}
                      className={`size-7 rounded-lg border transition-all cursor-pointer hover:scale-110 ${
                        settings.activeTextColor.toLowerCase() === swatch.value.toLowerCase()
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                          : 'border-border'
                      }`}
                      style={{ backgroundColor: swatch.value }}
                      title={swatch.name}
                    />
                  ))}
                </div>

                {/* Inactive Word Color */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Inactive / Unspoken Word Color:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.inactiveTextColor}
                      onChange={(e) => setSettings(s => ({ ...s, inactiveTextColor: e.target.value }))}
                      className="size-6 rounded cursor-pointer border-0 p-0"
                    />
                    <span className="font-mono text-[11px]">{settings.inactiveTextColor}</span>
                  </div>
                </div>
              </div>

              {/* Stroke / Outline Controls */}
              <div className="p-4 rounded-xl bg-card border border-border/80 space-y-3">
                <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center justify-between">
                  <span>Stroke / Outline Setting Controls</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">Color:</span>
                    <input
                      type="color"
                      value={settings.strokeColor}
                      onChange={(e) => setSettings(s => ({ ...s, strokeColor: e.target.value }))}
                      className="size-6 rounded cursor-pointer border-0 p-0"
                    />
                  </div>
                </div>

                {/* Stroke Width Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span>Outline Stroke Width</span>
                    <span className="font-mono text-primary font-bold">{settings.strokeWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="14"
                    value={settings.strokeWidth}
                    onChange={(e) => setSettings(s => ({ ...s, strokeWidth: parseInt(e.target.value) }))}
                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                {/* Stroke Swatches */}
                <div className="flex items-center gap-2 pt-1">
                  {STROKE_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.value}
                      onClick={() => setSettings(s => ({ ...s, strokeColor: swatch.value }))}
                      className={`size-6 rounded border transition-all cursor-pointer ${
                        settings.strokeColor.toLowerCase() === swatch.value.toLowerCase()
                          ? 'ring-2 ring-primary ring-offset-1'
                          : 'border-border'
                      }`}
                      style={{ backgroundColor: swatch.value }}
                      title={swatch.name}
                    />
                  ))}
                </div>
              </div>

              {/* Shadow Coloring & Setting Controls */}
              <div className="p-4 rounded-xl bg-card border border-border/80 space-y-3">
                <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center justify-between">
                  <span>Shadow Coloring & Geometry Controls</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">Shadow Color:</span>
                    <input
                      type="color"
                      value={settings.shadowColor}
                      onChange={(e) => setSettings(s => ({ ...s, shadowColor: e.target.value }))}
                      className="size-6 rounded cursor-pointer border-0 p-0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Shadow Blur */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>Shadow Blur</span>
                      <span className="font-mono text-primary font-bold">{settings.shadowBlur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={settings.shadowBlur}
                      onChange={(e) => setSettings(s => ({ ...s, shadowBlur: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  {/* Shadow Opacity */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>Shadow Opacity</span>
                      <span className="font-mono text-primary font-bold">{Math.round(settings.shadowOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.shadowOpacity}
                      onChange={(e) => setSettings(s => ({ ...s, shadowOpacity: parseFloat(e.target.value) }))}
                      className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  {/* Shadow Offset X */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>Offset X</span>
                      <span className="font-mono text-primary font-bold">{settings.shadowOffsetX}px</span>
                    </div>
                    <input
                      type="range"
                      min="-16"
                      max="16"
                      value={settings.shadowOffsetX}
                      onChange={(e) => setSettings(s => ({ ...s, shadowOffsetX: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  {/* Shadow Offset Y */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>Offset Y</span>
                      <span className="font-mono text-primary font-bold">{settings.shadowOffsetY}px</span>
                    </div>
                    <input
                      type="range"
                      min="-16"
                      max="16"
                      value={settings.shadowOffsetY}
                      onChange={(e) => setSettings(s => ({ ...s, shadowOffsetY: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Background Box & Position Controls */}
              <div className="p-4 rounded-xl bg-card border border-border/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                    Background Box Highlight
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={settings.boxEnabled}
                      onChange={(e) => setSettings(s => ({ ...s, boxEnabled: e.target.checked }))}
                      className="rounded accent-primary"
                    />
                    <span>Enable Box</span>
                  </label>
                </div>

                {settings.boxEnabled && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Box Color</span>
                        <input
                          type="color"
                          value={settings.boxColor}
                          onChange={(e) => setSettings(s => ({ ...s, boxColor: e.target.value }))}
                          className="size-5 rounded cursor-pointer border-0 p-0"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Box Opacity</span>
                        <span className="font-mono text-primary">{Math.round(settings.boxOpacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={settings.boxOpacity}
                        onChange={(e) => setSettings(s => ({ ...s, boxOpacity: parseFloat(e.target.value) }))}
                        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  </div>
                )}

                {/* Words Per Batch & Vertical Position */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/60">
                  <div className="space-y-1.5">
                    <div className="text-xs">Words per Batch</div>
                    <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border text-xs">
                      {[1, 2, 3, 5].map((count) => (
                        <button
                          key={count}
                          onClick={() => setSettings(s => ({ ...s, wordsPerBatch: count }))}
                          className={`flex-1 py-1 rounded text-xs transition-all cursor-pointer ${
                            settings.wordsPerBatch === count ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'
                          }`}
                        >
                          {count === 1 ? '1 Word' : `${count} Words`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>Vertical Position Y</span>
                      <span className="font-mono text-primary font-bold">{settings.positionY}%</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="88"
                      value={settings.positionY}
                      onChange={(e) => setSettings(s => ({ ...s, positionY: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Caption Box Geometry, Crop & Transform Controls */}
              <div className="p-4 rounded-xl bg-card border border-border/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                    <Move className="size-3.5 text-cyan-400" />
                    <span>Box Geometry & Alignment</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={centerBoxHorizontal}
                    >
                      Center X
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={centerBoxVertical}
                    >
                      Center Y
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] px-2 text-muted-foreground"
                      onClick={resetBoxTransform}
                    >
                      Reset
                    </Button>
                  </div>
                </div>

                {/* X, Y & Width Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Position X</span>
                      <span className="font-mono text-cyan-400 font-bold">{settings.boxX ?? 50}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={settings.boxX ?? 50}
                      onChange={(e) => setSettings(s => ({ ...s, boxX: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Position Y</span>
                      <span className="font-mono text-cyan-400 font-bold">{settings.boxY ?? settings.positionY ?? 80}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={settings.boxY ?? settings.positionY ?? 80}
                      onChange={(e) => setSettings(s => ({ ...s, boxY: parseInt(e.target.value), positionY: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Box Width</span>
                      <span className="font-mono text-cyan-400 font-bold">{settings.boxWidth ?? 85}%</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="100"
                      value={settings.boxWidth ?? 85}
                      onChange={(e) => setSettings(s => ({ ...s, boxWidth: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                </div>

                {/* Rotation Angle */}
                <div className="space-y-1.5 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1">
                      <RotateCw className="size-3 text-muted-foreground" />
                      <span>Rotation Angle</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSettings(s => ({ ...s, boxRotation: 0 }))}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-muted hover:bg-muted/80 text-muted-foreground cursor-pointer"
                      >
                        0°
                      </button>
                      <button
                        onClick={() => setSettings(s => ({ ...s, boxRotation: -90 }))}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-muted hover:bg-muted/80 text-muted-foreground cursor-pointer"
                      >
                        -90°
                      </button>
                      <button
                        onClick={() => setSettings(s => ({ ...s, boxRotation: 90 }))}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-muted hover:bg-muted/80 text-muted-foreground cursor-pointer"
                      >
                        +90°
                      </button>
                      <span className="font-mono text-cyan-400 font-bold">{settings.boxRotation ?? 0}°</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={settings.boxRotation ?? 0}
                    onChange={(e) => setSettings(s => ({ ...s, boxRotation: parseInt(e.target.value) }))}
                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* Box Border & Neon Glow Controls */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted-foreground">Box Border & Glow</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">Color:</span>
                      <input
                        type="color"
                        value={settings.boxBorderColor || '#00F0FF'}
                        onChange={(e) => setSettings(s => ({ ...s, boxBorderColor: e.target.value }))}
                        className="size-5 rounded cursor-pointer border-0 p-0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Border Width</span>
                        <span className="font-mono text-primary font-bold">{settings.boxBorderWidth ?? 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="8"
                        value={settings.boxBorderWidth ?? 0}
                        onChange={(e) => setSettings(s => ({ ...s, boxBorderWidth: parseInt(e.target.value) }))}
                        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs">Border Style</span>
                      <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border text-[11px]">
                        {(['none', 'solid', 'dashed', 'neon'] as const).map(style => (
                          <button
                            key={style}
                            onClick={() => setSettings(s => ({ ...s, boxBorderStyle: style }))}
                            className={`flex-1 py-0.5 rounded capitalize transition-all cursor-pointer ${
                              settings.boxBorderStyle === style ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'
                            }`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Box Cropping Mask Controls */}
                <div className="space-y-3 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                      <Crop className="size-3.5" />
                      <span>Box Cropping / Masking</span>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={settings.boxCropEnabled}
                        onChange={(e) => setSettings(s => ({ ...s, boxCropEnabled: e.target.checked }))}
                        className="rounded accent-amber-500"
                      />
                      <span>Enable Mask</span>
                    </label>
                  </div>

                  {settings.boxCropEnabled && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Crop Top</span>
                          <span className="font-mono text-amber-400 font-bold">{settings.boxCropTop ?? 0}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="40"
                          value={settings.boxCropTop ?? 0}
                          onChange={(e) => setSettings(s => ({ ...s, boxCropTop: parseInt(e.target.value) }))}
                          className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Crop Bottom</span>
                          <span className="font-mono text-amber-400 font-bold">{settings.boxCropBottom ?? 0}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="40"
                          value={settings.boxCropBottom ?? 0}
                          onChange={(e) => setSettings(s => ({ ...s, boxCropBottom: parseInt(e.target.value) }))}
                          className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Crop Left</span>
                          <span className="font-mono text-amber-400 font-bold">{settings.boxCropLeft ?? 0}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="40"
                          value={settings.boxCropLeft ?? 0}
                          onChange={(e) => setSettings(s => ({ ...s, boxCropLeft: parseInt(e.target.value) }))}
                          className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Crop Right</span>
                          <span className="font-mono text-amber-400 font-bold">{settings.boxCropRight ?? 0}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="40"
                          value={settings.boxCropRight ?? 0}
                          onChange={(e) => setSettings(s => ({ ...s, boxCropRight: parseInt(e.target.value) }))}
                          className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 4: WORD TIMELINE & EXPORT ================= */}
          {activeTab === 'editor' && (
            <div className="space-y-4">
              {/* Export Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-card border border-border/80">
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport('srt')}
                    className="cursor-pointer text-xs flex items-center gap-1.5"
                  >
                    <Download className="size-3.5" />
                    <span>.SRT</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport('vtt')}
                    className="cursor-pointer text-xs flex items-center gap-1.5"
                  >
                    <Download className="size-3.5" />
                    <span>.VTT</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport('ass')}
                    className="cursor-pointer text-xs flex items-center gap-1.5 border-amber-500/30 text-amber-400"
                  >
                    <Download className="size-3.5" />
                    <span>.ASS (Styled)</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport('json')}
                    className="cursor-pointer text-xs flex items-center gap-1.5"
                  >
                    <Download className="size-3.5" />
                    <span>JSON</span>
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={copyTranscript}
                    className="cursor-pointer text-xs flex items-center gap-1.5"
                  >
                    {copiedNotification ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                    <span>{copiedNotification ? 'Copied!' : 'Copy Text'}</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={addWord}
                    className="cursor-pointer text-xs flex items-center gap-1.5 bg-primary"
                  >
                    <Plus className="size-3.5" />
                    <span>Add Word</span>
                  </Button>
                </div>
              </div>

              {/* Word List Table */}
              <div className="border border-border rounded-xl overflow-hidden bg-card">
                <div className="max-h-[420px] overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/80 sticky top-0 z-10 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                        <th className="py-2.5 px-3">Word Text ({isCurrentLanguageUrdu ? 'اردو' : 'EN'})</th>
                        <th className="py-2.5 px-3 w-24">Start (s)</th>
                        <th className="py-2.5 px-3 w-24">End (s)</th>
                        <th className="py-2.5 px-3 w-16 text-center">Jump</th>
                        <th className="py-2.5 px-3 w-12 text-center">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {words.map((w, idx) => {
                        const isActive = currentTime >= w.start && currentTime <= w.end
                        return (
                          <tr
                            key={w.id || idx}
                            className={`transition-colors ${
                              isActive ? 'bg-primary/20 font-bold' : 'hover:bg-muted/30'
                            }`}
                          >
                            <td className="py-2 px-3 text-center font-mono text-muted-foreground">{idx + 1}</td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={w.word}
                                dir={isCurrentLanguageUrdu ? 'rtl' : 'ltr'}
                                onChange={(e) => handleWordChange(idx, 'word', e.target.value)}
                                className="w-full px-2 py-1 rounded bg-transparent border border-transparent hover:border-border focus:border-primary focus:bg-background outline-none transition-all"
                                style={{ fontFamily: settings.fontFamily }}
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                step="0.05"
                                value={w.start}
                                onChange={(e) => handleWordChange(idx, 'start', parseFloat(e.target.value))}
                                className="w-20 px-1.5 py-1 rounded bg-transparent border border-transparent hover:border-border focus:border-primary font-mono text-[11px]"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                step="0.05"
                                value={w.end}
                                onChange={(e) => handleWordChange(idx, 'end', parseFloat(e.target.value))}
                                className="w-20 px-1.5 py-1 rounded bg-transparent border border-transparent hover:border-border focus:border-primary font-mono text-[11px]"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => handleSeek(w.start)}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Jump to word"
                              >
                                <Play className="size-3" />
                              </button>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => deleteWord(idx)}
                                className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive cursor-pointer"
                                title="Delete word"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
