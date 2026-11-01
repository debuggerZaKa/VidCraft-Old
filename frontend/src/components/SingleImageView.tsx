import { useState } from 'react'
import {
  ArrowRight,
  Camera,
  Columns,
  Eye,
  ImageIcon,
  Loader2,
  Sparkles,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import * as api from '@/lib/api'
import type { SingleImageResponse } from '@/lib/types'
import { cn } from '@/lib/utils'

const PROVIDER_LABEL: Record<SingleImageResponse['provider'], string> = {
  huggingface: 'Hugging Face (FLUX.1)',
  pollinations: 'Pollinations',
  cloudflare: 'Cloudflare',
}

interface SingleImageViewProps {
  data: SingleImageResponse
  onUpdateData?: (updated: SingleImageResponse) => void
}

export function SingleImageView({ data, onUpdateData }: SingleImageViewProps) {
  // Initialize with comparison data if available
  const initialEnhanced = data.comparison?.withCorpus ?? (data.useCorpus !== false ? data : null)
  const initialRaw = data.comparison?.withoutCorpus ?? (data.useCorpus === false ? data : null)

  const [enhancedData, setEnhancedData] = useState<SingleImageResponse | null>(initialEnhanced)
  const [rawData, setRawData] = useState<SingleImageResponse | null>(initialRaw)
  const [activeView, setActiveView] = useState<'enhanced' | 'raw' | 'split'>('enhanced')
  const [loadingCounterpart, setLoadingCounterpart] = useState(false)

  // Fetch missing counterpart with the exact same seed for true A/B comparison
  async function fetchCounterpart(targetMode: 'enhanced' | 'raw') {
    if (loadingCounterpart) return
    const needCorpus = targetMode === 'enhanced'
    setLoadingCounterpart(true)
    try {
      const res = await api.generateSingleImage(
        data.promptId,
        data.provider,
        [],
        needCorpus,
        data.seed,
        data.refImage,
        undefined,
        false
      )
      if (needCorpus) {
        setEnhancedData(res)
        setActiveView('enhanced')
      } else {
        setRawData(res)
        setActiveView('raw')
      }
      if (onUpdateData) {
        onUpdateData({
          ...data,
          comparison: {
            withCorpus: needCorpus ? res : (enhancedData || data),
            withoutCorpus: !needCorpus ? res : (rawData || data),
          },
        })
      }
    } catch (err) {
      console.error('Failed to generate comparison image:', err)
    } finally {
      setLoadingCounterpart(false)
    }
  }

  const currentDisplay = activeView === 'raw' && rawData ? rawData : (enhancedData || data)
  const hasBoth = !!(enhancedData && rawData)

  return (
    <div className="flex flex-col gap-5">
      {/* View Switcher / Portals Header */}
      <Card className="border-primary/20 bg-card/60 backdrop-blur-sm">
        <CardContent className="flex flex-col gap-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <ImageIcon className="size-4.5" />
              </span>
              <div>
                <h3 className="text-base font-semibold">Image Generation Studio</h3>
                <p className="text-muted-foreground text-xs">
                  A/B Quality Evaluation: Compare raw baseline vs 12,000+ prompt corpus.
                </p>
              </div>
            </div>

            {/* Tab Portals */}
            <div className="flex items-center rounded-lg border border-border/80 bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => {
                  if (enhancedData) {
                    setActiveView('enhanced')
                  } else {
                    void fetchCounterpart('enhanced')
                  }
                }}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                  activeView === 'enhanced'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Sparkles className="size-3.5" />
                <span>With Corpus</span>
                <Badge variant="outline" className="ml-1 text-[9px] border-primary-foreground/30 px-1 py-0">
                  12k RAG
                </Badge>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (rawData) {
                    setActiveView('raw')
                  } else {
                    void fetchCounterpart('raw')
                  }
                }}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                  activeView === 'raw'
                    ? 'bg-destructive/80 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Eye className="size-3.5" />
                <span>Without Corpus</span>
                <Badge variant="outline" className="ml-1 text-[9px] px-1 py-0">
                  Raw
                </Badge>
              </button>

              {hasBoth && (
                <button
                  type="button"
                  onClick={() => setActiveView('split')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                    activeView === 'split'
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Columns className="size-3.5" />
                  <span>Split View</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Comparison Bar if counterpart is missing */}
          {!hasBoth && (
            <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-3.5 py-2 text-xs">
              <span className="text-muted-foreground">
                Want to compare against the {enhancedData ? 'raw unenhanced prompt' : '12,000+ corpus enhanced version'}?
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={loadingCounterpart}
                onClick={() => fetchCounterpart(enhancedData ? 'raw' : 'enhanced')}
                className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10"
              >
                {loadingCounterpart ? (
                  <>
                    <Loader2 className="size-3 animate-spin mr-1.5" />
                    Generating counterpart…
                  </>
                ) : (
                  <>
                    <Columns className="size-3 mr-1.5" />
                    Load {enhancedData ? 'Raw Baseline' : 'Corpus Enhanced'}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- View Mode 1: Split Side-by-Side Comparison --- */}
      {activeView === 'split' && hasBoth ? (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column: Raw Baseline (Without Corpus) */}
          <div className="flex flex-col gap-4">
            <Card className="border-border">
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-muted-foreground border-border text-xs">
                    🚫 Without Corpus (Raw Baseline)
                  </Badge>
                  <span className="text-muted-foreground text-[11px] font-mono">
                    Seed: #{data.seed ?? 'auto'}
                  </span>
                </div>
                <div>
                  <div className="text-muted-foreground text-[11px]">Prompt sent to model:</div>
                  <p className="text-sm font-medium text-foreground/90 mt-0.5 line-clamp-3">
                    “{rawData?.enhancedPrompt || data.originalPrompt}”
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-border p-0">
              <img
                src={rawData?.imageUrl}
                alt="Raw Baseline Image"
                className="aspect-square w-full object-cover"
              />
            </Card>
          </div>

          {/* Right Column: With Corpus (Prompt Architect) */}
          <div className="flex flex-col gap-4">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <Badge variant="cyan" className="text-xs">
                    <Sparkles className="size-3 mr-1" />
                    With 12k Corpus & Architect
                  </Badge>
                  <span className="text-muted-foreground text-[11px] font-mono">
                    Seed: #{data.seed ?? 'auto'}
                  </span>
                </div>
                <div>
                  <div className="text-muted-foreground text-[11px]">Synthesized Prompt Brief:</div>
                  <p className="text-xs italic text-foreground/90 mt-0.5 line-clamp-3">
                    “{enhancedData?.enhancedPrompt}”
                  </p>
                </div>
                {(enhancedData?.camera || enhancedData?.lighting) && (
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] text-muted-foreground">
                    {enhancedData?.camera && (
                      <span className="bg-muted/70 px-2 py-0.5 rounded">
                        📷 {enhancedData.camera}
                      </span>
                    )}
                    {enhancedData?.lighting && (
                      <span className="bg-muted/70 px-2 py-0.5 rounded">
                        💡 {enhancedData.lighting}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-primary/40 p-0 shadow-md">
              <img
                src={enhancedData?.imageUrl}
                alt="Corpus Enhanced Image"
                className="aspect-square w-full object-cover"
              />
            </Card>
          </div>
        </div>
      ) : (
        /* --- View Mode 2: Single Tab Display --- */
        <div className="flex flex-col gap-5">
          <Card>
            <CardContent className="flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={currentDisplay.useCorpus !== false ? 'cyan' : 'outline'}
                    className="text-xs"
                  >
                    {currentDisplay.useCorpus !== false ? (
                      <>
                        <Sparkles className="size-3 mr-1" />
                        With 12k Corpus & Prompt Architect
                      </>
                    ) : (
                      <>🚫 Raw Baseline (Without Corpus)</>
                    )}
                  </Badge>
                  {currentDisplay.style?.name && (
                    <Badge variant="outline" className="border-primary/30 text-xs">
                      {currentDisplay.style.name}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {currentDisplay.seed && (
                    <span className="text-muted-foreground text-xs font-mono">
                      Seed: #{currentDisplay.seed}
                    </span>
                  )}
                  <Badge variant="outline" className="text-xs">
                    <Camera className="size-3 mr-1" />
                    {PROVIDER_LABEL[data.provider]}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
                <div className="space-y-1.5">
                  <div className="text-muted-foreground text-xs">Your raw prompt</div>
                  <p className="text-sm leading-relaxed">{data.originalPrompt}</p>
                </div>
                <ArrowRight className="text-muted-foreground mt-1 hidden size-4 shrink-0 sm:block" />
                <div className="space-y-1.5">
                  <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <Sparkles className="size-3.5" />
                    {currentDisplay.useCorpus !== false
                      ? 'Enhanced Prompt (12,000+ Corpus)'
                      : 'Prompt sent to provider'}
                  </div>
                  <p className="text-foreground/90 text-sm italic leading-relaxed">
                    “{currentDisplay.enhancedPrompt}”
                  </p>
                </div>
              </div>

              {(currentDisplay.camera || currentDisplay.lighting || currentDisplay.subjectAnchor) && (
                <div className="flex flex-col gap-2 pt-2 border-t border-border/40 text-xs">
                  {currentDisplay.subjectAnchor && (
                    <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-emerald-300">
                      <span className="font-semibold shrink-0">🔒 Locked Subject Anchor (Qwen-VL):</span>
                      <span className="truncate">{currentDisplay.subjectAnchor}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 text-muted-foreground">
                    {currentDisplay.camera && (
                      <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md">
                        <Camera className="size-3 text-primary" />
                        <span>{currentDisplay.camera}</span>
                      </div>
                    )}
                    {currentDisplay.lighting && (
                      <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md">
                        <span>💡 {currentDisplay.lighting}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/30 overflow-hidden p-0">
            <img
              src={currentDisplay.imageUrl}
              alt={currentDisplay.enhancedPrompt}
              className="aspect-square w-full object-cover"
            />
          </Card>
        </div>
      )}
    </div>
  )
}
