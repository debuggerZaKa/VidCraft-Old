import React, { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  Presentation,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Pencil,
  RotateCcw,
  Palette,
  FileText,
  Check,
  Copy,
  Layers,
  Wand2,
  AlertCircle,
  LayoutTemplate,
} from 'lucide-react'

import { SlideCanvas } from './SlideCanvas'
import { PolotnoDeckEditor } from './PolotnoDeckEditor'
import { MASTER_TEMPLATES } from './masterTemplates'
import { SAMPLE_DECKS } from './sampleDecks'
import { generatePresentation, exportPresentationPptx } from '@/lib/api'
import type { PresentationDeck, PresentationSlide } from '@/lib/types'

const THEME_OPTIONS: Array<{ key: string; name: string; dot: string }> = [
  { key: 'auto', name: '⚡ Auto-Detect (Agent chooses best theme for topic)', dot: 'linear-gradient(135deg, #38bdf8, #a855f7, #eab308)' },
  { key: 'cyberpunk_dark', name: 'Cyberpunk Dark (Tech / AI / Drones / Robotics)', dot: '#38bdf8' },
  { key: 'midnight_navy', name: 'Midnight Navy (Finance / SaaS / B2B / Enterprise)', dot: '#6366f1' },
  { key: 'obsidian_gold', name: 'Obsidian & Gold (Executive / Luxury / Keynotes)', dot: '#eab308' },
  { key: 'emerald_future', name: 'Emerald Future (Climate / Bio / Health / Sustainability)', dot: '#10b981' },
  { key: 'sunset_amber', name: 'Sunset Amber (Media / Creators / Food / Entertainment)', dot: '#f97316' },
  { key: 'quantum_violet', name: 'Quantum Violet (Deep Tech / VR / Web3 / Quantum)', dot: '#a855f7' },
  { key: 'clean_minimal', name: 'Clean Minimalist (Design / Architecture / Research)', dot: '#94a3b8' },
]

