import React, { useMemo } from 'react'
import type { CaptionSettings, CaptionWord } from '@/lib/types'
import { CAPTION_EFFECTS } from './captionPresets'

interface CaptionOverlayProps {
  currentTime: number
  words: CaptionWord[]
  settings: CaptionSettings
  isUrdu?: boolean
  aspectRatio?: '9:16' | '16:9' | '1:1'
  scaleFactor?: number
}

// Convert hex to rgba with opacity
function hexToRgba(hex: string, alpha: number) {
  let c = hex.replace('#', '')
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('')
  }
  const num = parseInt(c, 16)
  if (isNaN(num)) return `rgba(0,0,0,${alpha})`
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({
  currentTime,
  words,
  settings,
  isUrdu = false,
  aspectRatio: _aspectRatio = '9:16',
  scaleFactor = 1,
}) => {
  // Find current active word index
  const activeWordIndex = useMemo(() => {
    return words.findIndex(w => currentTime >= w.start && currentTime <= w.end)
  }, [currentTime, words])

  // Determine current display batch
  const currentBatch = useMemo(() => {
    if (!words.length) return []

    // If a word is currently active
    if (activeWordIndex !== -1) {
      const batchSize = Math.max(1, settings.wordsPerBatch || 2)
      const batchStart = Math.floor(activeWordIndex / batchSize) * batchSize
      return words.slice(batchStart, batchStart + batchSize)
    }

    // Otherwise find closest recent or upcoming word
    const lastPassedIndex = words.findLastIndex(w => w.end <= currentTime)
    if (lastPassedIndex !== -1 && lastPassedIndex < words.length) {
      // Keep showing for 0.4s grace period
      if (currentTime - words[lastPassedIndex].end < 0.45) {
        const batchSize = Math.max(1, settings.wordsPerBatch || 2)
        const batchStart = Math.floor(lastPassedIndex / batchSize) * batchSize
        return words.slice(batchStart, batchStart + batchSize)
      }
    }

    return []
  }, [activeWordIndex, currentTime, words, settings.wordsPerBatch])

  if (!currentBatch.length) {
    return null
  }

  // Calculate position X & Y
  const posX = settings.boxX ?? 50
  let posY = settings.boxY ?? settings.positionY ?? 80
  if (settings.position === 'top') posY = 18
  if (settings.position === 'middle') posY = 50
  if (settings.position === 'bottom') posY = 82

  // Box width constraint
  const boxWidthPercent = Math.min(100, Math.max(20, settings.boxWidth ?? 85))

  // Text Shadow CSS string
  const shadowRgba = hexToRgba(settings.shadowColor || '#000000', settings.shadowOpacity ?? 0.8)
  const shadowCss = `${settings.shadowOffsetX}px ${settings.shadowOffsetY}px ${settings.shadowBlur}px ${shadowRgba}`

  // Stroke CSS
  const strokeWidthScaled = Math.max(0, Math.round((settings.strokeWidth || 4) * scaleFactor))
  const strokeCss = strokeWidthScaled > 0 ? `${strokeWidthScaled}px ${settings.strokeColor || '#000000'}` : 'none'

  // Font size scaled
  const fontSizeScaled = Math.max(16, Math.round((settings.fontSize || 48) * scaleFactor))

  // Box background
  const boxBg = settings.boxEnabled
    ? hexToRgba(settings.boxColor || '#000000', settings.boxOpacity ?? 0.6)
    : 'transparent'

  // Determine RTL/LTR
  const isRtl = settings.direction === 'rtl' || (settings.direction === 'auto' && isUrdu)

  // Current Effect class
  const effectObj = CAPTION_EFFECTS.find(e => e.id === settings.effect)
  const effectCssClass = effectObj ? effectObj.cssClass : 'caption-fx-pop-bounce'

  // Cropping clip-path
  const cropClipPath = settings.boxCropEnabled
    ? `inset(${settings.boxCropTop || 0}% ${settings.boxCropRight || 0}% ${settings.boxCropBottom || 0}% ${settings.boxCropLeft || 0}%)`
    : undefined

  // Border Style & Neon Glow
  const isNeonBorder = settings.boxBorderStyle === 'neon'
  const borderCss = settings.boxBorderWidth > 0 && settings.boxBorderStyle !== 'none'
    ? `${settings.boxBorderWidth}px ${isNeonBorder ? 'solid' : settings.boxBorderStyle} ${settings.boxBorderColor || '#00F0FF'}`
    : undefined

  const neonBoxShadow = isNeonBorder && settings.boxBorderWidth > 0
    ? `0 0 15px ${settings.boxBorderColor || '#00F0FF'}, inset 0 0 8px ${settings.boxBorderColor || '#00F0FF'}`
    : undefined

  return (
    <div
      className="absolute pointer-events-none select-none z-20 flex justify-center"
      style={{
        left: `${posX}%`,
        top: `${posY}%`,
        width: `${boxWidthPercent}%`,
        transform: `translate(-50%, -50%) rotate(${settings.boxRotation || 0}deg)`,
        clipPath: cropClipPath,
      }}
    >
      <div
        className="w-full inline-flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 transition-all duration-100"
        dir={isRtl ? 'rtl' : 'ltr'}
        style={{
          backgroundColor: boxBg,
          padding: settings.boxEnabled ? `${settings.boxPaddingY}px ${settings.boxPaddingX}px` : '4px 8px',
          borderRadius: settings.boxEnabled ? `${settings.boxBorderRadius}px` : undefined,
          border: borderCss,
          boxShadow: neonBoxShadow,
          minHeight: settings.boxHeight ? `${settings.boxHeight}px` : undefined,
          textAlign: settings.textAlign || 'center',
          overflow: settings.boxCropEnabled ? 'hidden' : 'visible',
        }}
      >
        {currentBatch.map((wordObj) => {
          const isActive = currentTime >= wordObj.start && currentTime <= wordObj.end
          const isPast = currentTime > wordObj.end

          return (
            <span
              key={wordObj.id || `${wordObj.word}-${wordObj.start}`}
              className={`inline-block transition-transform duration-100 ${
                isActive ? effectCssClass : isPast ? 'opacity-90' : 'opacity-70'
              }`}
              style={{
                fontFamily: settings.fontFamily,
                fontSize: `${fontSizeScaled}px`,
                fontWeight: settings.fontWeight || 800,
                letterSpacing: `${settings.letterSpacing || 0}px`,
                lineHeight: settings.lineHeight || 1.25,
                textTransform: settings.textTransform !== 'none' ? settings.textTransform : undefined,
                color: isActive ? settings.activeTextColor : settings.inactiveTextColor,
                WebkitTextStroke: strokeCss,
                textShadow: shadowCss,
                paintOrder: 'stroke fill',
                transformOrigin: 'center center',
              }}
            >
              {wordObj.word}
            </span>
          )
        })}
      </div>
    </div>
  )
}
