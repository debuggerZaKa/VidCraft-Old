/**
 * Master Template System for VidCraft Presentation Studio
 * Provides industry-standard master templates (Sequoia Pitch, Keynote Reveal, SaaS QBR, Product Launch)
 * and dynamically injects content, images, and charts into native Polotno elements.
 */

import {
  createCoverSlidePage,
  createStatSlidePage,
  createThreeColumnSlidePage,
  createSplitVisualSlidePage,
  createTimelineSlidePage,
  createChartSlidePage,
  createQuoteSlidePage,
  resolveReliableSlideImage,
  type PolotnoPage,
} from './polotnoTemplates'
import type { PresentationDeck } from '@/lib/types'

export interface MasterTemplateMeta {
  id: string
  name: string
  tagline: string
  badge: string
  recommendedTheme: string
  pptxFile?: string
  slideSequence: Array<{
    type: 'title_cover' | 'hero_split' | 'stat_callout' | 'three_column' | 'chart_slide' | 'timeline' | 'quote'
    label: string
  }>
}

export const MASTER_TEMPLATES: Record<string, MasterTemplateMeta> = {
  neon_ai_pitch: {
    id: 'neon_ai_pitch',
    name: 'Neon AI Venture Pitch (Real PPTX)',
    tagline: '15-slide high-energy cyber cyan & violet venture pitch deck from online library',
    badge: '⚡ NEON AI PITCH',
    recommendedTheme: 'cyberpunk_dark',
    pptxFile: 'neon_ai_pitch.pptx',
    slideSequence: [
      { type: 'title_cover', label: 'AI Venture Purpose' },
      { type: 'hero_split', label: 'The Problem' },
      { type: 'three_column', label: 'Proprietary Solution' },
      { type: 'chart_slide', label: 'Market Traction' },
      { type: 'quote', label: 'The Round & Vision' },
    ],
  },
  acid_brutalist_ai: {
    id: 'acid_brutalist_ai',
    name: 'Acid Brutalist AI Startup (Real PPTX)',
    tagline: '16-slide bold acid brutalist layout with high-impact typography from online library',
    badge: '☣️ ACID BRUTALIST',
    recommendedTheme: 'cyberpunk_dark',
    pptxFile: 'acid_brutalist_ai.pptx',
    slideSequence: [
      { type: 'title_cover', label: 'Manifesto' },
      { type: 'hero_split', label: 'Friction Points' },
      { type: 'three_column', label: 'Core Primitives' },
      { type: 'chart_slide', label: 'Hypergrowth' },
      { type: 'quote', label: 'Next Era' },
    ],
  },
  dark_desktop_pitch: {
    id: 'dark_desktop_pitch',
    name: 'Dark Desktop Tech Interface (Real PPTX)',
    tagline: '15-slide dark mode desktop app UI presentation template from online library',
    badge: '💻 DARK DESKTOP',
    recommendedTheme: 'midnight_navy',
    pptxFile: 'dark_desktop_pitch.pptx',
    slideSequence: [
      { type: 'title_cover', label: 'Platform Overview' },
      { type: 'hero_split', label: 'Developer Bottlenecks' },
      { type: 'three_column', label: 'Unified Architecture' },
      { type: 'chart_slide', label: 'Ecosystem Scale' },
      { type: 'quote', label: 'Call to Action' },
    ],
  },
  black_gold_investor: {
    id: 'black_gold_investor',
    name: 'Black & Gold Investor Storyboard (Real PPTX)',
    tagline: '15-slide luxury obsidian black and champagne gold investor presentation',
    badge: '👑 BLACK & GOLD',
    recommendedTheme: 'obsidian_gold',
    pptxFile: 'black_gold_investor.pptx',
    slideSequence: [
      { type: 'title_cover', label: 'Executive Portfolio' },
      { type: 'stat_callout', label: 'Capital Efficiency' },
      { type: 'three_column', label: 'Asset Strategy' },
      { type: 'chart_slide', label: 'IRR & Revenue Multiple' },
      { type: 'quote', label: 'Fund Allocation' },
    ],
  },
  blockchain_neon_startup: {
    id: 'blockchain_neon_startup',
    name: 'Blockchain Neon Tech Startup (Real PPTX)',
    tagline: '15-slide slate grey with electric neon yellow accents from online library',
    badge: '🔗 BLOCKCHAIN NEON',
    recommendedTheme: 'cyberpunk_dark',
    pptxFile: 'blockchain_neon_startup.pptx',
    slideSequence: [
      { type: 'title_cover', label: 'Decentralized Vision' },
      { type: 'hero_split', label: 'Consensus Barrier' },
      { type: 'three_column', label: 'Protocol Pillars' },
      { type: 'chart_slide', label: 'TVL & Token Volume' },
      { type: 'quote', label: 'Network Launch' },
    ],
  },
  nightfall_executive_pitch: {
    id: 'nightfall_executive_pitch',
    name: 'Nightfall Executive Pitch (Real PPTX)',
    tagline: '16-slide deep navy and cobalt executive board presentation from online library',
    badge: '🌌 NIGHTFALL PITCH',
    recommendedTheme: 'midnight_navy',
    pptxFile: 'nightfall_executive_pitch.pptx',
    slideSequence: [
      { type: 'title_cover', label: 'Executive Summary' },
      { type: 'stat_callout', label: 'Disruption Vector' },
      { type: 'chart_slide', label: 'Enterprise Retention' },
      { type: 'three_column', label: 'Strategic Pillars' },
      { type: 'quote', label: 'Board Mandate' },
    ],
  },
  ai_product_launch: {
    id: 'ai_product_launch',
    name: 'AI Product Launch Showcase (Real PPTX)',
    tagline: '10-slide feature reveal, modular architecture, and launch roadmap showcase',
    badge: '🚀 AI LAUNCH SHOWCASE',
    recommendedTheme: 'emerald_future',
    pptxFile: 'ai_product_launch.pptx',
    slideSequence: [
      { type: 'title_cover', label: 'Product Unveiling' },
      { type: 'hero_split', label: 'Architecture & Engine' },
      { type: 'three_column', label: 'Capability Bento' },
      { type: 'timeline', label: 'Rollout Schedule' },
      { type: 'quote', label: 'Market Standard' },
    ],
  },
  animated_business_pitch: {
    id: 'animated_business_pitch',
    name: 'Animated Business Pitch Deck (Real PPTX)',
    tagline: '15-slide corporate pitch presentation with metric callouts and growth timelines',
    badge: '📈 ANIMATED BUSINESS',
    recommendedTheme: 'sunset_amber',
    pptxFile: 'animated_business_pitch.pptx',
    slideSequence: [
      { type: 'title_cover', label: 'Business Overview' },
      { type: 'stat_callout', label: 'Core KPI Traction' },
      { type: 'chart_slide', label: 'Growth Horizon' },
      { type: 'three_column', label: 'Value Drivers' },
      { type: 'quote', label: 'Investment Thesis' },
    ],
  },
  creative_studio_campaign: {
    id: 'creative_studio_campaign',
    name: 'Creative Studio Campaign (Real PPTX)',
    tagline: '15-slide vibrant modern creative agency presentation for client proposals',
    badge: '🎨 CREATIVE STUDIO',
    recommendedTheme: 'quantum_violet',
    pptxFile: 'creative_studio_campaign.pptx',
    slideSequence: [
      { type: 'title_cover', label: 'Campaign Narrative' },
      { type: 'hero_split', label: 'Creative Direction' },
      { type: 'three_column', label: 'Core Channels' },
      { type: 'chart_slide', label: 'Audience Reach' },
      { type: 'quote', label: 'Deliverables & Next Steps' },
    ],
  },
  financial_services_pitch: {
    id: 'financial_services_pitch',
    name: 'Financial Services Pitch (Real PPTX)',
    tagline: '10-slide institutional finance and wealth management deck with data tables',
    badge: '🏦 FINANCIAL SERVICES',
    recommendedTheme: 'midnight_navy',
    pptxFile: 'financial_services_pitch.pptx',
    slideSequence: [
      { type: 'title_cover', label: 'Fund / Advisory Overview' },
      { type: 'stat_callout', label: 'AUM & Sharpe Ratio' },
      { type: 'chart_slide', label: 'Asset Performance' },
      { type: 'three_column', label: 'Risk Mitigation' },
      { type: 'quote', label: 'Mandate Terms' },
    ],
  },
  cyberpunk_city_pitch: {
    id: 'cyberpunk_city_pitch',
    name: 'Cyberpunk City Pitch (Real PPTX)',
    tagline: '5-slide neon glowing futuristic city aesthetics with dark sci-fi gradients',
    badge: '🌆 CYBERPUNK CITY',
    recommendedTheme: 'cyberpunk_dark',
    pptxFile: 'cyberpunk_city_pitch.pptx',
    slideSequence: [
      { type: 'title_cover', label: 'Neo-City Vision' },
      { type: 'hero_split', label: 'Dystopian Bottleneck' },
      { type: 'three_column', label: 'Synthetic Solution' },
      { type: 'chart_slide', label: 'Adoption Density' },
      { type: 'quote', label: 'The Takeover' },
    ],
  },
  sustainable_finance_pitch: {
    id: 'sustainable_finance_pitch',
    name: 'Sustainable Finance Pitch (Real PPTX)',
    tagline: '16-slide green finance and ESG venture presentation from online library',
    badge: '🌱 SUSTAINABLE FINANCE',
    recommendedTheme: 'emerald_future',
    pptxFile: 'sustainable_finance_pitch.pptx',
    slideSequence: [
      { type: 'title_cover', label: 'Climate Capital' },
      { type: 'stat_callout', label: 'Carbon Offset KPI' },
      { type: 'three_column', label: 'Portfolio Assets' },
      { type: 'chart_slide', label: 'Yield & Impact' },
      { type: 'quote', label: 'Green Transition' },
    ],
  },
  vc_fundraising_long: {
    id: 'vc_fundraising_long',
    name: 'Docxology Open-Source VC Pitch (Real PPTX)',
    tagline: '56-slide reproducible open-source venture capital fundraising deck from GitHub',
    badge: '📚 DOCXOLOGY VC DECK',
    recommendedTheme: 'midnight_navy',
    pptxFile: 'vc_fundraising_long.pptx',
    slideSequence: [
      { type: 'title_cover', label: 'Fundraising Pitch' },
      { type: 'hero_split', label: 'The Problem' },
      { type: 'three_column', label: 'Landscape' },
      { type: 'chart_slide', label: 'Evidence & Metrics' },
      { type: 'quote', label: 'The Syndicate' },
    ],
  },
  sequoia_pitch: {
    id: 'sequoia_pitch',
    name: 'Sequoia & YC Venture Pitch',
    tagline: 'Standard 5-beat framework for startup funding, pitch decks & venture scale',
    badge: '🚀 VENTURE PITCH',
    recommendedTheme: 'midnight_navy',
    slideSequence: [
      { type: 'title_cover', label: 'Company Purpose' },
      { type: 'hero_split', label: 'The Problem & Market Pain' },
      { type: 'three_column', label: 'Proprietary Solution & Tech' },
      { type: 'chart_slide', label: 'Market Traction & Growth' },
      { type: 'quote', label: 'Vision & The Ask' },
    ],
  },
  keynote_reveal: {
    id: 'keynote_reveal',
    name: 'Keynote High-Impact Tech Reveal',
    tagline: 'Bold, cinematic architecture reveal with glowing elements & benchmark stats',
    badge: '🍏 TECH KEYNOTE',
    recommendedTheme: 'cyberpunk_dark',
    slideSequence: [
      { type: 'title_cover', label: 'The Big Reveal' },
      { type: 'stat_callout', label: '10x Performance Multiplier' },
      { type: 'chart_slide', label: 'Adoption Trajectory' },
      { type: 'three_column', label: 'Modular Core Pillars' },
      { type: 'quote', label: 'The Future in Flight' },
    ],
  },
  saas_qbr: {
    id: 'saas_qbr',
    name: 'SaaS Executive Review & Analytics',
    tagline: 'Quarterly business reviews, board decks, growth charts & operational KPIs',
    badge: '📊 EXECUTIVE QBR',
    recommendedTheme: 'obsidian_gold',
    slideSequence: [
      { type: 'title_cover', label: 'Executive Overview' },
      { type: 'stat_callout', label: 'Key Performance Indicators' },
      { type: 'chart_slide', label: 'Quarterly Revenue & Adoption' },
      { type: 'three_column', label: 'Strategic Pillars' },
      { type: 'quote', label: 'Strategic Initiatives & Outlook' },
    ],
  },
  product_launch: {
    id: 'product_launch',
    name: 'Product Launch & Showcase',
    tagline: 'Customer-facing product launch, feature bento grids & roadmap rollout',
    badge: '✨ PRODUCT LAUNCH',
    recommendedTheme: 'sunset_amber',
    slideSequence: [
      { type: 'title_cover', label: 'Unveiling Innovation' },
      { type: 'hero_split', label: 'Customer Experience Disrupted' },
      { type: 'three_column', label: 'Signature Capabilities' },
      { type: 'timeline', label: 'Phased Rollout Roadmap' },
      { type: 'quote', label: 'The New Standard' },
    ],
  },
}

