"""Presentation Generator Agent (AI-PRESENTATION).

Decomposes a topic or prompt into a professional, cohesive multi-slide presentation
deck with structured layouts, speaker notes, thematic visual prompts, and timings.
"""

import logging
import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from llm import complete_json

logger = logging.getLogger(__name__)

THEME_PRESETS = {
    "cyberpunk_dark": {
        "name": "Cyberpunk Dark",
        "bg_color": "#090d16",
        "card_bg": "#111827",
        "text_primary": "#f8fafc",
        "text_secondary": "#94a3b8",
        "accent": "#38bdf8",
        "accent_secondary": "#f43f5e",
        "font_heading": "Barlow Condensed, sans-serif",
        "font_body": "Inter, sans-serif",
    },
    "midnight_navy": {
        "name": "Midnight Navy",
        "bg_color": "#0a1128",
        "card_bg": "#101f42",
        "text_primary": "#ffffff",
        "text_secondary": "#cbd5e1",
        "accent": "#6366f1",
        "accent_secondary": "#38bdf8",
        "font_heading": "Outfit, sans-serif",
        "font_body": "Inter, sans-serif",
    },
    "emerald_future": {
        "name": "Emerald Future",
        "bg_color": "#061a14",
        "card_bg": "#0c2e24",
        "text_primary": "#f0fdf4",
        "text_secondary": "#86efac",
        "accent": "#10b981",
        "accent_secondary": "#34d399",
        "font_heading": "Outfit, sans-serif",
        "font_body": "Inter, sans-serif",
    },
    "sunset_amber": {
        "name": "Sunset Amber",
        "bg_color": "#18100c",
        "card_bg": "#2a1b14",
        "text_primary": "#fff7ed",
        "text_secondary": "#fdba74",
        "accent": "#f97316",
        "accent_secondary": "#fbbf24",
        "font_heading": "Barlow Condensed, sans-serif",
        "font_body": "Inter, sans-serif",
    },
    "obsidian_gold": {
        "name": "Obsidian & Gold",
        "bg_color": "#0a0a0c",
        "card_bg": "#14151a",
        "text_primary": "#fefce8",
        "text_secondary": "#a1a1aa",
        "accent": "#eab308",
        "accent_secondary": "#f59e0b",
        "font_heading": "Outfit, sans-serif",
        "font_body": "Inter, sans-serif",
    },
    "quantum_violet": {
        "name": "Quantum Violet",
        "bg_color": "#0c071d",
        "card_bg": "#180f33",
        "text_primary": "#faf5ff",
        "text_secondary": "#c084fc",
        "accent": "#a855f7",
        "accent_secondary": "#ec4899",
        "font_heading": "Barlow Condensed, sans-serif",
        "font_body": "Inter, sans-serif",
    },
    "clean_minimal": {
        "name": "Clean Minimalist",
        "bg_color": "#0f172a",
        "card_bg": "#1e293b",
        "text_primary": "#f8fafc",
        "text_secondary": "#94a3b8",
        "accent": "#e2e8f0",
        "accent_secondary": "#94a3b8",
        "font_heading": "Inter, sans-serif",
        "font_body": "Inter, sans-serif",
    },
}

PRESENTATION_SYSTEM_PROMPT = """You are an elite Presentation Director and Executive Storyteller.
Given a topic, audience type, tone, and desired slide count, generate a world-class,
highly structured presentation deck.

Return ONLY JSON matching this exact structure:
{
  "title": "Deck Title",
  "subtitle": "Clear, compelling subtitle summarizing value proposition",
  "category": "Technology | Business | Education | Creative",
  "theme_key": "cyberpunk_dark | midnight_navy | obsidian_gold | emerald_future | sunset_amber | quantum_violet | clean_minimal",
  "slides": [
    {
      "slide_index": 1,
      "layout": "title_cover | hero_split | three_column | stat_callout | chart_slide | timeline | quote",
      "title": "Slide Headline",
      "subtitle": "Short orienting subtext",
      "bullet_points": ["Point 1 (punchy, action-oriented)", "Point 2", "Point 3"],
      "speaker_notes": "Conversational, high-impact narration script for this slide (2-3 natural sentences).",
      "stat_number": "Optional metric like '85%' or '$4.2B' (required if layout is stat_callout)",
      "stat_label": "Context for the metric",
      "chart_data": {
        "title": "Metric Progression / Trajectory",
        "labels": ["2023", "2024", "2025", "2026E"],
        "values": [30, 85, 210, 540],
        "unit": "k Deliveries / $M / %"
      },
      "column_items": [
        {"title": "Pillar 1", "desc": "Brief explanation"},
        {"title": "Pillar 2", "desc": "Brief explanation"},
        {"title": "Pillar 3", "desc": "Brief explanation"}
      ],
      "timeline_steps": [
        {"step": "Phase 01", "label": "Milestone title"},
        {"step": "Phase 02", "label": "Milestone title"},
        {"step": "Phase 03", "label": "Milestone title"}
      ],
      "unsplash_keyword": "Precise photography query matching this slide (e.g. 'drone delivering parcel in sky', 'automated fulfillment robotics')",
      "visual_prompt": "Cinematic visual description for 16:9 illustration, photorealistic, 8k, modern lighting",
      "duration_s": 8
    }
  ]
}

Layout guidelines:
- Slide 1 MUST be "title_cover".
- Slide 2 should be "hero_split" or "stat_callout" introducing the problem or core concept.
- Slide 3 should be "chart_slide" or "three_column" showing data-driven growth or core architecture.
- Slide 4 should be "three_column" or "timeline" showing structural depth or roadmap milestones.
- The final slide MUST be a compelling conclusion or "quote".
- Keep bullet points concise (max 8-12 words per bullet). No walls of text!
- Ensure unsplash_keyword describes a real-world, high-resolution photo scene.
"""


