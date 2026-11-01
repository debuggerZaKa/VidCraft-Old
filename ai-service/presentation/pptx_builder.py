"""PowerPoint Presentation Builder (PPTX).

Generates standard Microsoft PowerPoint (.pptx) presentations in 16:9 widescreen
with custom themes, layouts, typography, shapes, and speaker notes.
"""

import io
import os
import re
from typing import Any, Dict, List, Optional
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.util import Inches, Pt


def _hex_to_rgb(hex_code: str) -> RGBColor:
    """Converts hex color string (#123456) to pptx RGBColor."""
    hex_code = hex_code.lstrip("#")
    if len(hex_code) == 3:
        hex_code = "".join(c * 2 for c in hex_code)
    try:
        r = int(hex_code[0:2], 16)
        g = int(hex_code[2:4], 16)
        b = int(hex_code[4:6], 16)
        return RGBColor(r, g, b)
    except Exception:
        return RGBColor(240, 240, 240)


def create_pptx_deck(deck: Dict[str, Any], output_path: Optional[str] = None) -> str:
    """Creates a 16:9 widescreen PowerPoint file from a presentation deck dict."""
    master_template = deck.get("master_template")
    template_path = None
    if master_template:
        candidate = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "templates", "pptx", f"{master_template}.pptx")
        )
        if os.path.exists(candidate):
            template_path = candidate

    if template_path:
        prs = Presentation(template_path)
    else:
        prs = Presentation()
        prs.slide_width = Inches(13.333)
        prs.slide_height = Inches(7.5)

    theme = deck.get("theme", {})
    bg_rgb = _hex_to_rgb(theme.get("bg_color", "#090d16"))
    card_rgb = _hex_to_rgb(theme.get("card_bg", "#111827"))
    accent_rgb = _hex_to_rgb(theme.get("accent", "#38bdf8"))
    accent2_rgb = _hex_to_rgb(theme.get("accent_secondary", "#f43f5e"))
    text_primary_rgb = _hex_to_rgb(theme.get("text_primary", "#ffffff"))
    text_secondary_rgb = _hex_to_rgb(theme.get("text_secondary", "#94a3b8"))

    blank_layout = prs.slide_layouts[6] if len(prs.slide_layouts) > 6 else prs.slide_layouts[0]

    # If loading from a template that already has slides, we can populate them; otherwise add slides
    existing_slides = list(prs.slides)
    slides_to_render = deck.get("slides", [])

    for i, slide_data in enumerate(slides_to_render):
        if i < len(existing_slides):
            slide = existing_slides[i]
        else:
            slide = prs.slides.add_slide(blank_layout)
            # Set slide background
            bg_shape = slide.shapes.add_shape(
                1, Inches(0), Inches(0), prs.slide_width, prs.slide_height  # 1 = MSO_SHAPE.RECTANGLE
            )
            bg_shape.fill.solid()
            bg_shape.fill.fore_color.rgb = bg_rgb
            bg_shape.line.color.rgb = bg_rgb
        layout = slide_data.get("layout", "hero_split")
        title_text = slide_data.get("title", "")
        subtitle_text = slide_data.get("subtitle", "")
        bullets = slide_data.get("bullet_points", [])
        speaker_notes = slide_data.get("speaker_notes", "")

        # Set speaker notes
        if speaker_notes:
            notes_slide = slide.notes_slide
            text_frame = notes_slide.notes_text_frame
            text_frame.text = speaker_notes

        # Header branding bar
        accent_bar = slide.shapes.add_shape(
            1, Inches(0.8), Inches(0.6), Inches(0.08), Inches(0.4)
        )
        accent_bar.fill.solid()
        accent_bar.fill.fore_color.rgb = accent_rgb
        accent_bar.line.color.rgb = accent_rgb

        # Brand mark (VidCraft)
        brand_box = slide.shapes.add_textbox(Inches(0.95), Inches(0.6), Inches(4), Inches(0.4))
        brand_tf = brand_box.text_frame
        brand_tf.word_wrap = True
        bp = brand_tf.paragraphs[0]
        bp.text = f"VIDCRAFT AI · {deck.get('title', 'Presentation')}".upper()
        bp.font.size = Pt(9)
        bp.font.bold = True
        bp.font.color.rgb = accent_rgb

        # Render layout-specific content
        if layout == "title_cover":
            _render_title_cover(slide, prs, title_text, subtitle_text, bullets, text_primary_rgb, text_secondary_rgb, accent_rgb, card_rgb)
        elif layout == "stat_callout":
            _render_stat_callout(slide, prs, title_text, subtitle_text, bullets, slide_data, text_primary_rgb, text_secondary_rgb, accent_rgb, card_rgb)
        elif layout == "three_column":
            _render_three_column(slide, prs, title_text, subtitle_text, slide_data, text_primary_rgb, text_secondary_rgb, accent_rgb, card_rgb)
        elif layout == "timeline":
            _render_timeline(slide, prs, title_text, subtitle_text, slide_data, text_primary_rgb, text_secondary_rgb, accent_rgb, card_rgb)
        else:  # hero_split, quote, default
            _render_hero_split(slide, prs, title_text, subtitle_text, bullets, slide_data, text_primary_rgb, text_secondary_rgb, accent_rgb, card_rgb)

    if not output_path:
        os.makedirs("generated/presentations", exist_ok=True)
        deck_id = deck.get("deck_id", "deck")
        output_path = os.path.abspath(os.path.join("generated", "presentations", f"{deck_id}.pptx"))

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    prs.save(output_path)
    return output_path


