import { useState, useRef } from 'react'
import {
  Sparkles,
  ImageIcon,
  Columns,
  Loader2,
  Wand2,
  Upload,
  X,
  Lock,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SingleImageView } from '@/components/SingleImageView'
import * as api from '@/lib/api'
import type { ImageProvider, SingleImageResponse } from '@/lib/types'
import { cn } from '@/lib/utils'

const QUICK_PROMPTS = [
  {
    label: 'Mystic Dragon',
    prompt: 'Ancient mystic dragon perched on crystal mountain peak at dusk, glowing eyes',
  },
  {
    label: 'Cyberpunk Alley',
    prompt: 'Cyberpunk samurai in neon rainy alleyway, reflective puddle, high-tech katana',
  },
  {
    label: 'Cinematic Portrait',
    prompt: 'Cinematic portrait of an astronaut inside a bioluminescent alien cave, helmet reflection',
  },
  {
    label: 'Desert Hypercar',
    prompt: 'Sleek futuristic concept hypercar speeding through orange desert dunes at golden hour',
  },
]

const STYLES = [
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'photorealistic', label: 'Photoreal' },
  { id: '3d-render', label: '3D Render' },
  { id: 'anime', label: 'Anime' },
  { id: 'cyberpunk', label: 'Cyberpunk' },
  { id: 'film-noir', label: 'Film Noir' },
  { id: 'fantasy-art', label: 'Fantasy Art' },
]

const ASPECT_RATIOS = [
  { id: '1:1', label: 'Square (1:1)', width: 1024, height: 1024 },
  { id: '16:9', label: 'Landscape (16:9)', width: 1344, height: 768 },
  { id: '9:16', label: 'Vertical (9:16)', width: 768, height: 1344 },
  { id: '4:3', label: 'Classic (4:3)', width: 1152, height: 864 },
]

