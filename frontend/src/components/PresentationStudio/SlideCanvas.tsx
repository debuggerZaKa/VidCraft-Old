import React from 'react'
import {
  Sparkles,
  TrendingUp,
  Quote,
  Image as ImageIcon,
  Check,
} from 'lucide-react'
import { resolveReliableSlideImage } from './polotnoTemplates'
import { MASTER_TEMPLATES } from './masterTemplates'
import type { PresentationSlide, SlideTheme } from '@/lib/types'


interface SlideCanvasProps {
  slide: PresentationSlide
  theme: SlideTheme
  deckTitle: string
  masterTemplate?: string
  isEditing?: boolean
  onUpdateSlide?: (updated: PresentationSlide) => void
  isFullscreen?: boolean
}

export const SlideCanvas: React.FC<SlideCanvasProps> = ({
  slide,
  theme,
  deckTitle,
  masterTemplate,
  isEditing = false,
  onUpdateSlide,
  isFullscreen = false,
}) => {
  const [editingTitle, setEditingTitle] = React.useState(slide.title)
  const [editingSubtitle, setEditingSubtitle] = React.useState(slide.subtitle || '')
  const [editingBullets, setEditingBullets] = React.useState(slide.bullet_points.join('\n'))

  React.useEffect(() => {
    setEditingTitle(slide.title)
    setEditingSubtitle(slide.subtitle || '')
    setEditingBullets(slide.bullet_points.join('\n'))
  }, [slide])

  const masterMeta = masterTemplate && masterTemplate !== 'auto' ? MASTER_TEMPLATES[masterTemplate] : null
  const templateBgUrl = masterMeta?.pptxFile
    ? `http://localhost:5000/media/presentations/templates/${masterMeta.id}_slide_${((slide.slide_index - 1) % 15) + 1}.jpg`
    : null

  const handleSaveEdit = () => {
    if (!onUpdateSlide) return
    const newBullets = editingBullets
      .split('\n')
      .map((b) => b.trim())
      .filter(Boolean)
    onUpdateSlide({
      ...slide,
      title: editingTitle,
      subtitle: editingSubtitle,
      bullet_points: newBullets,
    })
  }

  const bgStyle = {
    backgroundColor: theme.bg_color,
    color: theme.text_primary,
  }

  const cardStyle = templateBgUrl
    ? {
        backgroundColor: 'rgba(9, 14, 26, 0.78)',
        backdropFilter: 'blur(16px)',
        borderColor: `${theme.accent}66`,
      }
    : {
        backgroundColor: theme.card_bg,
        borderColor: `${theme.accent}33`,
      }

  return (
    <div
      className={`relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col justify-between transition-all select-none ${
        isFullscreen ? 'h-full max-h-[92vh] max-w-[170vh]' : 'max-h-[580px]'
      }`}
      style={bgStyle}
    >
      {/* Master Template Background Image with glassmorphism gradient */}
      {templateBgUrl ? (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src={templateBgUrl}
            alt="Master Template Background"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/35 backdrop-blur-[1px]" />
        </div>
      ) : (
        <>
          {/* Background ambient gradient glow */}
          <div
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[110px] pointer-events-none opacity-30"
            style={{ backgroundColor: theme.accent }}
          />
          <div
            className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-[110px] pointer-events-none opacity-20"
            style={{ backgroundColor: theme.accent_secondary || theme.accent }}
          />
        </>
      )}

      {/* Top Header / Breadcrumb */}
      <div className="relative z-10 flex items-center justify-between px-8 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <div
            className="w-2.5 h-6 rounded-full"
            style={{ backgroundColor: theme.accent }}
          />
          <span
            className="text-xs uppercase tracking-widest font-mono font-bold"
            style={{ color: theme.accent }}
          >
            VIDCRAFT AI · {deckTitle}
          </span>
          {masterMeta && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold shadow-sm backdrop-blur-sm">
              {masterMeta.badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-mono px-2.5 py-1 rounded-full border border-white/10"
            style={{ color: theme.text_secondary, backgroundColor: `${theme.card_bg}cc` }}
          >
            SLIDE {String(slide.slide_index).padStart(2, '0')}
          </span>
          <span
            className="text-xs font-mono uppercase px-2.5 py-1 rounded-full border"
            style={{
              borderColor: `${theme.accent}44`,
              color: theme.accent,
              backgroundColor: `${theme.accent}15`,
            }}
          >
            {slide.layout.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Center Slide Body */}
      <div className="relative z-10 flex-1 px-8 py-4 flex flex-col justify-center">
        {isEditing ? (
          <div className="bg-black/40 backdrop-blur-md p-6 rounded-xl border border-white/20 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Quick Editor
              </span>
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-1.5 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 transition cursor-pointer"
              >
                <Check className="size-3.5" /> Save Changes
              </button>
            </div>
            <div>
              <label className="text-[11px] font-mono text-muted-foreground uppercase">
                Slide Headline
              </label>
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                className="w-full mt-1 bg-background/80 border border-border px-3 py-1.5 rounded-lg text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-muted-foreground uppercase">
                Subtitle
              </label>
              <input
                type="text"
                value={editingSubtitle}
                onChange={(e) => setEditingSubtitle(e.target.value)}
                className="w-full mt-1 bg-background/80 border border-border px-3 py-1.5 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-muted-foreground uppercase">
                Bullet Points (one per line)
              </label>
              <textarea
                rows={3}
                value={editingBullets}
                onChange={(e) => setEditingBullets(e.target.value)}
                className="w-full mt-1 bg-background/80 border border-border px-3 py-1.5 rounded-lg text-xs font-sans resize-none"
              />
            </div>
          </div>
        ) : (
          <>
            {/* LAYOUT 1: TITLE COVER */}
            {slide.layout === 'title_cover' && (
              <div className="flex flex-col justify-center items-start max-w-4xl">
                <div
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border"
                  style={{
                    backgroundColor: `${theme.accent}15`,
                    borderColor: `${theme.accent}44`,
                    color: theme.accent,
                  }}
                >
                  <Sparkles className="size-3.5" />
                  Keynote Presentation
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4">
                  {slide.title}
                </h1>
                {slide.subtitle && (
                  <p
                    className="text-base sm:text-lg md:text-xl font-medium mb-6 leading-relaxed"
                    style={{ color: theme.accent }}
                  >
                    {slide.subtitle}
                  </p>
                )}
                {slide.bullet_points.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-2">
                    {slide.bullet_points.slice(0, 3).map((bp, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl border backdrop-blur-sm flex items-start gap-2.5"
                        style={cardStyle}
                      >
                        <div
                          className="size-2 rounded-full mt-1.5 shrink-0"
                          style={{ backgroundColor: theme.accent }}
                        />
                        <span
                          className="text-xs sm:text-sm font-medium leading-snug"
                          style={{ color: theme.text_secondary }}
                        >
                          {bp}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* LAYOUT 2: STAT CALLOUT */}
            {slide.layout === 'stat_callout' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-5 flex flex-col justify-center">
                  <div
                    className="p-6 rounded-2xl border backdrop-blur-md relative overflow-hidden"
                    style={cardStyle}
                  >
                    <div
                      className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight"
                      style={{ color: theme.accent }}
                    >
                      {slide.stat_number || '10x'}
                    </div>
                    <div
                      className="mt-2 text-sm sm:text-base font-semibold leading-snug"
                      style={{ color: theme.text_primary }}
                    >
                      {slide.stat_label || 'Acceleration in production velocity'}
                    </div>
                    <div
                      className="mt-4 pt-3 border-t text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5"
                      style={{
                        borderColor: `${theme.accent}33`,
                        color: theme.text_secondary,
                      }}
                    >
                      <TrendingUp className="size-3.5" style={{ color: theme.accent }} />
                      Verified Pipeline Metric
                    </div>
                  </div>
                </div>
                <div className="md:col-span-7 flex flex-col justify-center">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2">
                    {slide.title}
                  </h2>
                  {slide.subtitle && (
                    <p
                      className="text-sm sm:text-base mb-5"
                      style={{ color: theme.accent }}
                    >
                      {slide.subtitle}
                    </p>
                  )}
                  <ul className="space-y-3">
                    {slide.bullet_points.map((bp, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div
                          className="size-2 rounded-full mt-2 shrink-0"
                          style={{ backgroundColor: theme.accent }}
                        />
                        <span
                          className="text-sm sm:text-base leading-relaxed"
                          style={{ color: theme.text_secondary }}
                        >
                          {bp}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* LAYOUT 3: THREE COLUMN */}
            {slide.layout === 'three_column' && (
              <div className="flex flex-col justify-center">
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-1">
                    {slide.title}
                  </h2>
                  {slide.subtitle && (
                    <p
                      className="text-sm sm:text-base"
                      style={{ color: theme.accent }}
                    >
                      {slide.subtitle}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(slide.column_items && slide.column_items.length > 0
                    ? slide.column_items
                    : [
                        { title: 'Pillar 01', desc: 'Autonomous agent coordination' },
                        { title: 'Pillar 02', desc: 'RAG knowledge grounding' },
                        { title: 'Pillar 03', desc: 'Synchronized media rendering' },
                      ]
                  )
                    .slice(0, 3)
                    .map((col, i) => (
                      <div
                        key={i}
                        className="p-5 rounded-2xl border backdrop-blur-md flex flex-col justify-between"
                        style={cardStyle}
                      >
                        <div>
                          <div
                            className="size-8 rounded-lg mb-3 flex items-center justify-center font-bold text-xs"
                            style={{
                              backgroundColor: `${theme.accent}20`,
                              color: theme.accent,
                              border: `1px solid ${theme.accent}44`,
                            }}
                          >
                            0{i + 1}
                          </div>
                          <h3 className="text-base sm:text-lg font-bold mb-2">
                            {col.title}
                          </h3>
                          <p
                            className="text-xs sm:text-sm leading-relaxed"
                            style={{ color: theme.text_secondary }}
                          >
                            {col.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* LAYOUT 4: TIMELINE */}
            {slide.layout === 'timeline' && (
              <div className="flex flex-col justify-center">
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-1">
                    {slide.title}
                  </h2>
                  {slide.subtitle && (
                    <p
                      className="text-sm sm:text-base"
                      style={{ color: theme.accent }}
                    >
                      {slide.subtitle}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative">
                  {(slide.timeline_steps && slide.timeline_steps.length > 0
                    ? slide.timeline_steps
                    : [
                        { step: 'Phase 01', label: 'Architecture & Ingestion' },
                        { step: 'Phase 02', label: 'Agent Synthesis & RAG' },
                        { step: 'Phase 03', label: 'Universal Delivery' },
                      ]
                  )
                    .slice(0, 3)
                    .map((step, i) => (
                      <div
                        key={i}
                        className="p-5 rounded-2xl border backdrop-blur-md relative overflow-hidden"
                        style={cardStyle}
                      >
                        <div
                          className="text-xs font-mono font-bold uppercase tracking-wider mb-2"
                          style={{ color: theme.accent }}
                        >
                          {step.step}
                        </div>
                        <h4 className="text-base sm:text-lg font-bold mb-2">
                          {step.label}
                        </h4>
                        <div
                          className="h-1 w-full rounded-full mt-4"
                          style={{
                            backgroundColor:
                              i === 0
                                ? theme.accent
                                : `${theme.accent}44`,
                          }}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* LAYOUT 4B: CHART SLIDE */}
            {slide.layout === 'chart_slide' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-5 flex flex-col justify-center">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2">
                    {slide.title}
                  </h2>
                  {slide.subtitle && (
                    <p
                      className="text-sm sm:text-base font-medium mb-4"
                      style={{ color: theme.accent }}
                    >
                      {slide.subtitle}
                    </p>
                  )}
                  <ul className="space-y-3">
                    {slide.bullet_points.map((bp, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm sm:text-base">
                        <div
                          className="size-1.5 rounded-full mt-2 shrink-0"
                          style={{ backgroundColor: theme.accent }}
                        />
                        <span style={{ color: theme.text_secondary }}>{bp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="md:col-span-7">
                  <div
                    className="p-6 rounded-2xl border backdrop-blur-md flex flex-col justify-between"
                    style={{
                      backgroundColor: `${theme.card_bg}ee`,
                      borderColor: `${theme.accent}33`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                        {slide.chart_data?.title || 'Velocity Trajectory'}
                      </span>
                      <span className="text-[11px] font-mono" style={{ color: theme.accent }}>
                        {slide.chart_data?.unit || 'Index Units'}
                      </span>
                    </div>

                    {/* Bars */}
                    <div className="h-44 flex items-end justify-between gap-4 pt-4 border-b border-white/10 pb-2">
                      {(slide.chart_data?.values || [30, 75, 160, 420]).map((val, idx) => {
                        const vals = slide.chart_data?.values || [30, 75, 160, 420]
                        const maxV = Math.max(...vals, 1)
                        const pct = Math.round((val / maxV) * 100)
                        const isLast = idx === vals.length - 1
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                            <span
                              className="text-xs font-mono font-bold"
                              style={{ color: isLast ? theme.accent : theme.text_primary }}
                            >
                              {val}
                            </span>
                            <div
                              className="w-full rounded-t-lg transition-all duration-500"
                              style={{
                                height: `${Math.max(12, pct)}%`,
                                backgroundColor: isLast ? theme.accent : `${theme.accent}80`,
                              }}
                            />
                            <span className="text-[11px] font-mono text-muted-foreground mt-1">
                              {(slide.chart_data?.labels || ['2023', '2024', '2025', '2026E'])[idx]}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LAYOUT 5: QUOTE */}
            {slide.layout === 'quote' && (
              <div className="flex flex-col justify-center items-center text-center max-w-4xl mx-auto py-2">
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 border"
                  style={{
                    backgroundColor: `${theme.accent}15`,
                    borderColor: `${theme.accent}44`,
                    color: theme.accent,
                  }}
                >
                  <Sparkles className="size-3" />
                  Executive Vision & Takeaway
                </div>
                <div
                  className="p-8 rounded-2xl border backdrop-blur-md w-full relative overflow-hidden mb-4 shadow-xl"
                  style={cardStyle}
                >
                  <Quote
                    className="size-10 mb-3 mx-auto opacity-30"
                    style={{ color: theme.accent }}
                  />
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight mb-4 italic">
                    "{slide.title}"
                  </h2>
                  <div
                    className="h-0.5 w-24 mx-auto mb-3 rounded-full"
                    style={{ backgroundColor: theme.accent }}
                  />
                  {slide.subtitle && (
                    <p
                      className="text-xs sm:text-sm font-bold tracking-wider uppercase"
                      style={{ color: theme.accent }}
                    >
                      {slide.subtitle}
                    </p>
                  )}
                </div>

                {slide.bullet_points.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                    {slide.bullet_points.slice(0, 3).map((bp, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl border backdrop-blur-sm text-left flex items-start gap-2"
                        style={cardStyle}
                      >
                        <div
                          className="size-1.5 rounded-full mt-1.5 shrink-0"
                          style={{ backgroundColor: theme.accent }}
                        />
                        <span
                          className="text-xs font-medium leading-snug line-clamp-2"
                          style={{ color: theme.text_secondary }}
                        >
                          {bp}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* LAYOUT 6: HERO SPLIT (Default) */}
            {(slide.layout === 'hero_split' ||
              (!['title_cover', 'stat_callout', 'three_column', 'timeline', 'chart_slide', 'quote'].includes(
                slide.layout,
              ))) && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 flex flex-col justify-center">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2">
                    {slide.title}
                  </h2>
                  {slide.subtitle && (
                    <p
                      className="text-sm sm:text-base font-medium mb-4"
                      style={{ color: theme.accent }}
                    >
                      {slide.subtitle}
                    </p>
                  )}
                  <ul className="space-y-3">
                    {slide.bullet_points.map((bp, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div
                          className="size-2 rounded-full mt-2 shrink-0"
                          style={{ backgroundColor: theme.accent }}
                        />
                        <span
                          className="text-sm sm:text-base leading-relaxed"
                          style={{ color: theme.text_secondary }}
                        >
                          {bp}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="md:col-span-5 flex justify-center">
                  <div
                    className="w-full aspect-video rounded-xl overflow-hidden border relative group shadow-lg"
                    style={{ borderColor: `${theme.accent}44` }}
                  >
                    {(() => {
                      const resolvedImg = resolveReliableSlideImage(
                        slide.unsplash_keyword || `${deckTitle} ${slide.title}`,
                        slide.slide_index,
                        slide.visual_url,
                      )
                      return resolvedImg ? (
                        <img
                          src={resolvedImg}
                          alt={slide.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex flex-col items-center justify-center p-4 text-center"
                          style={{ backgroundColor: theme.card_bg }}
                        >
                          <ImageIcon
                            className="size-10 mb-2 opacity-50"
                            style={{ color: theme.accent }}
                          />
                          <span
                            className="text-xs font-mono"
                            style={{ color: theme.text_secondary }}
                          >
                            16:9 Thematic Visual
                          </span>
                        </div>
                      )
                    })()}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                      <span className="text-[10px] font-mono text-white/80 line-clamp-1">
                        {slide.visual_prompt || slide.title}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Footer info bar */}
      <div
        className="relative z-10 px-8 py-3 border-t flex items-center justify-between text-xs"
        style={{
          borderColor: 'rgba(255,255,255,0.06)',
          backgroundColor: 'rgba(0,0,0,0.15)',
        }}
      >
        <span
          className="font-mono text-[11px]"
          style={{ color: theme.text_secondary }}
        >
          VidCraft Autonomous Presentation Studio
        </span>
        <div className="flex items-center gap-3">
          {slide.duration_s && (
            <span
              className="text-[11px] font-mono"
              style={{ color: theme.text_secondary }}
            >
              ⏱ {slide.duration_s}s duration
            </span>
          )}
          <span
            className="font-mono text-[11px]"
            style={{ color: theme.accent }}
          >
            16:9 Widescreen
          </span>
        </div>
      </div>
    </div>
  )
}
