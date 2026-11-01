"""Reference Image Visual Analyzer using Qwen-VL & Vision Models.

Extracts immutable subject anchors, materials, and palettes from an uploaded reference
image so downstream prompt architects can preserve subject identity without context drift.
"""

from __future__ import annotations

import base64
import io
import json
import logging
import os
import urllib.error
import urllib.request
from typing import Any, Dict

from PIL import Image

logger = logging.getLogger(__name__)

DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY") or os.getenv("QWEN_API_KEY", "")
DASHSCOPE_BASE_URL = (
    os.getenv("QWEN_BASE_URL")
    or os.getenv("DASHSCOPE_BASE_URL")
    or "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
).rstrip("/")
DASHSCOPE_VL_MODEL = os.getenv("DASHSCOPE_VL_MODEL", "qwen-vl-plus")

HF_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN") or os.getenv("HF_API_TOKEN") or os.getenv("HF_TOKEN", "")

REF_ANALYSIS_PROMPT = """You are an expert Computer Vision analyst for high-end diffusion pipelines (FLUX.1).
Analyze this reference image and extract its core visual identity anchors.
Your job is to identify what must remain INVARIANT if this subject is placed into a brand-new setting or lighting.

Output valid JSON matching this schema:
{
  "subject_anchor": "Concise, precise physical description of the primary subject (e.g. 'red 1990s sports coupe with pop-up headlights and distinct silver 5-spoke rims' or 'armored cyberpunk samurai with matte-black plating and glowing blue visor')",
  "materials_colors": "Dominant materials, surface textures, and color tones (e.g. 'glossy cherry-red finish, chrome accents')",
  "original_environment": "Short summary of current background/lighting that will be swapped out (e.g. 'arid desert dunes under bright sunlight')"
}
"""


def decode_image_data_url(data_url: str) -> Image.Image:
    """Decodes a base64 string or data URL into a PIL Image."""
    raw = (data_url or "").strip()
    if not raw:
        raise ValueError("Empty image data provided.")
    if "," in raw and raw.lower().startswith("data:"):
        raw = raw.split(",", 1)[1]
    image_bytes = base64.b64decode(raw, validate=False)
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    return image


def encode_image_png_b64(image: Image.Image, max_side: int = 768) -> str:
    """Resizes and encodes an image to a base64 data URL for fast token-efficient VLM analysis."""
    img = image.copy()
    if max(img.size) > max_side:
        img.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64}"


def analyze_reference_image(image_input: str | Image.Image) -> Dict[str, Any]:
    """Analyzes reference image with Qwen-VL and returns structured subject anchors."""
    if isinstance(image_input, str):
        pil_img = decode_image_data_url(image_input)
    else:
        pil_img = image_input

    data_url = encode_image_png_b64(pil_img)

    # 1. Primary: DashScope Qwen-VL
    if DASHSCOPE_API_KEY:
        try:
            payload = {
                "model": DASHSCOPE_VL_MODEL,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": REF_ANALYSIS_PROMPT},
                            {"type": "image_url", "image_url": {"url": data_url}},
                        ],
                    }
                ],
                "max_tokens": 400,
                "temperature": 0.2,
            }
            req = urllib.request.Request(
                f"{DASHSCOPE_BASE_URL}/chat/completions",
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {DASHSCOPE_API_KEY}",
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=45) as resp:
                resp_text = resp.read().decode("utf-8")
                res_json = json.loads(resp_text)
                content = res_json["choices"][0]["message"]["content"]

                # Extract JSON block
                clean_text = content.strip()
                if "```json" in clean_text:
                    clean_text = clean_text.split("```json")[1].split("```")[0].strip()
                elif "```" in clean_text:
                    clean_text = clean_text.split("```")[1].split("```")[0].strip()

                parsed = json.loads(clean_text)
                logger.info("Successfully analyzed reference image with Qwen-VL: %s", parsed.get("subject_anchor"))
                return {
                    "subject_anchor": parsed.get("subject_anchor", "primary subject from reference image"),
                    "materials_colors": parsed.get("materials_colors", ""),
                    "original_environment": parsed.get("original_environment", ""),
                    "source": "dashscope_qwen_vl",
                }
        except Exception as exc:
            logger.warning("DashScope Qwen-VL analysis failed (%s), trying fallback...", exc)

    # 2. Fallback: Hugging Face InferenceClient with Qwen2.5-VL
    if HF_TOKEN:
        try:
            from huggingface_hub import InferenceClient
            client = InferenceClient(token=HF_TOKEN)
            completion = client.chat.completions.create(
                model="Qwen/Qwen2.5-VL-3B-Instruct",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": REF_ANALYSIS_PROMPT},
                            {"type": "image_url", "image_url": {"url": data_url}},
                        ],
                    }
                ],
                max_tokens=350,
                temperature=0.2,
            )
            content = completion.choices[0].message.content or ""
            clean_text = content.strip()
            if "```json" in clean_text:
                clean_text = clean_text.split("```json")[1].split("```")[0].strip()
            elif "```" in clean_text:
                clean_text = clean_text.split("```")[1].split("```")[0].strip()

            parsed = json.loads(clean_text)
            return {
                "subject_anchor": parsed.get("subject_anchor", "primary subject from reference image"),
                "materials_colors": parsed.get("materials_colors", ""),
                "original_environment": parsed.get("original_environment", ""),
                "source": "hf_qwen_vl",
            }
        except Exception as hf_exc:
            logger.warning("HF Qwen-VL fallback failed (%s)", hf_exc)

    # 3. Graceful fallback if offline or no keys
    return {
        "subject_anchor": "distinct visual subject from reference image, preserving original form and color palette",
        "materials_colors": "original reference textures and tones",
        "original_environment": "original scene",
        "source": "fallback_anchor",
    }