def _detect_theme_for_topic(topic: str) -> str:
    """Intelligently detects the most visually stunning theme palette based on subject matter."""
    tl = (topic or "").lower()
    if any(k in tl for k in ["finance", "fintech", "invest", "venture", "capital", "fund", "b2b", "saas", "enterprise", "market", "banking", "economy", "pitch"]):
        return "midnight_navy"
    if any(k in tl for k in ["luxury", "gold", "executive", "keynote", "board", "leadership", "private equity", "wealth"]):
        return "obsidian_gold"
    if any(k in tl for k in ["climate", "green", "bio", "agri", "sustain", "eco", "plant", "health", "med", "nature", "clean energy", "solar", "wind"]):
        return "emerald_future"
    if any(k in tl for k in ["creator", "media", "film", "video", "food", "brand", "marketing", "music", "consumer", "lifestyle", "fashion", "culinary"]):
        return "sunset_amber"
    if any(k in tl for k in ["quantum", "neuro", "deep tech", "physics", "metaverse", "vr", "gaming", "futuristic", "singularity"]):
        return "quantum_violet"
    if any(k in tl for k in ["drone", "robot", "ai", "crypto", "cyber", "software", "code", "tech", "autonomous", "space", "mars", "satellite", "network"]):
        return "cyberpunk_dark"
    return "clean_minimal"


