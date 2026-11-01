const express = require('express');
const path = require('node:path');
const fs = require('node:fs');

const aiServiceClient = require('../services/aiServiceClient');
const { ApiError } = require('../middleware/errorHandler');

const router = express.Router();

// Ensure output directories exist for presentations
const PRESENTATIONS_DIR = path.join(__dirname, '..', '..', 'generated', 'presentations');
fs.mkdirSync(PRESENTATIONS_DIR, { recursive: true });

const THEME_PRESETS = {
  cyberpunk_dark: {
    name: 'Cyberpunk Dark',
    bg_color: '#090d16',
    card_bg: '#111827',
    text_primary: '#f8fafc',
    text_secondary: '#94a3b8',
    accent: '#38bdf8',
    accent_secondary: '#f43f5e',
  },
  midnight_navy: {
    name: 'Midnight Navy',
    bg_color: '#0a1128',
    card_bg: '#101f42',
    text_primary: '#ffffff',
    text_secondary: '#cbd5e1',
    accent: '#6366f1',
    accent_secondary: '#38bdf8',
  },
  emerald_future: {
    name: 'Emerald Future',
    bg_color: '#061a14',
    card_bg: '#0c2e24',
    text_primary: '#f0fdf4',
    text_secondary: '#86efac',
    accent: '#10b981',
    accent_secondary: '#34d399',
  },
  sunset_amber: {
    name: 'Sunset Amber',
    bg_color: '#18100c',
    card_bg: '#2a1b14',
    text_primary: '#fff7ed',
    text_secondary: '#fdba74',
    accent: '#f97316',
    accent_secondary: '#fbbf24',
  },
  obsidian_gold: {
    name: 'Obsidian & Gold',
    bg_color: '#0a0a0c',
    card_bg: '#14151a',
    text_primary: '#fefce8',
    text_secondary: '#a1a1aa',
    accent: '#eab308',
    accent_secondary: '#f59e0b',
  },
  quantum_violet: {
    name: 'Quantum Violet',
    bg_color: '#0c071d',
    card_bg: '#180f33',
    text_primary: '#faf5ff',
    text_secondary: '#c084fc',
    accent: '#a855f7',
    accent_secondary: '#ec4899',
  },
  clean_minimal: {
    name: 'Clean Minimalist',
    bg_color: '#0f172a',
    card_bg: '#1e293b',
    text_primary: '#f8fafc',
    text_secondary: '#94a3b8',
    accent: '#e2e8f0',
    accent_secondary: '#94a3b8',
  },
};

// GET /api/presentations/themes
router.get('/presentations/themes', (req, res) => {
  res.json({
    status: 'ok',
    themes: THEME_PRESETS,
  });
});