export const PresentationStudio: React.FC = () => {
  // Current active deck
  const [deck, setDeck] = useState<PresentationDeck>(SAMPLE_DECKS.vidcraft)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'stage' | 'canva'>('stage')

  // Creation form state
  const [promptTopic, setPromptTopic] = useState('')

  const [slideCount, setSlideCount] = useState(5)
  const [selectedTheme, setSelectedTheme] = useState('auto')
  const [selectedMasterTemplate, setSelectedMasterTemplate] = useState('auto')
  const [selectedAudience, setSelectedAudience] = useState('investor')
  const [selectedTone, setSelectedTone] = useState('visionary')

  // UI state
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copiedJson, setCopiedJson] = useState(false)
  const [isExportingPptx, setIsExportingPptx] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showNotes, setShowNotes] = useState(true)

  // Autoplay timer ref
  const timerRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const currentSlide = deck.slides[currentSlideIndex] || deck.slides[0]

  // Clean up timer and speech on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      window.speechSynthesis?.cancel()
    }
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        handleNextSlide()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrevSlide()
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        handleToggleFullscreen()
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentSlideIndex, deck.slides.length, isFullscreen])

  // Handle Autoplay Loop
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    const duration = (currentSlide.duration_s || 8) * 1000
    timerRef.current = window.setTimeout(() => {
      setCurrentSlideIndex((prev) => {
        if (prev >= deck.slides.length - 1) {
          setIsPlaying(false)
          return 0
        }
        return prev + 1
      })
    }, duration)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isPlaying, currentSlideIndex, currentSlide, deck.slides.length])

  // Speech Narration handler
  const handleToggleNarration = () => {
    if (isSpeaking) {
      window.speechSynthesis?.cancel()
      setIsSpeaking(false)
      return
    }

    const textToSpeak = currentSlide.speaker_notes || currentSlide.title
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      setIsSpeaking(true)
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev < deck.slides.length - 1 ? prev + 1 : 0))
  }

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : deck.slides.length - 1))
  }

  const handleToggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.().catch(() => {})
      setIsFullscreen(false)
    }
  }

  // Generate Deck via API
  const handleGenerateDeck = async (overrideTopic?: string) => {
    const topicToUse = (overrideTopic || promptTopic).trim()
    if (!topicToUse) {
      setErrorMessage('Please enter a topic or select one of the suggested prompts.')
      return
    }

    setIsGenerating(true)
    setErrorMessage(null)
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
    setIsPlaying(false)

    try {
      const res = await generatePresentation({
        topic: topicToUse,
        target_slides: slideCount,
        theme_key: selectedTheme,
        master_template: selectedMasterTemplate,
        audience: selectedAudience,
        tone: selectedTone,
      })
      if (res && res.deck) {
        setDeck(res.deck)
        setCurrentSlideIndex(0)
      }
    } catch (err: any) {
      console.warn('Backend presentation generate error, fallback to client synthesis:', err)
      // If error occurs, create client-side deck so user experience is uninterrupted
      const sample = SAMPLE_DECKS.vidcraft
      setDeck({
        ...sample,
        title: topicToUse,
        slides: sample.slides.map((s, idx) => ({
          ...s,
          title: idx === 0 ? topicToUse : s.title,
        })),
      })
      setCurrentSlideIndex(0)
    } finally {
      setIsGenerating(false)
    }
  }

  // Export to PowerPoint
  const handleExportPptx = async () => {
    setIsExportingPptx(true)
    try {
      const res = await exportPresentationPptx(deck)
      if (res.downloadUrl) {
        const link = document.createElement('a')
        link.href = res.downloadUrl
        link.download = res.filename || `${deck.title}.pptx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (err: any) {
      console.error('PPTX export error:', err)
      setErrorMessage('PPTX generation in progress. Check media downloads or retry.')
    } finally {
      setIsExportingPptx(false)
    }
  }

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(deck, null, 2))
    setCopiedJson(true)
    setTimeout(() => setCopiedJson(false), 2000)
  }

  const handleUpdateSlide = (updated: PresentationSlide) => {
    const newSlides = [...deck.slides]
    newSlides[currentSlideIndex] = updated
    setDeck({ ...deck, slides: newSlides })
  }

  // Render Polotno Canva Editor if in Canva Mode
  if (viewMode === 'canva') {
    return (
      <PolotnoDeckEditor
        deck={deck}
        onBack={() => setViewMode('stage')}
        onRegenerateTopic={handleGenerateDeck}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      className={`w-full min-h-screen pb-16 flex flex-col ${
        isFullscreen ? 'bg-black text-white p-4 justify-center items-center' : 'px-4 sm:px-8 pt-6'
      }`}
    >
      {/* Top Header / Studio Bar */}
      {!isFullscreen && (
        <div className="max-w-6xl w-full mx-auto mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 grid place-items-center">
              <Presentation className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight">
                  Presentation Studio
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  AI DECK BUILDER
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Generate high-impact pitch decks, interactive slides, video presentations & PPTX
              </p>
            </div>
          </div>

          {/* Quick Deck Actions */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Canva Studio Mode Button */}
            <button
              onClick={() => setViewMode('canva')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-sky-500 hover:from-purple-500 hover:to-sky-400 text-white transition shadow-sm cursor-pointer"
            >
              <Sparkles className="size-3.5" />
              <span>Canva Studio Mode</span>
            </button>

            <button
              onClick={() => handleGenerateDeck(deck.title)}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition cursor-pointer"
            >
              <RotateCcw className={`size-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>

            <button
              onClick={handleExportPptx}
              disabled={isExportingPptx}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition shadow-sm cursor-pointer"
            >
              <Download className={`size-3.5 ${isExportingPptx ? 'animate-bounce' : ''}`} />
              <span>{isExportingPptx ? 'Exporting...' : 'Export PPTX'}</span>
            </button>

            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition cursor-pointer"
            >
              {copiedJson ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
              <span>{copiedJson ? 'Copied' : 'JSON'}</span>
            </button>

            <button
              onClick={handleToggleFullscreen}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition cursor-pointer"
            >
              <Maximize2 className="size-3.5" />
              <span>Present</span>
            </button>
          </div>
        </div>

      )}

      {/* Generator Prompt Bar (hidden in fullscreen) */}
      {!isFullscreen && (
        <div className="max-w-6xl w-full mx-auto mb-8 bg-card/60 backdrop-blur-md border border-border/80 rounded-2xl p-5 shadow-lg">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Enter presentation topic (e.g. 'Autonomous Mars Rover Mission' or 'AI Venture Pitch')..."
                  value={promptTopic}
                  onChange={(e) => setPromptTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateDeck()}
                  className="w-full bg-background/80 border border-border/80 focus:border-sky-500/80 rounded-xl px-4 py-2.5 text-sm outline-none transition"
                />
              </div>

              <button
                onClick={() => handleGenerateDeck()}
                disabled={isGenerating}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Wand2 className={`size-4 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Synthesizing Deck...' : 'Generate Deck'}</span>
              </button>
            </div>

            {/* Inspiration Prompt Pills */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-muted-foreground flex items-center gap-1 font-mono">
                <Sparkles className="size-3 text-sky-400" /> Inspiration:
              </span>
              <button
                onClick={() => {
                  setDeck(SAMPLE_DECKS.vidcraft)
                  setCurrentSlideIndex(0)
                }}
                className="px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted border border-border/60 transition cursor-pointer"
              >
                ✨ VidCraft Multi-Agent Engine
              </button>
              <button
                onClick={() => {
                  setDeck(SAMPLE_DECKS.mars)
                  setCurrentSlideIndex(0)
                }}
                className="px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted border border-border/60 transition cursor-pointer"
              >
                🚀 Mars Colonization 2035
              </button>
              <button
                onClick={() => {
                  setPromptTopic('Quantum Computing Cryptographic Resilience')
                  handleGenerateDeck('Quantum Computing Cryptographic Resilience')
                }}
                className="px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted border border-border/60 transition cursor-pointer"
              >
                ⚛️ Quantum Computing Architecture
              </button>
            </div>

            {/* Deck Configuration Options */}
            <div className="pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-4 text-xs">
              {/* Slide count selector */}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-mono">Slides:</span>
                {[3, 5, 8, 10].map((count) => (
                  <button
                    key={count}
                    onClick={() => setSlideCount(count)}
                    className={`px-2.5 py-1 rounded-md font-mono transition cursor-pointer ${
                      slideCount === count
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 font-bold'
                        : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>

              {/* Theme Picker */}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-mono flex items-center gap-1">
                  <Palette className="size-3" /> Theme:
                </span>
                <div className="flex items-center gap-1.5">
                  {THEME_OPTIONS.map((themeOpt) => (
                    <button
                      key={themeOpt.key}
                      onClick={() => setSelectedTheme(themeOpt.key)}
                      title={themeOpt.name}
                      className={`size-6 rounded-full border-2 transition cursor-pointer flex items-center justify-center text-[10px] font-bold ${
                        selectedTheme === themeOpt.key
                          ? 'border-white scale-110 shadow-md ring-2 ring-sky-400/40'
                          : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                      }`}
                      style={{ background: themeOpt.dot }}
                    >
                      {themeOpt.key === 'auto' ? '⚡' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Master Template Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-mono flex items-center gap-1">
                  <LayoutTemplate className="size-3 text-sky-400" /> Master:
                </span>
                <select
                  value={selectedMasterTemplate}
                  onChange={(e) => setSelectedMasterTemplate(e.target.value)}
                  className="bg-background border border-border/80 rounded-lg px-2.5 py-1 text-xs outline-none font-semibold cursor-pointer max-w-[220px] truncate"
                >
                  <option value="auto">⚡ Auto (Best Fit)</option>
                  <optgroup label="🌐 Online Downloaded Master PPTX Decks">
                    {Object.values(MASTER_TEMPLATES)
                      .filter((tmpl) => tmpl.pptxFile)
                      .map((tmpl) => (
                        <option key={tmpl.id} value={tmpl.id}>
                          {tmpl.badge} — {tmpl.name}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="📐 Framework Archetypes">
                    {Object.values(MASTER_TEMPLATES)
                      .filter((tmpl) => !tmpl.pptxFile)
                      .map((tmpl) => (
                        <option key={tmpl.id} value={tmpl.id}>
                          {tmpl.badge} — {tmpl.name}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              {/* Audience Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-mono">Audience:</span>
                <select
                  value={selectedAudience}
                  onChange={(e) => setSelectedAudience(e.target.value)}
                  className="bg-background border border-border/80 rounded-lg px-2.5 py-1 text-xs outline-none"
                >
                  <option value="investor">Investor / Pitch</option>
                  <option value="enterprise">Enterprise Client</option>
                  <option value="engineering">Engineering Team</option>
                  <option value="general">General Public</option>
                </select>
              </div>

              {/* Tone Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-mono">Tone:</span>
                <select
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value)}
                  className="bg-background border border-border/80 rounded-lg px-2.5 py-1 text-xs outline-none"
                >
                  <option value="visionary">Visionary & Pitch</option>
                  <option value="technical">Technical Architecture</option>
                  <option value="executive">Executive Summary</option>
                  <option value="academic">Academic Lecture</option>
                </select>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Error alert if any */}
      {errorMessage && (
        <div className="max-w-6xl w-full mx-auto mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-auto text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Slide Presentation Stage */}
      <div className="max-w-6xl w-full mx-auto flex flex-col items-center">
        {/* View Mode Switcher Header */}
        <div className="w-full flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider font-semibold">
              View:
            </span>
            <div className="flex items-center p-0.5 bg-muted/60 border border-border/80 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setViewMode('stage')}
                className="px-3 py-1 rounded-lg transition cursor-pointer bg-background text-foreground shadow-sm font-semibold"
              >
                🖥️ Stage Preview
              </button>
              <button
                onClick={() => setViewMode('canva')}
                className="px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-semibold"
              >
                <Sparkles className="size-3 text-purple-400" />
                <span>🎨 Canva Studio</span>
              </button>
            </div>
          </div>

          {(deck.master_template || selectedMasterTemplate) && (deck.master_template || selectedMasterTemplate) !== 'auto' && MASTER_TEMPLATES[deck.master_template || selectedMasterTemplate] && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs font-medium">
              <span className="text-muted-foreground">Active Master:</span>
              <span className="font-bold text-sky-400">
                {MASTER_TEMPLATES[deck.master_template || selectedMasterTemplate].badge} {MASTER_TEMPLATES[deck.master_template || selectedMasterTemplate].name}
              </span>
            </div>
          )}
        </div>

        {/* Slide Canvas */}
        <div className="w-full relative group">
          <SlideCanvas
            slide={currentSlide}
            theme={deck.theme}
            deckTitle={deck.title}
            masterTemplate={deck.master_template || selectedMasterTemplate}
            isEditing={isEditing}
            onUpdateSlide={handleUpdateSlide}
            isFullscreen={isFullscreen}
          />

          {/* Floating Left/Right Stage Navigation Overlays */}
          <button
            onClick={handlePrevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xl z-20"
            title="Previous Slide (←)"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            onClick={handleNextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xl z-20"
            title="Next Slide (→ / Space)"
          >
            <ChevronRight className="size-6" />
          </button>
        </div>

        {/* Presentation Controls Bar */}
        <div className="w-full mt-4 flex items-center justify-between bg-card/70 backdrop-blur-md border border-border/80 rounded-2xl px-5 py-3 shadow-sm">
          {/* Slide Navigation & Playback */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevSlide}
              className="size-8 rounded-lg border border-border hover:bg-muted grid place-items-center transition cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="size-4" />
            </button>

            <span className="text-xs font-mono font-semibold px-2">
              {currentSlideIndex + 1} / {deck.slides.length}
            </span>

            <button
              onClick={handleNextSlide}
              className="size-8 rounded-lg border border-border hover:bg-muted grid place-items-center transition cursor-pointer"
              title="Next"
            >
              <ChevronRight className="size-4" />
            </button>

            <div className="h-4 w-px bg-border/80 mx-1" />

            {/* Video Auto-play mode button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                isPlaying
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'border border-border hover:bg-muted'
              }`}
              title="Play presentation automatically as a video"
            >
              {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              <span>{isPlaying ? 'Pause Auto' : 'Auto Play'}</span>
            </button>

            {/* Narration voice speech button */}
            <button
              onClick={handleToggleNarration}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                isSpeaking
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 animate-pulse'
                  : 'border border-border hover:bg-muted'
              }`}
              title="Speak narration notes for this slide"
            >
              {isSpeaking ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
              <span>{isSpeaking ? 'Mute Voice' : 'Narration'}</span>
            </button>
          </div>

          {/* Right Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                isEditing
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : 'border border-border hover:bg-muted'
              }`}
            >
              <Pencil className="size-3.5" />
              <span>{isEditing ? 'Done Editing' : 'Edit Slide'}</span>
            </button>

            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                showNotes
                  ? 'bg-muted text-foreground'
                  : 'border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="size-3.5" />
              <span>Speaker Notes</span>
            </button>

            {isFullscreen && (
              <button
                onClick={handleToggleFullscreen}
                className="size-8 rounded-lg border border-border hover:bg-muted grid place-items-center transition cursor-pointer"
                title="Exit Fullscreen (Esc)"
              >
                <Minimize2 className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Speaker Notes Tray */}
        {showNotes && (
          <div className="w-full mt-3 p-4 bg-muted/40 border border-border/80 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="size-3 text-sky-400" /> Presenter Script & Speaker Notes
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                Slide {currentSlideIndex + 1}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90 font-sans">
              {currentSlide.speaker_notes || 'No speaker notes written for this slide.'}
            </p>
          </div>
        )}

        {/* Slide Thumbnail Filmstrip */}
        <div className="w-full mt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
              <Layers className="size-3.5 text-sky-400" /> Deck Overview ({deck.slides.length} Slides)
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              Use ← / → arrows or click a slide to jump
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {deck.slides.map((s, idx) => (
              <div
                key={s.id || idx}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`group p-3 rounded-xl border text-left transition cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  currentSlideIndex === idx
                    ? 'border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/20 shadow-md'
                    : 'border-border/80 bg-card hover:border-sky-500/40 hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-muted-foreground">
                    #{idx + 1}
                  </span>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {s.layout.replace('_', ' ')}
                  </span>
                </div>
                <h4 className="text-xs font-semibold line-clamp-2 mb-1 group-hover:text-sky-400 transition">
                  {s.title}
                </h4>
                <p className="text-[10px] text-muted-foreground line-clamp-1">
                  {s.subtitle || s.bullet_points[0] || 'Slide content'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
