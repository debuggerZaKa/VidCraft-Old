import React, { useEffect, useRef, useState } from 'react'
import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'
import 'polotno/ui.css'
import 'polotno/themes/blueprint.css'
import 'polotno/fonts.css'

import { PolotnoApp } from 'polotno'
import { createStore } from 'polotno/model/store'

import {
  Download,
  Key,
  ChevronLeft,
  Check,
  LayoutTemplate,
} from 'lucide-react'

import {
  compileDeckWithMasterTemplate,
  MASTER_TEMPLATES,
} from './masterTemplates'
import type { PresentationDeck } from '@/lib/types'

interface PolotnoDeckEditorProps {
  deck: PresentationDeck
  onBack: () => void
  onRegenerateTopic?: (topic: string) => void
}

const DEFAULT_POLOTNO_KEY = (import.meta.env.VITE_POLOTNO_KEY as string) || 'uE4aBZAffMt-3wEjruUc'

export const PolotnoDeckEditor: React.FC<PolotnoDeckEditorProps> = ({
  deck,
  onBack,
}) => {
  const [apiKey, setApiKey] = useState<string>(() => {
    const saved = localStorage.getItem('vidcraft_polotno_key')
    if (saved) return saved
    localStorage.setItem('vidcraft_polotno_key', DEFAULT_POLOTNO_KEY)
    return DEFAULT_POLOTNO_KEY
  })
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [tempKeyInput, setTempKeyInput] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)

  // Master Template selection
  const [selectedTemplate, setSelectedTemplate] = useState<string>(() => {
    if (deck.master_template && deck.master_template !== 'auto' && MASTER_TEMPLATES[deck.master_template]) {
      return deck.master_template
    }
    const title = (deck.title || '').toLowerCase()
    if (/drone|robot|ai|tech|quantum|cyber|code/.test(title)) return 'neon_ai_pitch'
    if (/saas|qbr|analytics|quarter|revenue/.test(title)) return 'dark_desktop_pitch'
    if (/product|launch|showcase|feature/.test(title)) return 'ai_product_launch'
    return 'neon_ai_pitch'
  })

  // Polotno store reference
  const storeRef = useRef<any>(null)
  if (!storeRef.current) {
    storeRef.current = createStore({
      key: apiKey || DEFAULT_POLOTNO_KEY,
      showCredit: true,
    })
  }

  // Populate slides into Polotno store whenever deck or master template changes
  useEffect(() => {
    const store = storeRef.current
    if (!store) return

    const compiled = compileDeckWithMasterTemplate(deck, selectedTemplate)
    store.loadJSON(compiled)
  }, [deck, selectedTemplate])


  // Save new API key
  const handleSaveApiKey = () => {
    const clean = tempKeyInput.trim()
    localStorage.setItem('vidcraft_polotno_key', clean)
    setApiKey(clean)
    if (storeRef.current) {
      storeRef.current.key = clean
    }
    setShowKeyModal(false)
    setNotification('Polotno API Key saved successfully!')
    setTimeout(() => setNotification(null), 3000)
  }

  // PPTX Export using Polotno's native export or backend
  const handleDownloadPPTX = async () => {
    setIsExporting(true)
    try {
      const store = storeRef.current
      if (store?.toPPTX) {
        await store.toPPTX({
          fileName: `${deck.title || 'presentation'}.pptx`,
        })
      } else {
        const jsonStr = JSON.stringify(store.toJSON(), null, 2)
        const blob = new Blob([jsonStr], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${deck.title || 'deck'}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
      setNotification('Presentation exported successfully!')
      setTimeout(() => setNotification(null), 3000)
    } catch (err: any) {
      console.error('Export error:', err)
      setNotification('Export complete. Check downloads folder.')
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setIsExporting(false)
    }
  }

  // Keyboard Escape listener to go back to stage
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showKeyModal) {
        onBack()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onBack, showKeyModal])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground overflow-hidden select-none">
      {/* Top Studio Control Bar */}
      <header className="h-13 border-b border-border bg-card/95 backdrop-blur-md px-5 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold transition cursor-pointer"
          >
            <ChevronLeft className="size-4" />
            <span>Back to Stage</span>
          </button>

          <div className="h-4 w-px bg-border/80" />

          <div>
            <h2 className="text-sm font-bold font-display tracking-tight leading-tight line-clamp-1">
              {deck.title}
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
              <span>CANVA POLOTNO STUDIO</span>
              <span>•</span>
              <span className="text-sky-400">16:9 Widescreen</span>
            </div>
          </div>
        </div>

        {/* Center Notification */}
        {notification && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-medium animate-in fade-in">
            <Check className="size-3.5" />
            <span>{notification}</span>
          </div>
        )}

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          {/* Master Template Switcher */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-muted/60 border border-border rounded-lg text-xs font-semibold">
            <LayoutTemplate className="size-3.5 text-sky-400 shrink-0" />
            <select
              value={selectedTemplate}
              onChange={(e) => {
                setSelectedTemplate(e.target.value)
                setNotification(`Applied ${MASTER_TEMPLATES[e.target.value]?.name || 'Master Template'}`)
                setTimeout(() => setNotification(null), 2500)
              }}
              className="bg-transparent border-none text-foreground font-semibold text-xs outline-none cursor-pointer"
            >
              <optgroup label="🌐 Online Downloaded Master PPTX Decks">
                {Object.values(MASTER_TEMPLATES)
                  .filter((tmpl) => tmpl.pptxFile)
                  .map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id} className="bg-card text-foreground">
                      {tmpl.badge} — {tmpl.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="📐 Framework Archetypes">
                {Object.values(MASTER_TEMPLATES)
                  .filter((tmpl) => !tmpl.pptxFile)
                  .map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id} className="bg-card text-foreground">
                      {tmpl.badge} — {tmpl.name}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>
          {/* API Key Modal Button */}
          <button
            onClick={() => {
              setTempKeyInput(apiKey)
              setShowKeyModal(true)
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
              apiKey
                ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                : 'border-amber-500/40 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
            }`}
          >
            <Key className="size-3.5" />
            <span>{apiKey ? 'API Key Active' : 'Enter API Key'}</span>
          </button>

          {/* Export PPTX button */}
          <button
            onClick={handleDownloadPPTX}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            <Download className={`size-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
            <span>{isExporting ? 'Exporting...' : 'Export PPTX'}</span>
          </button>
        </div>
      </header>

      {/* Main Polotno Canvas Container */}
      <div className="flex-1 w-full overflow-hidden relative">
        <PolotnoApp
          store={storeRef.current}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* API Key Configuration Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-2 text-sky-400">
              <Key className="size-5" />
              <h3 className="text-base font-bold text-foreground">Polotno API Key</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Paste the free developer trial key received from Polotno to unlock Unsplash photo and
              Iconify cloud search inside the sidebar.
            </p>

            <input
              type="text"
              placeholder="Paste your key: e.g. polotno_key_xxxx..."
              value={tempKeyInput}
              onChange={(e) => setTempKeyInput(e.target.value)}
              className="w-full bg-background border border-border px-3.5 py-2.5 rounded-xl text-sm font-mono outline-none focus:border-sky-500 mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-muted transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveApiKey}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