def _generate_fallback_deck(
    topic: str,
    target_slides: int = 5,
    theme_key: str = "cyberpunk_dark",
    audience: str = "general",
) -> Dict[str, Any]:
    """Generates a high-quality presentation structure if LLM is offline or unavailable."""
    detected_theme = _detect_theme_for_topic(topic)
    theme_key = theme_key if theme_key in THEME_PRESETS and theme_key != "cyberpunk_dark" else detected_theme
    clean_topic = topic.strip() or "Advanced Multi-Agent Systems"

    slides = [
        {
            "slide_index": 1,
            "layout": "title_cover",
            "title": clean_topic,
            "subtitle": f"Strategic Blueprint & Operational Architecture · {audience.title()} Edition",
            "bullet_points": [
                "Autonomous decision pipelines and workflow automation",
                "Retrieval-augmented reasoning with context preservation",
                "Production-grade scalability and real-time execution",
            ],
            "speaker_notes": f"Welcome everyone. Today we are presenting a comprehensive overview of {clean_topic}, focusing on architecture, strategic implementation, and measurable outcomes.",
            "stat_number": "",
            "stat_label": "",
            "chart_data": None,
            "column_items": [],
            "timeline_steps": [],
            "unsplash_keyword": f"{clean_topic} futuristic technology concept",
            "visual_prompt": f"Futuristic high-tech visual representation of {clean_topic}, 16:9 widescreen, volumetric lighting, dark studio aesthetic",
            "duration_s": 8,
        },
        {
            "slide_index": 2,
            "layout": "hero_split",
            "title": "The Industry Catalyst",
            "subtitle": "Quantifiable disruption and operational efficiency multipliers",
            "bullet_points": [
                "Legacy manual processes introduce critical latency and error cascades",
                "Automated intelligence streamlines execution cycles from hours into seconds",
                "Continuous telemetry loops ensure predictable, auditable enterprise outcomes",
            ],
            "speaker_notes": "To understand why this shift matters, look at the benchmark numbers. We are observing order-of-magnitude improvements in execution velocity.",
            "stat_number": "10x",
            "stat_label": "Throughput acceleration achieved across multi-stage automated pipelines",
            "chart_data": None,
            "column_items": [],
            "timeline_steps": [],
            "unsplash_keyword": f"{clean_topic} automated system operations",
            "visual_prompt": "Glowing data visualization, futuristic holographic metrics in dark space, volumetric blue and cyan glow",
            "duration_s": 7,
        },
        {
            "slide_index": 3,
            "layout": "chart_slide",
            "title": "Exponential Growth Trajectory",
            "subtitle": "Scaling output velocity while decreasing marginal unit cost",
            "bullet_points": [
                "Compound adoption expanding quarter-over-quarter across nodes",
                "Direct unit-cost reduction exceeding 72% at production scale",
                "Predictable pipeline capacity scaling linearly with infrastructure",
            ],
            "speaker_notes": "Our trajectory shows consistent, compounding acceleration. As node density increases, cost per transaction decreases significantly.",
            "stat_number": "+380%",
            "stat_label": "Year-over-year operational capacity expansion",
            "chart_data": {
                "title": "Throughput Velocity & Unit Scale",
                "labels": ["2023", "2024", "2025", "2026E"],
                "values": [35, 82, 190, 520],
                "unit": "k Deliveries / $M",
            },
            "column_items": [],
            "timeline_steps": [],
            "unsplash_keyword": f"{clean_topic} data growth trajectory",
            "visual_prompt": "Futuristic 3D neon bar chart rising upwards in dark cyberspace, cyan and violet glow",
            "duration_s": 8,
        },
        {
            "slide_index": 4,
            "layout": "three_column",
            "title": "Core Architectural Pillars",
            "subtitle": "Modular subsystems engineered for deterministic reliability",
            "bullet_points": [
                "Independent agent nodes with discrete, verifiable responsibilities",
                "Shared state bus with low-latency event synchronization",
                "Self-healing fallback handlers preventing single points of failure",
            ],
            "speaker_notes": "The foundation rests on three distinct pillars: autonomous reasoning agents, unified memory state, and robust validation critics.",
            "stat_number": "",
            "stat_label": "",
            "chart_data": None,
            "column_items": [
                {"title": "Agent Orchestration", "desc": "Decentralized task distribution with consensus routing."},
                {"title": "Contextual Retrieval", "desc": "Domain-grounded knowledge grounding via vector similarity."},
                {"title": "Dynamic Synthesis", "desc": "Multi-modal rendering for video, voice, and graphics."},
            ],
            "timeline_steps": [],
            "unsplash_keyword": f"{clean_topic} system architecture network",
            "visual_prompt": "Three glowing futuristic core reactors connected by luminous fiber lines, server room dark background",
            "duration_s": 9,
        },
        {
            "slide_index": 5,
            "layout": "timeline",
            "title": "Roadmap & Phased Rollout",
            "subtitle": "From foundational validation to enterprise production",
            "bullet_points": [
                "Iterative milestone gates ensuring structural alignment",
                "Automated test coverage across synthesis and rendering",
                "Continuous feedback integration for ongoing optimization",
            ],
            "speaker_notes": "Our roadmap follows a structured, milestone-driven execution plan designed to de-risk development while delivering rapid value.",
            "stat_number": "",
            "stat_label": "",
            "column_items": [],
            "timeline_steps": [
                {"step": "Phase 01", "label": "Model Grounding & Ingestion"},
                {"step": "Phase 02", "label": "Pipeline Synthesis & Critic"},
                {"step": "Phase 03", "label": "Global Multi-Modal Deployment"},
            ],
            "visual_prompt": "Luminous roadmap timeline across dark glass horizon, neon waypoints, cinematic perspective",
            "duration_s": 8,
        },
        {
            "slide_index": 5,
            "layout": "quote",
            "title": "Vision & Final Takeaway",
            "subtitle": "Transforming complex workflows into effortless human creative leverage",
            "bullet_points": [
                "Empowering creators and engineers to move at the speed of thought",
                "Democratizing high-end production through multi-agent intelligence",
                "VidCraft: The unified engine for next-generation digital media",
            ],
            "speaker_notes": "As we conclude, remember that the goal is not to replace human ingenuity, but to amplify it so anyone can bring complex visions to life.",
            "stat_number": "",
            "stat_label": "",
            "column_items": [],
            "timeline_steps": [],
            "visual_prompt": "Inspiring sunrise over a futuristic skyline, glowing dawn horizon, cinematic wide shot 8k",
            "duration_s": 8,
        },
    ]

    # Adjust slides to match target_slides
    if target_slides < len(slides):
        slides = slides[:target_slides]
    elif target_slides > len(slides):
        extra_count = target_slides - len(slides)
        for i in range(extra_count):
            idx = len(slides) + 1
            slides.append({
                "slide_index": idx,
                "layout": "hero_split",
                "title": f"Strategic Initiative {idx - 4}",
                "subtitle": f"Expanding capabilities across {clean_topic}",
                "bullet_points": [
                    "Precision fine-tuning tailored to enterprise requirements",
                    "Security hardening with comprehensive compliance guardrails",
                    "Cross-platform distribution across web, mobile, and broadcast",
                ],
                "speaker_notes": f"In milestone {idx - 4}, we expand key capabilities to maximize versatility and performance.",
                "stat_number": "",
                "stat_label": "",
                "column_items": [],
                "timeline_steps": [],
                "visual_prompt": f"Advanced technology graphic, abstract futuristic network diagram, dark background",
                "duration_s": 7,
            })

    return {
        "title": clean_topic,
        "subtitle": f"Strategic Vision & Architecture · {audience.title()} Deck",
        "category": "Technology",
        "theme_key": theme_key,
        "slides": slides,
    }


