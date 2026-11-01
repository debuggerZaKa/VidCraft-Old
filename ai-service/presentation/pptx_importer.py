"""PPTX to Polotno Canvas Converter.

Converts standard Microsoft PowerPoint (.pptx) master files into Polotno JSON schema
so that any downloaded or custom PowerPoint presentation can be opened, dragged, 
and edited directly in the in-browser VidCraft Polotno Canvas studio.
"""

import os
import uuid
from typing import Any, Dict, List
from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE_TYPE


def convert_pptx_to_polotno(pptx_path: str) -> Dict[str, Any]:
    """Converts a .pptx file into a Polotno JSON schema dictionary."""
    if not os.path.exists(pptx_path):
        raise FileNotFoundError(f"PPTX file not found: {pptx_path}")

    prs = Presentation(pptx_path)
    
    # Target 16:9 canvas dimensions in Polotno
    canvas_w = 1920
    canvas_h = 1080

    orig_w_in = prs.slide_width.inches if prs.slide_width else 13.333
    orig_h_in = prs.slide_height.inches if prs.slide_height else 7.5

    scale_x = canvas_w / orig_w_in
    scale_y = canvas_h / orig_h_in

    pages: List[Dict[str, Any]] = []

    for slide_idx, slide in enumerate(prs.slides):
        children: List[Dict[str, Any]] = []

        # Background color detection or fallback
        bg_color = "#090d16"

        for shape in slide.shapes:
            try:
                left = shape.left.inches * scale_x if shape.left else 0
                top = shape.top.inches * scale_y if shape.top else 0
                width = shape.width.inches * scale_x if shape.width else 200
                height = shape.height.inches * scale_y if shape.height else 50

                # Detect background rectangle (solid color auto shape only, NOT pictures)
                if shape.shape_type != MSO_SHAPE_TYPE.PICTURE and shape.has_text_frame is False and width >= (canvas_w * 0.95) and height >= (canvas_h * 0.95):
                    if hasattr(shape, "fill") and hasattr(shape.fill, "fore_color") and hasattr(shape.fill.fore_color, "rgb"):
                        r, g, b = shape.fill.fore_color.rgb
                        bg_color = f"#{r:02x}{g:02x}{b:02x}"
                    continue

                # Text box / shape with text
                if shape.has_text_frame and shape.text_frame and shape.text_frame.text.strip():
                    tf = shape.text_frame
                    full_text = tf.text.strip()
                    
                    font_size = 28
                    font_bold = False
                    color_hex = "#ffffff"
                    align = "left"

                    if tf.paragraphs:
                        p0 = tf.paragraphs[0]
                        if p0.font.size:
                            # Convert Pt to px roughly
                            font_size = max(14, int(p0.font.size.pt * 1.33))
                        font_bold = bool(p0.font.bold)
                        if p0.font.color and hasattr(p0.font.color, "rgb") and p0.font.color.rgb:
                            r, g, b = p0.font.color.rgb
                            color_hex = f"#{r:02x}{g:02x}{b:02x}"

                    children.append({
                        "id": f"text_{uuid.uuid4().hex[:8]}",
                        "type": "text",
                        "x": round(left),
                        "y": round(top),
                        "width": round(width),
                        "height": round(height),
                        "text": full_text,
                        "fontSize": font_size,
                        "fontFamily": "Inter",
                        "fontWeight": "bold" if font_bold else "normal",
                        "fill": color_hex,
                        "align": align,
                    })

                # Card or geometric shape
                elif shape.shape_type == MSO_SHAPE_TYPE.AUTO_SHAPE:
                    fill_hex = "#111827"
                    if hasattr(shape, "fill") and hasattr(shape.fill, "fore_color") and hasattr(shape.fill.fore_color, "rgb"):
                        r, g, b = shape.fill.fore_color.rgb
                        fill_hex = f"#{r:02x}{g:02x}{b:02x}"

                    # Represent card as a rounded svg rectangle in Polotno
                    svg_content = f'''<svg width="{round(width)}" height="{round(height)}" xmlns="http://www.w3.org/2000/svg">
                        <rect width="{round(width)}" height="{round(height)}" rx="16" fill="{fill_hex}" />
                    </svg>'''

                    children.append({
                        "id": f"shape_{uuid.uuid4().hex[:8]}",
                        "type": "svg",
                        "x": round(left),
                        "y": round(top),
                        "width": round(width),
                        "height": round(height),
                        "content": svg_content,
                    })

                # Picture / Graphic slide background
                elif shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
                    base_name = os.path.splitext(os.path.basename(pptx_path))[0]
                    # If this picture covers the whole slide, make it 1920x1080
                    is_full_slide = width >= (canvas_w * 0.8) and height >= (canvas_h * 0.8)
                    img_x = 0 if is_full_slide else round(left)
                    img_y = 0 if is_full_slide else round(top)
                    img_w = canvas_w if is_full_slide else round(width)
                    img_h = canvas_h if is_full_slide else round(height)
                    
                    media_url = f"http://localhost:5000/media/presentations/templates/{base_name}_slide_{slide_idx + 1}.jpg"
                    children.append({
                        "id": f"img_{uuid.uuid4().hex[:8]}",
                        "type": "image",
                        "x": img_x,
                        "y": img_y,
                        "width": img_w,
                        "height": img_h,
                        "src": media_url,
                    })

            except Exception as e:
                # Silently skip unsupported complex binary shapes
                continue

        pages.append({
            "id": f"page_{slide_idx + 1}",
            "width": canvas_w,
            "height": canvas_h,
            "background": bg_color,
            "children": children,
        })

    return {
        "width": canvas_w,
        "height": canvas_h,
        "pages": pages,
    }