def _render_title_cover(slide, prs, title, subtitle, bullets, primary_rgb, secondary_rgb, accent_rgb, card_rgb):
    """Renders high-impact Title Cover slide."""
    card = slide.shapes.add_shape(1, Inches(1.5), Inches(1.5), Inches(10.33), Inches(4.5))
    card.fill.solid()
    card.fill.fore_color.rgb = card_rgb
    card.line.color.rgb = accent_rgb
    card.line.width = Pt(1.5)

    # Title
    t_box = slide.shapes.add_textbox(Inches(2.0), Inches(2.0), Inches(9.33), Inches(1.8))
    tf = t_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(40)
    p.font.bold = True
    p.font.color.rgb = primary_rgb

    # Subtitle
    if subtitle:
        p2 = tf.add_paragraph()
        p2.text = subtitle
        p2.font.size = Pt(18)
        p2.font.color.rgb = accent_rgb
        p2.space_before = Pt(12)

    # Bullet preview
    if bullets:
        b_box = slide.shapes.add_textbox(Inches(2.0), Inches(4.2), Inches(9.33), Inches(1.4))
        btf = b_box.text_frame
        btf.word_wrap = True
        for b in bullets[:3]:
            bp = btf.add_paragraph()
            bp.text = f"•  {b}"
            bp.font.size = Pt(14)
            bp.font.color.rgb = secondary_rgb
            bp.space_before = Pt(4)


def _render_hero_split(slide, prs, title, subtitle, bullets, slide_data, primary_rgb, secondary_rgb, accent_rgb, card_rgb):
    """Renders classic Left-Text, Right-Visual split slide."""
    # Title & Subtitle
    t_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.2), Inches(6.0), Inches(1.5))
    tf = t_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(30)
    p.font.bold = True
    p.font.color.rgb = primary_rgb

    if subtitle:
        p2 = tf.add_paragraph()
        p2.text = subtitle
        p2.font.size = Pt(14)
        p2.font.color.rgb = secondary_rgb
        p2.space_before = Pt(6)

    # Bullets
    b_box = slide.shapes.add_textbox(Inches(0.8), Inches(2.9), Inches(5.8), Inches(3.8))
    btf = b_box.text_frame
    btf.word_wrap = True
    for i, b in enumerate(bullets):
        bp = btf.add_paragraph() if i > 0 else btf.paragraphs[0]
        bp.text = f"•   {b}"
        bp.font.size = Pt(16)
        bp.font.color.rgb = secondary_rgb
        bp.space_before = Pt(12)

    # Right Card / Visual representation
    right_card = slide.shapes.add_shape(1, Inches(7.0), Inches(1.4), Inches(5.5), Inches(5.3))
    right_card.fill.solid()
    right_card.fill.fore_color.rgb = card_rgb
    right_card.line.color.rgb = accent_rgb
    right_card.line.width = Pt(1)

    # Visual prompt annotation
    prompt_box = slide.shapes.add_textbox(Inches(7.3), Inches(5.6), Inches(4.9), Inches(0.9))
    ptf = prompt_box.text_frame
    ptf.word_wrap = True
    pp = ptf.paragraphs[0]
    pp.text = f"Visual Prompt: {slide_data.get('visual_prompt', title)[:120]}..."
    pp.font.size = Pt(10)
    pp.font.italic = True
    pp.font.color.rgb = secondary_rgb


def _render_stat_callout(slide, prs, title, subtitle, bullets, slide_data, primary_rgb, secondary_rgb, accent_rgb, card_rgb):
    """Renders prominent metric / stat callout slide."""
    t_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.2), Inches(11.7), Inches(1.2))
    tf = t_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(32)
    p.font.bold = True
    p.font.color.rgb = primary_rgb

    if subtitle:
        p2 = tf.add_paragraph()
        p2.text = subtitle
        p2.font.size = Pt(14)
        p2.font.color.rgb = secondary_rgb
        p2.space_before = Pt(4)

    # Stat highlight card
    stat_card = slide.shapes.add_shape(1, Inches(0.8), Inches(2.7), Inches(4.5), Inches(4.0))
    stat_card.fill.solid()
    stat_card.fill.fore_color.rgb = card_rgb
    stat_card.line.color.rgb = accent_rgb
    stat_card.line.width = Pt(1.5)

    stat_box = slide.shapes.add_textbox(Inches(1.0), Inches(3.0), Inches(4.1), Inches(1.6))
    stf = stat_box.text_frame
    stf.word_wrap = True
    sp = stf.paragraphs[0]
    sp.text = slide_data.get("stat_number") or "10x"
    sp.font.size = Pt(54)
    sp.font.bold = True
    sp.font.color.rgb = accent_rgb

    sp2 = stf.add_paragraph()
    sp2.text = slide_data.get("stat_label") or "Performance multiplication benchmark"
    sp2.font.size = Pt(14)
    sp2.font.color.rgb = primary_rgb
    sp2.space_before = Pt(8)

    # Bullet points on right
    b_box = slide.shapes.add_textbox(Inches(5.7), Inches(2.8), Inches(6.8), Inches(3.8))
    btf = b_box.text_frame
    btf.word_wrap = True
    for i, b in enumerate(bullets):
        bp = btf.add_paragraph() if i > 0 else btf.paragraphs[0]
        bp.text = f"•   {b}"
        bp.font.size = Pt(16)
        bp.font.color.rgb = secondary_rgb
        bp.space_before = Pt(14)


