import type { PresentationDeck } from '@/lib/types'

export const SAMPLE_DECKS: Record<string, PresentationDeck> = {
  vidcraft: {
    deck_id: 'deck_vidcraft_demo',
    title: 'VidCraft: Multi-Agent Video & Media Engine',
    subtitle: 'Next-Generation Autonomous Production Pipeline · UET Lahore FYP',
    category: 'Technology',
    theme_key: 'cyberpunk_dark',
    theme: {
      name: 'Cyberpunk Dark',
      bg_color: '#090d16',
      card_bg: '#111827',
      text_primary: '#f8fafc',
      text_secondary: '#94a3b8',
      accent: '#38bdf8',
      accent_secondary: '#f43f5e',
      font_heading: 'Barlow Condensed, sans-serif',
      font_body: 'Inter, sans-serif',
    },
    slides: [
      {
        id: 'slide_1',
        slide_index: 1,
        layout: 'title_cover',
        title: 'VidCraft: Autonomous Multi-Agent Video Engine',
        subtitle: 'From a Single Prompt to a Complete Cinematographic Film',
        bullet_points: [
          'Retrieval-Augmented Cinematography grounded in industry knowledge',
          'Autonomous Agent Swarm: Screenwriter, Cinematographer, Critic & Narrator',
          'Multi-Format Rendering: Remotion Video, Social Reels, and Dynamic Slides',
        ],
        speaker_notes:
          'Welcome everyone. Today we are presenting VidCraft, a breakthrough multi-agent pipeline designed to automate end-to-end cinematographic film and presentation production from prompt to final render.',
        stat_number: '',
        stat_label: '',
        column_items: [],
        timeline_steps: [],
        visual_prompt:
          'Futuristic holographic camera lens projecting high tech film frames in a dark neon studio, 16:9 cinematic',
        visual_url:
          'https://image.pollinations.ai/prompt/futuristic%20holographic%20camera%20lens%20projecting%20film%20frames%20in%20dark%20studio%20cyan%20blue%20neon?width=1280&height=720&nologo=true&seed=101',
        duration_s: 8,
        audio_url: null,
      },
      {
        id: 'slide_2',
        slide_index: 2,
        layout: 'stat_callout',
        title: 'The Production Velocity Paradigm',
        subtitle: 'Replacing traditional fragmented software suites with agentic synthesis',
        bullet_points: [
          'Traditional storyboarding and video assembly takes 8–24 hours per scene',
          'VidCraft agents execute script analysis, shot composition, and audio sync in minutes',
          'Zero manual keyframing required for synchronized beat narration',
        ],
        speaker_notes:
          'Traditional creative workflows require days of coordination across writers, animators, and editors. With VidCraft, we achieve a ten-fold increase in output velocity with higher narrative coherence.',
        stat_number: '10x',
        stat_label:
          'Production velocity acceleration achieved across multi-stage creative workflows',
        column_items: [],
        timeline_steps: [],
        visual_prompt:
          'Holographic glowing speed metrics, high tech digital acceleration dashboard dark space',
        visual_url:
          'https://image.pollinations.ai/prompt/holographic%20speed%20metrics%20dashboard%20dark%20space%20cyan%20glow?width=1280&height=720&nologo=true&seed=202',
        duration_s: 7,
        audio_url: null,
      },
      {
        id: 'slide_3',
        slide_index: 3,
        layout: 'three_column',
        title: 'Three Autonomous Agent Pillars',
        subtitle: 'Specialized cognitive agents operating with shared state',
        bullet_points: [
          'Screenwriter agent establishes world state and breaks narratives into shot beats',
          'Cinematographer queries RAG corpus for camera angles, lighting, and lens taxonomy',
          'Narrator & Critic measure acoustic timing and enforce visual fidelity guardrails',
        ],
        speaker_notes:
          'VidCraft avoids monolithic prompts by delegating tasks to three specialized agents: the Screenwriter for narrative framing, the Cinematographer for RAG grounding, and the Critic for quality control.',
        stat_number: '',
        stat_label: '',
        column_items: [
          {
            title: '1. Screenwriter Agent',
            desc: 'Decomposes complex prompts into discrete narrative beats with persistent world state.',
          },
          {
            title: '2. RAG Cinematographer',
            desc: 'Retrieves authentic camera framings, lighting styles, and continuity rules.',
          },
          {
            title: '3. Multi-Modal Synthesizer',
            desc: 'Drives Remotion React rendering, Edge-TTS audio sync, and PPTX export.',
          },
        ],
        timeline_steps: [],
        visual_prompt:
          'Three glowing futuristic server pillars connected with neon data streams, dark background',
        visual_url:
          'https://image.pollinations.ai/prompt/three%20glowing%20futuristic%20servers%20connected%20with%20neon%20data%20streams?width=1280&height=720&nologo=true&seed=303',
        duration_s: 9,
        audio_url: null,
      },
      {
        id: 'slide_4',
        slide_index: 4,
        layout: 'timeline',
        title: 'End-to-End Pipeline Roadmap',
        subtitle: 'From user intent to multi-channel distribution',
        bullet_points: [
          'Phase 01: Prompt analysis, score evaluation, and interactive clarification',
          'Phase 02: Storyboard graph generation, shot continuity, and voiceover alignment',
          'Phase 03: Distributed rendering to 1080p MP4, interactive slide decks, and PPTX',
        ],
        speaker_notes:
          'Our architecture follows a clean 3-phase execution model: intent clarification first, followed by multi-agent composition, and concluding with multi-format rendering.',
        stat_number: '',
        stat_label: '',
        column_items: [],
        timeline_steps: [
          { step: 'Phase 01', label: 'Clarification & RAG Retrieval' },
          { step: 'Phase 02', label: 'Agent Composition & TTS Sync' },
          { step: 'Phase 03', label: 'Remotion / PPTX / Web Render' },
        ],
        visual_prompt:
          'Luminous futuristic roadmap waypoints glowing along dark horizon, modern perspective',
        visual_url:
          'https://image.pollinations.ai/prompt/futuristic%20glowing%20roadmap%20horizon%20waypoints%20neon?width=1280&height=720&nologo=true&seed=404',
        duration_s: 8,
        audio_url: null,
      },
      {
        id: 'slide_5',
        slide_index: 5,
        layout: 'hero_split',
        title: 'The Future of Autonomous Media',
        subtitle: 'Unlocking infinite creative bandwidth for researchers and creators',
        bullet_points: [
          'Empowers non-technical storytellers to author high-fidelity media effortlessly',
          'Seamless integration with modern social platforms and presentation ecosystems',
          'Built on modern open standards: React 19, FastAPI, LangGraph, and Remotion',
        ],
        speaker_notes:
          'VidCraft redefines what is possible when intelligent agents collaborate with human creators. Thank you, and we welcome your questions.',
        stat_number: '',
        stat_label: '',
        column_items: [],
        timeline_steps: [],
        visual_prompt:
          'Cinematic sunrise over futuristic modern metropolis, inspirational volumetric warm light, 8k',
        visual_url:
          'https://image.pollinations.ai/prompt/cinematic%20sunrise%20over%20futuristic%20city%20skyline%20warm%20golden%20glow?width=1280&height=720&nologo=true&seed=505',
        duration_s: 8,
        audio_url: null,
      },
    ],
    total_slides: 5,
    total_duration_s: 40,
  },
  mars: {
    deck_id: 'deck_mars_colony',
    title: 'Ares Habitat: Mars Colonization 2035',
    subtitle: 'Sustainable Autonomous In-Situ Architecture & Life Support',
    category: 'Science',
    theme_key: 'sunset_amber',
    theme: {
      name: 'Sunset Amber',
      bg_color: '#18100c',
      card_bg: '#2a1b14',
      text_primary: '#fff7ed',
      text_secondary: '#fdba74',
      accent: '#f97316',
      accent_secondary: '#fbbf24',
      font_heading: 'Barlow Condensed, sans-serif',
      font_body: 'Inter, sans-serif',
    },
    slides: [
      {
        id: 'mars_1',
        slide_index: 1,
        layout: 'title_cover',
        title: 'Ares Habitat: Permanent Mars Base 2035',
        subtitle: 'Pioneering In-Situ Resource Utilization and Autonomous Life Support',
        bullet_points: [
          'Subterranean lava tube architecture providing natural radiation shielding',
          'Closed-loop water recycling and atmospheric CO2 methane conversion',
          'Autonomous rover maintenance fleets operating 24/7 on the Martian surface',
        ],
        speaker_notes:
          'Welcome to the Ares Habitat technical briefing. Today we outline our engineering blueprint for human civilization on the surface of Mars by 2035.',
        stat_number: '',
        stat_label: '',
        column_items: [],
        timeline_steps: [],
        visual_prompt:
          'Ares habitat base on Mars with astronauts and rovers under crimson Martian dusk sky, cinematic',
        visual_url:
          'https://image.pollinations.ai/prompt/mars%20base%20habitat%20under%20crimson%20dusk%20sky%20astronauts%20rovers%20cinematic?width=1280&height=720&nologo=true&seed=601',
        duration_s: 8,
        audio_url: null,
      },
      {
        id: 'mars_2',
        slide_index: 2,
        layout: 'stat_callout',
        title: 'Critical In-Situ Efficiency',
        subtitle: 'Minimizing Earth-to-Mars mass payload dependency',
        bullet_points: [
          'Water ice extracted from glacial permafrost deposits at 45 degrees north latitude',
          'Sabatier reactors synthesizing rocket propellant directly on Mars',
          'Solar-nuclear microgrids providing continuous unflagging kilowatt power',
        ],
        speaker_notes:
          'Shipping every kilogram from Earth is financially impossible. By harvesting ninety-five percent of life support materials in-situ, Mars colonization becomes economically viable.',
        stat_number: '95%',
        stat_label:
          'Of life support oxygen and water generated in-situ from Martian regolith and atmosphere',
        column_items: [],
        timeline_steps: [],
        visual_prompt:
          'Futuristic industrial oxygen extraction plant glowing on Mars red desert landscape, cinematic',
        visual_url:
          'https://image.pollinations.ai/prompt/futuristic%20oxygen%20plant%20on%20mars%20desert%20landscape%20warm%20glow?width=1280&height=720&nologo=true&seed=602',
        duration_s: 7,
        audio_url: null,
      },
      {
        id: 'mars_3',
        slide_index: 3,
        layout: 'three_column',
        title: 'Three Habitat Engineering Pillars',
        subtitle: 'Redundant life-critical subsystems engineered for deep space survival',
        bullet_points: [
          'Radiation mitigation via sintered regolith vaults and electromagnetic deflector loops',
          'Hydroponic and aeroponic vertical farming chambers yielding nutritious harvests',
          'Pressurized rover networks linking scientific mining hubs across Valles Marineris',
        ],
        speaker_notes:
          'Survival on Mars depends on three indispensable pillars: radiation shielding, self-sustaining agriculture, and redundant surface transport.',
        stat_number: '',
        stat_label: '',
        column_items: [
          {
            title: '1. Shielded Biodomes',
            desc: 'Regolith-reinforced domes protecting against cosmic rays and micrometeorites.',
          },
          {
            title: '2. Closed-Loop Biosphere',
            desc: '99% water recovery with automated hydroponic crop cultivation.',
          },
          {
            title: '3. Surface Mobility',
            desc: 'Long-range electric rovers with 500km operational mission radius.',
          },
        ],
        timeline_steps: [],
        visual_prompt:
          'Interior of a lush green futuristic hydroponic biodome on Mars looking out at red desert',
        visual_url:
          'https://image.pollinations.ai/prompt/interior%20lush%20green%20hydroponic%20biodome%20mars%20looking%20out%20at%20red%20desert?width=1280&height=720&nologo=true&seed=603',
        duration_s: 9,
        audio_url: null,
      },
    ],
    total_slides: 3,
    total_duration_s: 24,
  },
}
