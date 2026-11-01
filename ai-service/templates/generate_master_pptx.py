"""Master PPTX Template Generator.

Generates 4 production-grade 16:9 widescreen master PowerPoint (.pptx) templates:
1. sequoia_pitch.pptx (Venture Pitch & Investor Deck)
2. keynote_reveal.pptx (Apple Keynote Style Dark Reveal)
3. saas_qbr.pptx (Executive SaaS QBR & Board Deck)
4. product_launch.pptx (Product Innovation & Hardware/Software Showcase)
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

TEMPLATES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "pptx"))
os.makedirs(TEMPLATES_DIR, exist_ok=True)


def hex_to_rgb(hex_str: str) -> RGBColor:
    h = hex_str.lstrip("#")
    return RGBColor(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def build_sequoia_pitch_master():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    bg_color = hex_to_rgb("0a0f1d")
    card_color = hex_to_rgb("11192e")
    accent = hex_to_rgb("2563eb")
    accent_alt = hex_to_rgb("38bdf8")
    text_white = hex_to_rgb("ffffff")
    text_muted = hex_to_rgb("94a3b8")

    slides_meta = [
        ("COMPANY PURPOSE", "State the core mission in one undeniable, memorable phrase.", "01 // PURPOSE"),
        ("THE SYSTEMIC PROBLEM", "Legacy workflows cost enterprises billions in lost velocity.", "02 // PROBLEM"),
        ("PROPRIETARY BREAKTHROUGH", "Our autonomous AI architecture delivers 10x throughput.", "03 // TECHNOLOGY"),
        ("EXPONENTIAL TRACTION", "340% YoY ARR growth driven by top-tier enterprise adoption.", "04 // TRACTION"),
        ("THE DECADE HORIZON", "Defining the standard operating system for modern business.", "05 // VISION"),
    ]

    for title, subtitle, tag in slides_meta:
        slide = prs.slides.add_slide(blank_layout)

        # Background
        bg = slide.shapes.add_shape(1, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = bg_color
        bg.line.fill.background()

        # Header tag
        tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.6), Inches(4), Inches(0.4))
        p_tag = tag_box.text_frame.paragraphs[0]
        p_tag.text = f"SEQUOIA ARCHETYPE · {tag}"
        p_tag.font.size = Pt(10)
        p_tag.font.bold = True
        p_tag.font.color.rgb = accent_alt

        # Slide Card Box
        card = slide.shapes.add_shape(1, Inches(0.8), Inches(1.2), Inches(11.733), Inches(5.6))
        card.fill.solid()
        card.fill.fore_color.rgb = card_color
        card.line.color.rgb = accent
        card.line.width = Pt(1)

        # Title
        tbox = slide.shapes.add_textbox(Inches(1.2), Inches(1.6), Inches(10.5), Inches(1.2))
        tf = tbox.text_frame
        tf.word_wrap = True
        pt = tf.paragraphs[0]
        pt.text = title
        pt.font.size = Pt(36)
        pt.font.bold = True
        pt.font.color.rgb = text_white

        # Subtitle
        sbox = slide.shapes.add_textbox(Inches(1.2), Inches(2.9), Inches(10.5), Inches(1.0))
        stf = sbox.text_frame
        stf.word_wrap = True
        pst = stf.paragraphs[0]
        pst.text = subtitle
        pst.font.size = Pt(18)
        pst.font.color.rgb = text_muted

        # Bottom watermark
        wm = slide.shapes.add_textbox(Inches(1.2), Inches(6.1), Inches(8), Inches(0.4))
        pwm = wm.text_frame.paragraphs[0]
        pwm.text = "CONFIDENTIAL // VIDCRAFT AI VENTURE PRESENTATION"
        pwm.font.size = Pt(9)
        pwm.font.color.rgb = text_muted

    target_path = os.path.join(TEMPLATES_DIR, "sequoia_pitch.pptx")
    prs.save(target_path)
    print(f"Generated: {target_path}")


def build_keynote_reveal_master():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    bg_color = hex_to_rgb("000000")
    accent = hex_to_rgb("a855f7")
    accent_alt = hex_to_rgb("ec4899")
    text_white = hex_to_rgb("ffffff")
    text_muted = hex_to_rgb("a1a1aa")

    slides_meta = [
        ("ONE MORE THING", "A seismic shift in creative computing and intelligent video production.", "01 // THE REVEAL"),
        ("10X PERFORMANCE LEAP", "Engineered from silicon to screen to eliminate rendering latency.", "02 // BENCHMARKS"),
        ("ADOPTION CURVE", "Unprecedented developer love and viral market pull.", "03 // TRAJECTORY"),
        ("MODULAR ARCHITECTURE", "Crafted with precision. Three interlocking foundational pillars.", "04 // ECOSYSTEM"),
        ("THE FUTURE STARTS NOW", "Experience the next chapter of human-AI collaboration.", "05 // CALL TO ACTION"),
    ]

    for title, subtitle, tag in slides_meta:
        slide = prs.slides.add_slide(blank_layout)

        bg = slide.shapes.add_shape(1, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = bg_color
        bg.line.fill.background()

        # Tag
        tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.6), Inches(4), Inches(0.4))
        p_tag = tag_box.text_frame.paragraphs[0]
        p_tag.text = f"KEYNOTE REVEAL · {tag}"
        p_tag.font.size = Pt(10)
        p_tag.font.bold = True
        p_tag.font.color.rgb = accent

        # Giant Title
        tbox = slide.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(11.3), Inches(1.8))
        tf = tbox.text_frame
        tf.word_wrap = True
        pt = tf.paragraphs[0]
        pt.text = title
        pt.font.size = Pt(44)
        pt.font.bold = True
        pt.font.color.rgb = text_white

        # Subtitle
        sbox = slide.shapes.add_textbox(Inches(1.0), Inches(4.0), Inches(10.0), Inches(1.2))
        stf = sbox.text_frame
        stf.word_wrap = True
        pst = stf.paragraphs[0]
        pst.text = subtitle
        pst.font.size = Pt(20)
        pst.font.color.rgb = text_muted

    target_path = os.path.join(TEMPLATES_DIR, "keynote_reveal.pptx")
    prs.save(target_path)
    print(f"Generated: {target_path}")


def build_saas_qbr_master():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    bg_color = hex_to_rgb("0f172a")
    card_color = hex_to_rgb("1e293b")
    accent = hex_to_rgb("06b6d4")
    accent_alt = hex_to_rgb("3b82f6")
    text_white = hex_to_rgb("ffffff")
    text_muted = hex_to_rgb("94a3b8")

    slides_meta = [
        ("EXECUTIVE QBR SUMMARY", "Consolidated performance, operational highlights, and strategic outlook.", "01 // OVERVIEW"),
        ("DISRUPTION KPI SNAPSHOT", "Net revenue retention at 148% with near-zero gross churn.", "02 // RETENTION"),
        ("REVENUE SCALE TRAJECTORY", "Exceeding quarterly targets with accelerating enterprise expansion.", "03 // SCALE"),
        ("STRATEGIC PILLARS", "Executing on enterprise security, self-serve growth, and AI workflows.", "04 // ROADMAP"),
        ("FY26 FORWARD OUTLOOK", "Capital allocation, target milestones, and key executive priorities.", "05 // TARGETS"),
    ]

    for title, subtitle, tag in slides_meta:
        slide = prs.slides.add_slide(blank_layout)

        bg = slide.shapes.add_shape(1, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = bg_color
        bg.line.fill.background()

        # Brand header bar
        hbar = slide.shapes.add_shape(1, Inches(0.8), Inches(0.6), Inches(11.733), Inches(0.04))
        hbar.fill.solid()
        hbar.fill.fore_color.rgb = accent
        hbar.line.fill.background()

        tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(5), Inches(0.4))
        p_tag = tag_box.text_frame.paragraphs[0]
        p_tag.text = f"SaaS BOARD QBR · {tag}"
        p_tag.font.size = Pt(10)
        p_tag.font.bold = True
        p_tag.font.color.rgb = accent

        tbox = slide.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(11.733), Inches(1.4))
        tf = tbox.text_frame
        tf.word_wrap = True
        pt = tf.paragraphs[0]
        pt.text = title
        pt.font.size = Pt(38)
        pt.font.bold = True
        pt.font.color.rgb = text_white

        sbox = slide.shapes.add_textbox(Inches(0.8), Inches(3.0), Inches(10.5), Inches(1.0))
        stf = sbox.text_frame
        stf.word_wrap = True
        pst = stf.paragraphs[0]
        pst.text = subtitle
        pst.font.size = Pt(18)
        pst.font.color.rgb = text_muted

    target_path = os.path.join(TEMPLATES_DIR, "saas_qbr.pptx")
    prs.save(target_path)
    print(f"Generated: {target_path}")


def build_product_launch_master():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    bg_color = hex_to_rgb("022c22")
    card_color = hex_to_rgb("064e3b")
    accent = hex_to_rgb("10b981")
    accent_alt = hex_to_rgb("34d399")
    text_white = hex_to_rgb("ffffff")
    text_muted = hex_to_rgb("a7f3d0")

    slides_meta = [
        ("PRODUCT SHOWCASE 2026", "Unveiling the next frontier of intelligent creative media generation.", "01 // UNVEILING"),
        ("THE DISRUPTED EXPERIENCE", "How we redesigned the entire workflow around creators.", "02 // EXPERIENCE"),
        ("SIGNATURE CAPABILITIES", "Autonomous AI video generation, realtime voice, and 4K output.", "03 // INNOVATION"),
        ("ROLLOUT ROADMAP", "Global availability timeline and partner developer ecosystem.", "04 // ROADMAP"),
        ("THE NEW GOLD STANDARD", "Empowering millions of creators worldwide to build without limits.", "05 // VISION"),
    ]

    for title, subtitle, tag in slides_meta:
        slide = prs.slides.add_slide(blank_layout)

        bg = slide.shapes.add_shape(1, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = bg_color
        bg.line.fill.background()

        tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.6), Inches(5), Inches(0.4))
        p_tag = tag_box.text_frame.paragraphs[0]
        p_tag.text = f"PRODUCT LAUNCH · {tag}"
        p_tag.font.size = Pt(10)
        p_tag.font.bold = True
        p_tag.font.color.rgb = accent_alt

        tbox = slide.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(11.733), Inches(1.4))
        tf = tbox.text_frame
        tf.word_wrap = True
        pt = tf.paragraphs[0]
        pt.text = title
        pt.font.size = Pt(40)
        pt.font.bold = True
        pt.font.color.rgb = text_white

        sbox = slide.shapes.add_textbox(Inches(0.8), Inches(3.0), Inches(10.5), Inches(1.0))
        stf = sbox.text_frame
        stf.word_wrap = True
        pst = stf.paragraphs[0]
        pst.text = subtitle
        pst.font.size = Pt(18)
        pst.font.color.rgb = text_muted

    target_path = os.path.join(TEMPLATES_DIR, "product_launch.pptx")
    prs.save(target_path)
    print(f"Generated: {target_path}")


if __name__ == "__main__":
    build_sequoia_pitch_master()
    build_keynote_reveal_master()
    build_saas_qbr_master()
    build_product_launch_master()
    print("All 4 Master PPTX templates built successfully in:", TEMPLATES_DIR)