def _render_three_column(slide, prs, title, subtitle, slide_data, primary_rgb, secondary_rgb, accent_rgb, card_rgb):
    """Renders 3 equal cards layout."""
    t_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.1), Inches(11.7), Inches(1.2))
    tf = t_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(30)
    p.font.bold = True
    p.font.color.rgb = primary_rgb

    if subtitle:
        p2 = tf.add_paragraph()
        p2.text = subtitle
        p2.font.size = Pt(14)
        p2.font.color.rgb = secondary_rgb
        p2.space_before = Pt(4)

    items = slide_data.get("column_items") or [
        {"title": "Pillar 01", "desc": "Scalable modular agent coordination"},
        {"title": "Pillar 02", "desc": "Vector-grounded contextual reasoning"},
        {"title": "Pillar 03", "desc": "High-fidelity deterministic rendering"},
    ]

    col_width = Inches(3.64)
    col_gap = Inches(0.4)
    left_start = Inches(0.8)

    for i, item in enumerate(items[:3]):
        left = left_start + i * (col_width + col_gap)
        card = slide.shapes.add_shape(1, left, Inches(2.6), col_width, Inches(4.2))
        card.fill.solid()
        card.fill.fore_color.rgb = card_rgb
        card.line.color.rgb = accent_rgb
        card.line.width = Pt(1)

        c_box = slide.shapes.add_textbox(left + Inches(0.25), Inches(2.9), col_width - Inches(0.5), Inches(3.6))
        ctf = c_box.text_frame
        ctf.word_wrap = True

        cp1 = ctf.paragraphs[0]
        cp1.text = item.get("title", f"Pillar {i+1}")
        cp1.font.size = Pt(18)
        cp1.font.bold = True
        cp1.font.color.rgb = accent_rgb

        cp2 = ctf.add_paragraph()
        cp2.text = item.get("desc", "")
        cp2.font.size = Pt(14)
        cp2.font.color.rgb = secondary_rgb
        cp2.space_before = Pt(12)


def _render_timeline(slide, prs, title, subtitle, slide_data, primary_rgb, secondary_rgb, accent_rgb, card_rgb):
    """Renders milestone roadmap / timeline layout."""
    t_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.1), Inches(11.7), Inches(1.2))
    tf = t_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(30)
    p.font.bold = True
    p.font.color.rgb = primary_rgb

    if subtitle:
        p2 = tf.add_paragraph()
        p2.text = subtitle
        p2.font.size = Pt(14)
        p2.font.color.rgb = secondary_rgb
        p2.space_before = Pt(4)

    steps = slide_data.get("timeline_steps") or [
        {"step": "Phase 01", "label": "Foundational Pipeline Setup"},
        {"step": "Phase 02", "label": "Model Grounding & Validation"},
        {"step": "Phase 03", "label": "Multi-Modal Scale & Launch"},
    ]

    step_width = Inches(3.64)
    step_gap = Inches(0.4)
    left_start = Inches(0.8)

    for i, step in enumerate(steps[:3]):
        left = left_start + i * (step_width + step_gap)
        card = slide.shapes.add_shape(1, left, Inches(2.6), step_width, Inches(4.2))
        card.fill.solid()
        card.fill.fore_color.rgb = card_rgb
        card.line.color.rgb = accent_rgb
        card.line.width = Pt(1)

        c_box = slide.shapes.add_textbox(left + Inches(0.25), Inches(2.9), step_width - Inches(0.5), Inches(3.6))
        ctf = c_box.text_frame
        ctf.word_wrap = True

        cp1 = ctf.paragraphs[0]
        cp1.text = step.get("step", f"Phase {i+1}")
        cp1.font.size = Pt(16)
        cp1.font.bold = True
        cp1.font.color.rgb = accent_rgb

        cp2 = ctf.add_paragraph()
        cp2.text = step.get("label", "")
        cp2.font.size = Pt(15)
        cp2.font.color.rgb = primary_rgb
        cp2.space_before = Pt(10)