def generate_presentation_deck(
    topic: str,
    target_slides: int = 5,
    theme_key: str = "cyberpunk_dark",
    master_template: str = "auto",
    audience: str = "general",
    tone: str = "visionary",
) -> Dict[str, Any]:
    """Generates a complete structured presentation deck using LLM with deterministic fallback."""
    if not theme_key or theme_key == "auto":
        theme_key = _detect_theme_for_topic(topic)

    user_prompt = (
        f"Topic: {topic}\n"
        f"Target Slide Count: {target_slides}\n"
        f"Audience: {audience}\n"
        f"Tone: {tone}\n"
        f"Theme: {theme_key}\n"
        f"Master Template: {master_template}\n"
        f"Ensure every slide has a distinct narrative beat, compelling bullet points, and engaging speaker notes."
    )

    deck_data: Optional[Dict[str, Any]] = None
    try:
        raw_res = complete_json(PRESENTATION_SYSTEM_PROMPT, user_prompt, temperature=0.4)
        if isinstance(raw_res, dict) and "slides" in raw_res and isinstance(raw_res["slides"], list) and len(raw_res["slides"]) > 0:
            deck_data = raw_res
    except Exception as exc:
        logger.warning("LLM presentation generation failed (%s); using fallback deck synthesizer.", exc)

    if not deck_data:
        deck_data = _generate_fallback_deck(topic, target_slides, theme_key, audience)

    deck_id = f"deck_{uuid.uuid4().hex[:8]}"
    selected_theme_key = deck_data.get("theme_key", theme_key)
    if not selected_theme_key or selected_theme_key not in THEME_PRESETS:
        selected_theme_key = theme_key if theme_key in THEME_PRESETS else _detect_theme_for_topic(topic)

    theme_info = THEME_PRESETS[selected_theme_key]

    # Post-process slides to guarantee valid schemas and image URLs
    processed_slides = []
    for idx, slide in enumerate(deck_data.get("slides", []), start=1):
        layout = slide.get("layout", "hero_split")
        if idx == 1:
            layout = "title_cover"

        # Generate a Pollinations visual URL so slides immediately look gorgeous without waiting for external queues
        clean_vprompt = (slide.get("visual_prompt") or f"{deck_data.get('title', 'presentation')} slide visual").replace(" ", "%20")
        sample_image_url = f"https://image.pollinations.ai/prompt/{clean_vprompt}?width=1280&height=720&nologo=true&seed={idx * 42}"

        processed_slides.append({
            "id": f"slide_{idx}",
            "slide_index": idx,
            "layout": layout,
            "title": slide.get("title", f"Slide {idx}"),
            "subtitle": slide.get("subtitle", ""),
            "bullet_points": slide.get("bullet_points", []),
            "speaker_notes": slide.get("speaker_notes", f"This slide presents key findings on {deck_data.get('title')}."),
            "stat_number": slide.get("stat_number", ""),
            "stat_label": slide.get("stat_label", ""),
            "chart_data": slide.get("chart_data"),
            "column_items": slide.get("column_items", []),
            "timeline_steps": slide.get("timeline_steps", []),
            "unsplash_keyword": slide.get("unsplash_keyword", ""),
            "visual_prompt": slide.get("visual_prompt", ""),
            "visual_url": sample_image_url,
            "duration_s": max(4.0, float(slide.get("duration_s", 7.0))),
            "audio_url": None,
        })

    return {
        "deck_id": deck_id,
        "title": deck_data.get("title", topic),
        "subtitle": deck_data.get("subtitle", "Executive Overview"),
        "category": deck_data.get("category", "Technology"),
        "theme_key": selected_theme_key,
        "theme": theme_info,
        "master_template": master_template,
        "slides": processed_slides,
        "total_slides": len(processed_slides),
        "total_duration_s": sum(s["duration_s"] for s in processed_slides),
    }
