import { Aperture, FlaskConical, Sparkles, Scissors, Presentation, Subtitles, ImageIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { Theme } from '@/hooks/useTheme'

export type AppMode = 'image' | 'prompt' | 'reels' | 'presentation' | 'captions'

export function AppHeader({
  theme,
  onToggleTheme,
  demoMode,
  activeMode = 'prompt',
  onSelectMode,
}: {
  theme: Theme
  onToggleTheme: () => void
  demoMode: boolean
  activeMode?: AppMode
  onSelectMode?: (mode: AppMode) => void
}) {
  return (
    <header className="border-border/70 bg-background/80 sticky top-0 z-30 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <div className="border-border bg-card text-primary grid size-9 shrink-0 place-items-center rounded-[5px] border">
            <Aperture className="size-[18px]" strokeWidth={1.75} />
          </div>
          <div className="leading-none">
            <div className="font-display text-[19px] leading-none font-semibold tracking-tight">
              VidCraft
            </div>
            <div className="grade-fill mt-1 h-px w-full opacity-70" />
            <div className="slate-label mt-1.5 hidden sm:block">Prompt → storyboard → film</div>
          </div>
        </div>

        {/* Central Studio Switcher Tabs */}
        {onSelectMode && (
          <div className="flex items-center p-1 rounded-lg bg-muted/80 border border-border/80 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => onSelectMode('image')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                activeMode === 'image'
                  ? 'bg-background text-foreground shadow-sm font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ImageIcon className="size-3.5 text-primary" />
              <span>Image Studio</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 rounded-full font-bold border border-purple-500/30">
                FLUX.1
              </span>
            </button>
            <button
              onClick={() => onSelectMode('prompt')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                activeMode === 'prompt'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="size-3.5" />
              <span>Prompt Studio</span>
            </button>
            <button
              onClick={() => onSelectMode('reels')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                activeMode === 'reels'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Scissors className="size-3.5" />
              <span>Reels Studio</span>
              <span className="text-[10px] px-1 py-0.2 bg-primary/20 text-primary rounded-full font-bold">
                NEW
              </span>
            </button>
            <button
              onClick={() => onSelectMode('presentation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                activeMode === 'presentation'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Presentation className="size-3.5" />
              <span>Deck Studio</span>
              <span className="text-[10px] px-1 py-0.2 bg-sky-500/20 text-sky-400 rounded-full font-bold">
                AI
              </span>
            </button>
            <button
              onClick={() => onSelectMode('captions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                activeMode === 'captions'
                  ? 'bg-background text-foreground shadow-sm font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Subtitles className="size-3.5 text-amber-400" />
              <span>Auto Captions</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-gradient-to-r from-amber-500/20 to-cyan-500/20 text-amber-400 rounded-full font-bold border border-amber-500/30">
                اردو + EN
              </span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {demoMode && (
            <Badge variant="warning" className="hidden sm:inline-flex">
              <FlaskConical className="size-3" />
              Demo
            </Badge>
          )}
          <Badge variant="outline" className="hidden md:inline-flex">
            4 agents
          </Badge>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  )
}