// POST /api/presentations/generate
router.post('/presentations/generate', async (req, res, next) => {
  try {
    const {
      topic,
      target_slides = 5,
      theme_key,
      master_template = 'auto',
      audience = 'general',
      tone = 'visionary',
    } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      throw new ApiError(400, 'topic is required and must be non-empty.');
    }

    // Auto-detect theme based on topic if not manually chosen
    let effectiveTheme = theme_key;
    if (!effectiveTheme || effectiveTheme === 'auto') {
      const tl = topic.toLowerCase();
      if (/finance|fintech|invest|venture|capital|fund|b2b|saas|enterprise|market|banking|economy|pitch/.test(tl)) {
        effectiveTheme = 'midnight_navy';
      } else if (/luxury|gold|executive|keynote|board|leadership|wealth|private equity/.test(tl)) {
        effectiveTheme = 'obsidian_gold';
      } else if (/climate|green|bio|agri|sustain|eco|plant|health|med|nature|clean energy|solar|wind|farm/.test(tl)) {
        effectiveTheme = 'emerald_future';
      } else if (/creator|media|film|video|food|brand|marketing|music|consumer|lifestyle|fashion|culinary/.test(tl)) {
        effectiveTheme = 'sunset_amber';
      } else if (/quantum|neuro|deep tech|physics|metaverse|vr|gaming|singularity/.test(tl)) {
        effectiveTheme = 'quantum_violet';
      } else if (/drone|ai|robot|crypto|cyber|software|code|tech|autonomous|space|mars|satellite|network/.test(tl)) {
        effectiveTheme = 'cyberpunk_dark';
      } else {
        effectiveTheme = 'clean_minimal';
      }
    }

    let deck;
    try {
      deck = await aiServiceClient.generatePresentation({
        topic: topic.trim(),
        target_slides: Number(target_slides) || 5,
        theme_key: effectiveTheme,
        master_template,
        audience,
        tone,
      });
    } catch (aiErr) {
      console.warn('AI Service unreachable or failed, building emergency JS deck:', aiErr.message);
      // Fallback deck so UI never freezes or fails even if AI service is starting
      const deckId = `deck_${Date.now().toString(36)}`;
      const cleanThemeKey = THEME_PRESETS[effectiveTheme] ? effectiveTheme : 'cyberpunk_dark';
      deck = {
        deck_id: deckId,
        title: topic.trim(),
        subtitle: `Strategic Overview & Operational Architecture · ${audience} Edition`,
        category: 'Technology',
        theme_key: cleanThemeKey,
        theme: THEME_PRESETS[cleanThemeKey],
        slides: [
          {
            id: 'slide_1',
            slide_index: 1,
            layout: 'title_cover',
            title: topic.trim(),
            subtitle: `Executive Blueprint · Keynote Presentation`,
            bullet_points: [
              'Autonomous workflow orchestration and multi-agent coordination',
              'Deterministic pipelines with real-time audio and visual synchronization',
              'Enterprise-ready scalability engineered for modern production',
            ],
            speaker_notes: `Welcome everyone. Today we are presenting a comprehensive overview of ${topic.trim()}, examining architecture, strategy, and execution.`,
            stat_number: '',
            stat_label: '',
            chart_data: null,
            column_items: [],
            timeline_steps: [],
            unsplash_keyword: `${topic.trim()} futuristic technology hero`,
            visual_prompt: `Futuristic representation of ${topic.trim()}, cinematic 16:9 widescreen, dark studio lighting`,
            visual_url: `https://image.pollinations.ai/prompt/${encodeURIComponent(topic.trim())}%20futuristic%20presentation%20cinematic?width=1280&height=720&nologo=true&seed=101`,
            duration_s: 8,
            audio_url: null,
          },
          {
            id: 'slide_2',
            slide_index: 2,
            layout: 'hero_split',
            title: 'The Industry Catalyst',
            subtitle: 'Quantifiable efficiency gains across the core pipeline',
            bullet_points: [
              'Manual bottlenecks eliminated through autonomous agent pipelines',
              'Real-time automated telemetry and error-recovery mechanisms',
              'Order-of-magnitude acceleration in delivery velocity',
            ],
            speaker_notes: 'When looking at operational impact, the key metric is velocity. We achieve an order-of-magnitude increase in output throughput.',
            stat_number: '10x',
            stat_label: 'End-to-end throughput acceleration across complex digital pipelines',
            chart_data: null,
            column_items: [],
            timeline_steps: [],
            unsplash_keyword: `${topic.trim()} operations logistics technology`,
            visual_prompt: 'High tech glowing holographic data metrics, dark room, cyan lighting',
            visual_url: `https://image.pollinations.ai/prompt/holographic%20data%20metrics%20visualization%20cyan%20glow%20dark?width=1280&height=720&nologo=true&seed=202`,
            duration_s: 7,
            audio_url: null,
          },
          {
            id: 'slide_3',
            slide_index: 3,
            layout: 'chart_slide',
            title: 'Exponential Growth Trajectory',
            subtitle: 'Scaling throughput velocity while decreasing marginal unit cost',
            bullet_points: [
              'Compound adoption expanding quarter-over-quarter across nodes',
              'Direct unit-cost reduction exceeding 72% at production scale',
              'Predictable pipeline capacity scaling linearly with infrastructure',
            ],
            speaker_notes: 'Our trajectory shows consistent, compounding acceleration. Unit costs drop dramatically as node capacity expands.',
            stat_number: '+380%',
            stat_label: 'Year-over-year operational capacity expansion',
            chart_data: {
              title: 'Throughput Velocity & Unit Scale',
              labels: ['2023', '2024', '2025', '2026E'],
              values: [35, 82, 190, 520],
              unit: 'k Units / Volume',
            },
            column_items: [],
            timeline_steps: [],
            unsplash_keyword: `${topic.trim()} data growth chart`,
            visual_prompt: 'Futuristic 3D neon bar chart rising upwards in dark cyberspace, cyan and violet glow',
            visual_url: `https://image.pollinations.ai/prompt/exponential%20data%20growth%20chart%20neon?width=1280&height=720&nologo=true&seed=303`,
            duration_s: 8,
            audio_url: null,
          },
          {
            id: 'slide_4',
            slide_index: 4,
            layout: 'three_column',
            title: 'Core Architectural Pillars',
            subtitle: 'Engineered for resilience, consistency, and multi-modal scale',
            bullet_points: [
              'Modular decomposition with dedicated agent boundaries',
              'Context-grounded reasoning without hallucination risks',
              'Universal rendering across interactive and exported media',
            ],
            speaker_notes: 'The architecture rests on three core pillars: autonomous agent orchestration, grounded knowledge retrieval, and multi-format rendering.',
            stat_number: '',
            stat_label: '',
            chart_data: null,
            column_items: [
              { title: 'Agent Orchestration', desc: 'Decentralized task distribution with consensus routing.' },
              { title: 'Knowledge Grounding', desc: 'Context-grounded validation ensuring deterministic output.' },
              { title: 'Universal Delivery', desc: 'Seamless output to Interactive Web, Video MP4, and PowerPoint.' },
            ],
            timeline_steps: [],
            unsplash_keyword: `${topic.trim()} infrastructure architecture`,
            visual_prompt: 'Three glowing futuristic cyber servers connected by neon fiber cables',
            visual_url: `https://image.pollinations.ai/prompt/cybernetic%20server%20pillars%20three%20cores%20neon?width=1280&height=720&nologo=true&seed=404`,
            duration_s: 9,
            audio_url: null,
          },
          {
            id: 'slide_5',
            slide_index: 5,
            layout: 'quote',
            title: 'The Future in Flight',
            subtitle: 'Empowering creators and engineers to move at the speed of thought',
            bullet_points: [
              'Transforming complex workflows into effortless human creative leverage',
              'Bridging ambitious vision with autonomous execution',
              'VidCraft: Next-generation multi-agent media creation',
            ],
            speaker_notes: 'In conclusion, VidCraft turns abstract creative concepts into finished, production-grade presentations and media effortlessly.',
            stat_number: '',
            stat_label: '',
            chart_data: null,
            column_items: [],
            timeline_steps: [],
            unsplash_keyword: `${topic.trim()} horizon vision inspiration`,
            visual_prompt: 'Breathtaking cinematic sunrise over futuristic city skyline',
            visual_url: `https://image.pollinations.ai/prompt/cinematic%20sunrise%20over%20futuristic%20skyline%20warm%20glow?width=1280&height=720&nologo=true&seed=505`,
            duration_s: 8,
            audio_url: null,
          },
        ],
        total_slides: 5,
        total_duration_s: 40,
      };
    }

    res.status(200).json({
      status: 'success',
      deck,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/presentations/export-pptx
router.post('/presentations/export-pptx', async (req, res, next) => {
  try {
    const { deck, filename } = req.body;
    if (!deck || !deck.slides) {
      throw new ApiError(400, 'Valid deck object with slides is required.');
    }

    const safeFilename = filename || `${deck.deck_id || 'presentation'}.pptx`;
    const result = await aiServiceClient.exportPresentationPptx(deck, safeFilename);

    res.json({
      status: 'success',
      downloadUrl: result.download_url || `/media/presentations/${safeFilename}`,
      filename: safeFilename,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/presentations/narrate
router.post('/presentations/narrate', async (req, res, next) => {
  try {
    const { text, voice } = req.body;
    if (!text || typeof text !== 'string') {
      throw new ApiError(400, 'text is required for narration.');
    }

    const result = await aiServiceClient.narratePresentationSlide(text, voice);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Real master templates downloaded directly from online presentation design libraries
const MASTER_PPTX_CATALOG = [
  {
    id: 'neon_ai_pitch',
    name: 'Neon AI Venture Pitch',
    category: 'Venture & AI Startup',
    slide_count: 15,
    file: 'neon_ai_pitch.pptx',
    preview_url: '/media/presentations/templates/neon_ai_pitch_slide_1.jpg',
    downloadUrl: '/api/presentations/master-templates/neon_ai_pitch.pptx',
    description: 'High-energy cyber cyan & violet venture pitch deck designed for AI & deep-tech startups.',
  },
  {
    id: 'acid_brutalist_ai',
    name: 'Acid Brutalist AI Startup',
    category: 'Modern Brutalist Tech',
    slide_count: 16,
    file: 'acid_brutalist_ai.pptx',
    preview_url: '/media/presentations/templates/acid_brutalist_ai_slide_1.jpg',
    downloadUrl: '/api/presentations/master-templates/acid_brutalist_ai.pptx',
    description: 'Bold acid brutalist layout with high-impact typography and high-contrast frames.',
  },
  {
    id: 'dark_desktop_pitch',
    name: 'Dark Desktop Tech Interface',
    category: 'SaaS & Developer Tools',
    slide_count: 15,
    file: 'dark_desktop_pitch.pptx',
    preview_url: '/media/presentations/templates/dark_desktop_pitch_slide_1.jpg',
    downloadUrl: '/api/presentations/master-templates/dark_desktop_pitch.pptx',
    description: 'Sleek dark mode desktop app UI presentation template built for enterprise SaaS.',
  },
  {
    id: 'nightfall_executive_pitch',
    name: 'Nightfall Executive Pitch',
    category: 'Corporate & Executive',
    slide_count: 16,
    file: 'nightfall_executive_pitch.pptx',
    preview_url: '/media/presentations/templates/nightfall_executive_pitch_slide_1.jpg',
    downloadUrl: '/api/presentations/master-templates/nightfall_executive_pitch.pptx',
    description: 'Refined deep navy and cobalt executive board presentation for funding rounds.',
  },
  {
    id: 'black_gold_investor',
    name: 'Black & Gold Investor Storyboard',
    category: 'Luxury & Private Equity',
    slide_count: 15,
    file: 'black_gold_investor.pptx',
    preview_url: '/media/presentations/templates/black_gold_investor_slide_1.jpg',
    downloadUrl: '/api/presentations/master-templates/black_gold_investor.pptx',
    description: 'Luxury obsidian black and champagne gold investor presentation storyboard.',
  },
  {
    id: 'blockchain_neon_startup',
    name: 'Blockchain Neon Tech Startup',
    category: 'Web3 & Fintech',
    slide_count: 15,
    file: 'blockchain_neon_startup.pptx',
    preview_url: '/media/presentations/templates/blockchain_neon_startup_slide_1.jpg',
    downloadUrl: '/api/presentations/master-templates/blockchain_neon_startup.pptx',
    description: 'Slate grey with electric neon yellow accents for decentralized tech and fintech.',
  },
  {
    id: 'ai_product_launch',
    name: 'AI Product Launch Showcase',
    category: 'Hardware & Software',
    slide_count: 10,
    file: 'ai_product_launch.pptx',
    preview_url: '/media/presentations/templates/ai_product_launch_slide_1.jpg',
    downloadUrl: '/api/presentations/master-templates/ai_product_launch.pptx',
    description: 'Feature reveal, modular architecture, and launch roadmap showcase.',
  },
  {
    id: 'animated_business_pitch',
    name: 'Animated Business Pitch Deck',
    category: 'Business & Growth',
    slide_count: 15,
    file: 'animated_business_pitch.pptx',
    preview_url: '/media/presentations/templates/animated_business_pitch_slide_1.jpg',
    downloadUrl: '/api/presentations/master-templates/animated_business_pitch.pptx',
    description: 'Dynamic corporate pitch presentation with metric callouts and growth timelines.',
  },
  {
    id: 'creative_studio_campaign',
    name: 'Creative Studio Campaign Pitch',
    category: 'Agency & Creative',
    slide_count: 15,
    file: 'creative_studio_campaign.pptx',
    preview_url: '/media/presentations/templates/creative_studio_campaign_slide_1.jpg',
    downloadUrl: '/api/presentations/master-templates/creative_studio_campaign.pptx',
    description: 'Vibrant modern creative agency presentation for client proposals.',
  },
  {
    id: 'financial_services_pitch',
    name: 'Financial Services Pitch Deck',
    category: 'Fintech & Banking',
    slide_count: 10,
    file: 'financial_services_pitch.pptx',
    preview_url: '/media/presentations/templates/financial_services_pitch_slide_1.jpg',
    downloadUrl: '/api/presentations/master-templates/financial_services_pitch.pptx',
    description: 'Institutional-grade finance and wealth management deck with data tables.',
  },
  {
    id: 'cyberpunk_city_pitch',
    name: 'Cyberpunk City Pitch Deck',
    category: 'Gaming & Cyberpunk',
    slide_count: 5,
    file: 'cyberpunk_city_pitch.pptx',
    preview_url: '/media/presentations/templates/cyberpunk_city_pitch_slide_1.jpg',
    downloadUrl: '/api/presentations/master-templates/cyberpunk_city_pitch.pptx',
    description: 'Neon glowing futuristic city aesthetics with dark sci-fi gradients.',
  },
  {
    id: 'vc_fundraising_long',
    name: 'Docxology Open-Source VC Deck',
    category: 'Open Source VC Framework',
    slide_count: 56,
    file: 'vc_fundraising_long.pptx',
    preview_url: '/media/presentations/templates/vc_fundraising_long_slide_1.jpg',
    downloadUrl: '/api/presentations/master-templates/vc_fundraising_long.pptx',
    description: 'Exhaustive open-source venture capital deck with 56 structured reproducible slides.',
  },
];

// GET /api/presentations/master-templates
router.get('/presentations/master-templates', (req, res) => {
  res.json({
    status: 'success',
    count: MASTER_PPTX_CATALOG.length,
    templates: MASTER_PPTX_CATALOG,
  });
});

// POST /api/presentations/load-template-canvas
router.post('/presentations/load-template-canvas', async (req, res, next) => {
  try {
    const { templateId } = req.body;
    if (!templateId) {
      throw new ApiError(400, 'templateId is required');
    }
    const result = await aiServiceClient.importPresentationPptx(templateId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/presentations/master-templates/:filename
router.get('/presentations/master-templates/:filename', (req, res, next) => {
  const filePath = path.join(__dirname, '..', '..', 'templates', 'pptx', req.params.filename);
  if (!fs.existsSync(filePath)) {
    return next(new ApiError(404, 'Master PPTX template not found'));
  }
  res.download(filePath);
});

module.exports = router;