/**
 * Compiles a PresentationDeck into Polotno JSON pages using the selected Master Template framework.
 */
export function compileDeckWithMasterTemplate(
  deck: PresentationDeck,
  templateId: string = 'sequoia_pitch',
): { width: number; height: number; pages: PolotnoPage[] } {
  const meta = MASTER_TEMPLATES[templateId] || MASTER_TEMPLATES.sequoia_pitch

  const theme = {
    bg_color: deck.theme?.bg_color || '#090d16',
    card_bg: deck.theme?.card_bg || '#111827',
    accent: deck.theme?.accent || '#38bdf8',
    text_primary: deck.theme?.text_primary || '#f8fafc',
    text_secondary: deck.theme?.text_secondary || '#94a3b8',
  }

  const pages: PolotnoPage[] = deck.slides.map((slide, idx) => {
    const pageId = `page_${idx + 1}`
    const slideKeyword = slide.unsplash_keyword || `${deck.title} ${slide.title}`
    const templateImg = meta.pptxFile
      ? `http://localhost:5000/media/presentations/templates/${meta.id}_slide_${(idx % 10) + 1}.jpg`
      : null
    const imgUrl = templateImg || resolveReliableSlideImage(slideKeyword, idx + 1, slide.visual_url)

    // Determine layout: check template sequence if within count, else fallback to slide.layout
    const expectedLayout = meta.slideSequence[idx]?.type || slide.layout || 'hero_split'

    switch (expectedLayout) {
      case 'title_cover':
        return createCoverSlidePage(pageId, slide.title || deck.title, slide.subtitle || '', theme, imgUrl)

      case 'stat_callout':
        return createStatSlidePage(
          pageId,
          slide.title,
          slide.subtitle || '',
          slide.stat_number || '10x',
          slide.stat_label || 'Acceleration in operational velocity verified',
          slide.bullet_points,
          theme,
        )

      case 'three_column':
        return createThreeColumnSlidePage(
          pageId,
          slide.title,
          slide.subtitle || '',
          slide.column_items && slide.column_items.length > 0
            ? slide.column_items
            : [
                { title: 'Pillar 01', desc: 'Autonomous agent decomposition and deterministic routing' },
                { title: 'Pillar 02', desc: 'Context-grounded reasoning without hallucination risks' },
                { title: 'Pillar 03', desc: 'Multi-modal synchronization across web, video, and PPTX' },
              ],
          theme,
        )

      case 'timeline':
        return createTimelineSlidePage(
          pageId,
          slide.title,
          slide.subtitle || '',
          slide.timeline_steps && slide.timeline_steps.length > 0
            ? slide.timeline_steps
            : [
                { step: 'Phase 01', label: 'Architecture & Ingestion' },
                { step: 'Phase 02', label: 'Agent Synthesis & RAG' },
                { step: 'Phase 03', label: 'Universal Scale & Rollout' },
              ],
          theme,
        )

      case 'chart_slide':
        return createChartSlidePage(
          pageId,
          slide.title,
          slide.subtitle || '',
          slide.chart_data || {
            title: 'Market Adoption & Velocity Trajectory',
            labels: ['2023', '2024', '2025', '2026E'],
            values: [35, 82, 190, 520],
            unit: 'k Units / Volume',
          },
          slide.bullet_points,
          theme,
        )

      case 'quote':
        return createQuoteSlidePage(
          pageId,
          slide.title,
          slide.subtitle || '',
          slide.bullet_points,
          theme,
        )

      case 'hero_split':
      default:
        return createSplitVisualSlidePage(
          pageId,
          slide.title,
          slide.subtitle || '',
          slide.bullet_points,
          imgUrl,
          theme,
        )
    }
  })

  return {
    width: 1280,
    height: 720,
    pages,
  }
}