export function ImageStudio({ demoMode = false }: { demoMode?: boolean }) {
  const [prompt, setPrompt] = useState('Ancient mystic dragon perched on crystal mountain peak at dusk')
  const [selectedStyle, setSelectedStyle] = useState<string>('cinematic')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [provider, setProvider] = useState<ImageProvider>('cloudflare')
  const [numSteps, setNumSteps] = useState<number>(8)
  const [useCorpus, setUseCorpus] = useState(true)
  const [compareMode, setCompareMode] = useState(false)
  const [customSeed, setCustomSeed] = useState<number>(42)
  const [randomSeed, setRandomSeed] = useState(true)
  const [refImage, setRefImage] = useState<string | null>(null)
  const [refStrength, setRefStrength] = useState<number>(0.75)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setRefImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SingleImageResponse | null>(null)

  async function handleGenerate() {
    if (!prompt.trim() || busy) return
    setBusy(true)
    setError(null)

    try {
      // 1. Analyze prompt or create prompt record
      const pRes = await api.analyzePrompt(prompt.trim(), demoMode)
      const promptId = pRes.promptId

      const seedToUse = randomSeed ? Math.floor(Math.random() * 1000000) : customSeed
      const tokens = [selectedStyle, `aspect:${aspectRatio}`]

      if (compareMode) {
        // A/B Compare: generate both raw and corpus-enhanced versions
        const comp = await api.generateImageComparison(
          promptId,
          provider,
          tokens,
          seedToUse,
          refImage || undefined,
          refStrength,
          demoMode,
          numSteps
        )
        const primary = comp.withCorpus ?? comp.withoutCorpus
        setResult({
          ...primary,
          promptId: comp.promptId,
          provider: comp.provider,
          seed: comp.seed,
          comparison: {
            withoutCorpus: comp.withoutCorpus,
            withCorpus: comp.withCorpus,
            counterpartError: comp.counterpartError,
          },
        })
      } else {
        // Single image with current toggle state
        const single = await api.generateSingleImage(
          promptId,
          provider,
          tokens,
          useCorpus,
          seedToUse,
          refImage || undefined,
          refStrength,
          demoMode,
          numSteps
        )
        setResult(single)
      }
    } catch (err) {
      console.error('Image generation failed:', err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6">
      {/* Hero Header */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-tr from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30">
              <ImageIcon className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">FLUX.1 Image Studio</h1>
                <Badge variant="outline" className="border-purple-500/40 bg-purple-500/10 text-purple-300 text-[10px]">
                  12B State-of-the-Art
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                High-fidelity photorealistic generation powered by Black Forest Labs FLUX.1 & 12,000+ Midjourney RAG Corpus.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg border border-border/60">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ready for on-demand generation</span>
          </div>
        </div>
      </div>

      {/* Main Studio Controls */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Prompting & Controls */}
        <div className="flex flex-col gap-5 lg:col-span-5">
          <Card className="border-border/70 bg-card/60 backdrop-blur-sm">
            <CardContent className="flex flex-col gap-4 p-5">
              {/* Prompt Input */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <label htmlFor="image-prompt" className="flex items-center gap-1.5 text-foreground">
                    <Wand2 className="size-3.5 text-primary" />
                    <span>Your Image Prompt</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground">{prompt.length} chars</span>
                </div>
                <textarea
                  id="image-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your scene in detail..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-border/80 bg-background/80 p-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />

                {/* Quick Prompts */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {QUICK_PROMPTS.map((qp) => (
                    <button
                      key={qp.label}
                      type="button"
                      onClick={() => setPrompt(qp.prompt)}
                      className="rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                    >
                      {qp.label}
                    </button>
                  ))}
                </div>

                {/* Reference Image (Img2Img with Subject Anchor) */}
                <div className="flex flex-col gap-2 pt-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {!refImage ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-between rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-2 text-xs text-muted-foreground transition hover:border-primary/50 hover:bg-muted/40"
                    >
                      <span className="flex items-center gap-2">
                        <Upload className="size-3.5 text-primary" />
                        <span>Add Reference Image (Subject Anchored Mode)</span>
                      </span>
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        Optional
                      </span>
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={refImage}
                            alt="Reference"
                            className="size-11 rounded-md object-cover border border-primary/40 shadow-sm"
                          />
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                              <Lock className="size-3 text-emerald-400" />
                              <span>Reference Image Attached</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              Qwen-VL will lock subject identity; Llama + 12k Corpus transforms environment.
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setRefImage(null)}
                          className="rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>

                      {/* Reference Influence Slider */}
                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="text-muted-foreground">Anchor Strictness:</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0.3"
                            max="0.95"
                            step="0.05"
                            value={refStrength}
                            onChange={(e) => setRefStrength(parseFloat(e.target.value))}
                            className="h-1.5 w-24 accent-primary"
                          />
                          <span className="font-mono text-[10px]">{Math.round(refStrength * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-px bg-border/60" />

              {/* Corpus & Prompt Architect Toggle */}
              <div className="flex flex-col gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        12,000+ Prompt Corpus & Architect
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {useCorpus
                          ? 'ACTIVE: Injects Midjourney exemplars, lighting & optics for FLUX.1'
                          : 'RAW BASELINE: Passes pure raw prompt directly to FLUX.1'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setUseCorpus(!useCorpus)}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                      useCorpus ? 'bg-primary' : 'bg-muted-foreground/30'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                        useCorpus ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* A/B Compare Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <Columns className="size-3.5 text-muted-foreground" />
                  <div>
                    <div className="text-xs font-medium">A/B Compare Mode</div>
                    <div className="text-[10px] text-muted-foreground">
                      Generates both With-Corpus and Raw versions with identical seed
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCompareMode(!compareMode)}
                  className={cn(
                    'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                    compareMode ? 'bg-accent-foreground' : 'bg-muted-foreground/30'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                      compareMode ? 'translate-x-4' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              {/* Model / Provider Selector */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-foreground">Generation Model / Provider</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setProvider('cloudflare')}
                    className={cn(
                      'flex flex-col items-center justify-center rounded-lg border p-2 text-center transition',
                      provider === 'cloudflare'
                        ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300 font-semibold shadow-sm'
                        : 'border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span className="text-xs font-semibold">Cloudflare AI</span>
                    <span className="text-[9px] text-emerald-400">FLUX.1 (57/day Free)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProvider('pollinations')}
                    className={cn(
                      'flex flex-col items-center justify-center rounded-lg border p-2 text-center transition',
                      provider === 'pollinations'
                        ? 'border-primary bg-primary/10 text-primary font-semibold shadow-sm'
                        : 'border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span className="text-xs">Pollinations</span>
                    <span className="text-[9px] text-muted-foreground">Free Tier (Sana)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProvider('huggingface')}
                    className={cn(
                      'flex flex-col items-center justify-center rounded-lg border p-2 text-center transition',
                      provider === 'huggingface'
                        ? 'border-purple-500/60 bg-purple-500/10 text-purple-300 font-semibold shadow-sm'
                        : 'border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span className="text-xs">Hugging Face</span>
                    <span className="text-[9px] text-muted-foreground">FLUX.1 (Needs Credits)</span>
                  </button>
                </div>
              </div>

              {/* Style Presets */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-foreground">Style Aesthetic</span>
                <div className="flex flex-wrap gap-1.5">
                  {STYLES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStyle(s.id)}
                      className={cn(
                        'rounded-md border px-2.5 py-1 text-xs transition',
                        selectedStyle === s.id
                          ? 'border-primary bg-primary/15 text-primary font-medium'
                          : 'border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-foreground">Aspect Ratio</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {ASPECT_RATIOS.map((ar) => (
                    <button
                      key={ar.id}
                      type="button"
                      onClick={() => setAspectRatio(ar.id)}
                      className={cn(
                        'rounded-md border px-2 py-1.5 text-center text-xs transition',
                        aspectRatio === ar.id
                          ? 'border-primary bg-primary/15 text-primary font-medium'
                          : 'border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <div>{ar.id}</div>
                      <div className="text-[9px] text-muted-foreground">{ar.width}x{ar.height}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality & Inference Steps (Denoising depth) */}
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Inference Steps (Denoising Quality)</span>
                  <span className="text-[11px] font-mono text-primary font-medium">{numSteps} Steps</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNumSteps(4)}
                    className={cn(
                      'flex flex-col items-center justify-center rounded-lg border p-2 text-center transition',
                      numSteps === 4
                        ? 'border-primary bg-primary/10 text-primary font-semibold shadow-sm'
                        : 'border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span className="text-xs font-medium">4 Steps</span>
                    <span className="text-[9px] text-muted-foreground">Fast / Single Subject</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNumSteps(6)}
                    className={cn(
                      'flex flex-col items-center justify-center rounded-lg border p-2 text-center transition',
                      numSteps === 6
                        ? 'border-primary bg-primary/10 text-primary font-semibold shadow-sm'
                        : 'border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span className="text-xs font-medium">6 Steps</span>
                    <span className="text-[9px] text-muted-foreground">Balanced Quality</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNumSteps(8)}
                    className={cn(
                      'flex flex-col items-center justify-center rounded-lg border p-2 text-center transition',
                      numSteps === 8
                        ? 'border-emerald-500/80 bg-emerald-500/10 text-emerald-300 font-semibold shadow-sm'
                        : 'border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span className="text-xs font-medium">8 Steps (Max)</span>
                    <span className="text-[9px] text-emerald-400">Complex / Multi-Object</span>
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Higher steps give FLUX more denoising passes to resolve complex multi-subject anatomy (sharks, foam, rigging) without object blending.
                </p>
              </div>

              {/* Seed Controls */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Seed:</span>
                  {randomSeed ? (
                    <Badge variant="outline" className="text-[10px]">Randomized</Badge>
                  ) : (
                    <input
                      type="number"
                      value={customSeed}
                      onChange={(e) => setCustomSeed(parseInt(e.target.value, 10) || 0)}
                      className="w-20 rounded border border-border/80 bg-background px-1.5 py-0.5 text-xs text-foreground"
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setRandomSeed(!randomSeed)}
                  className="text-[11px] text-primary hover:underline"
                >
                  {randomSeed ? 'Pin specific seed' : 'Use random seed'}
                </button>
              </div>

              {/* Generate Button */}
              <Button
                size="lg"
                disabled={busy || !prompt.trim()}
                onClick={handleGenerate}
                className="mt-2 w-full font-semibold shadow-md gap-2"
              >
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Generating with {provider === 'huggingface' ? 'FLUX.1-schnell' : provider}…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    <span>
                      {compareMode
                        ? 'Generate A/B Comparison'
                        : `Generate with ${provider === 'huggingface' ? 'FLUX.1' : provider}`}
                    </span>
                  </>
                )}
              </Button>

              {error && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                  <div className="font-semibold">Generation Error:</div>
                  <div className="mt-0.5">{error}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Display / SingleImageView */}
        <div className="flex flex-col gap-4 lg:col-span-7">
          {result ? (
            <SingleImageView data={result} onUpdateData={(updated) => setResult(updated)} />
          ) : (
            <Card className="flex min-h-[460px] flex-col items-center justify-center border-dashed border-border/80 bg-card/30 p-8 text-center backdrop-blur-sm">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-4 border border-border/60">
                <ImageIcon className="size-8 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-semibold">No Image Generated Yet</h3>
              <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
                Enter a prompt on the left and click Generate. You can compare the result with and without the 12,000-prompt corpus using the toggle.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  ⚡ Model: FLUX.1-schnell (12B)
                </Badge>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  📚 Corpus: 12,000 Midjourney Exemplars
                </Badge>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  🔄 A/B Testing Toggle
                </Badge>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
