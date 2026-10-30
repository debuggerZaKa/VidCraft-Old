from __future__ import annotations

import base64
import io
import os
from pathlib import Path
from typing import Any, Dict

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from huggingface_hub import InferenceClient
from PIL import Image

ROOT_DIR = Path(__file__).resolve().parent
load_dotenv(ROOT_DIR / ".env")
load_dotenv(ROOT_DIR.parent / ".env")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_MAP = {
    "huggingface": os.getenv("HF_MODEL_DEFAULT", "black-forest-labs/FLUX.1-schnell"),
    "vidcraft": os.getenv("HF_MODEL_DEFAULT", "black-forest-labs/FLUX.1-schnell"),
    "sdxl-turbo": os.getenv("HF_MODEL_SDXL_TURBO", "stabilityai/sdxl-turbo"),
    "kandinsky-3": os.getenv("HF_MODEL_KANDINSKY_3", "kandinsky-community/kandinsky-3"),
    "flux-pro": os.getenv("HF_MODEL_FLUX_PRO", "black-forest-labs/FLUX.1-schnell"),
}

# Ref flow: VLM caption (image-text-to-text) + text-to-image.
# Prefer DashScope Qwen-VL (reliable/cheap), fall back to HF Inference Providers.
REF_CAPTION_MODEL = os.getenv(
    "HF_REF_CAPTION_MODEL",
    "Qwen/Qwen2.5-VL-3B-Instruct",
)
REF_T2I_MODEL = os.getenv(
    "HF_MODEL_IMG2IMG",  # keep old env name for compatibility
    os.getenv("HF_MODEL_DEFAULT", "black-forest-labs/FLUX.1-schnell"),
)
REF_PROVIDER = os.getenv("HF_IMG2IMG_PROVIDER") or "auto"
REF_CAPTION_PROVIDER = os.getenv("HF_REF_CAPTION_PROVIDER") or "featherless-ai"
REF_CAPTION_MAX_SIDE = int(os.getenv("HF_REF_CAPTION_MAX_SIDE") or "768")
REF_CAPTION_BACKEND = (os.getenv("HF_REF_CAPTION_BACKEND") or "auto").strip().lower()
DASHSCOPE_VL_MODEL = os.getenv("DASHSCOPE_VL_MODEL") or os.getenv("QWEN_VL_MODEL") or "qwen-vl-plus"
# Legacy aliases used in health / logs
IMG2IMG_MODEL = REF_T2I_MODEL
IMG2IMG_PROVIDER = REF_PROVIDER

CAPTION_SYSTEM_PROMPT = (
    "You describe images for an artist who will redraw them. "
    "Reply with one concise paragraph: subject, materials/colors, "
    "composition, camera angle, lighting, and style. No preamble."
)

RESOLUTION_BASE = {
    "1K": 1024,
    "2K": 1536,
    "4K": 2048,
}


def snap(value: float) -> int:
    return max(256, int(round(value / 16.0) * 16))


def resolve_image_size(
    resolution: str | None,
    aspect_ratio: str | None,
    width: int | None,
    height: int | None,
) -> tuple[int, int]:
    if width and height and width > 0 and height > 0:
        return snap(width), snap(height)

    base = RESOLUTION_BASE.get((resolution or "2K").upper(), 1024)
    raw = (aspect_ratio or "1:1").split(":")
    try:
        w_ratio = float(raw[0])
        h_ratio = float(raw[1]) if len(raw) > 1 else 1.0
    except (TypeError, ValueError):
        w_ratio, h_ratio = 1.0, 1.0

    if w_ratio <= 0 or h_ratio <= 0:
        w_ratio, h_ratio = 1.0, 1.0

    if w_ratio >= h_ratio:
        out_w = base
        out_h = (base * h_ratio) / w_ratio
    else:
        out_h = base
        out_w = (base * w_ratio) / h_ratio

    return snap(out_w), snap(out_h)


def compute_cost(tier: str | None, output_type: str | None, seconds: int | None = 10) -> Dict[str, Any]:
    if output_type == "image":
        cost_per_image = 20 if tier == "premium" else 8 if tier == "wavespeed" else 0
        return {"cost": cost_per_image, "costPerUnit": cost_per_image, "unit": "image"}
    cost_per_sec = 55 if tier == "premium" else 27.9 if tier == "wavespeed" else 0
    total = cost_per_sec * (seconds or 10)
    return {"cost": total, "costPerUnit": cost_per_sec, "unit": "sec"}


class GeneratePayload(BaseModel):
    prompt: str
    outputType: str | None = "image"
    model: str | None = None
    tier: str | None = None
    seconds: int | None = 10
    path: str | None = None
    contentType: str | None = None
    templateId: str | None = None
    resolution: str | None = None
    aspectRatio: str | None = None
    width: int | None = None
    height: int | None = None


class GenerateFromRefPayload(BaseModel):
    prompt: str
    refImage: str
    model: str | None = None
    tier: str | None = None
    strength: float | None = 0.65
    guidanceScale: float | None = None
    resolution: str | None = None
    aspectRatio: str | None = None
    width: int | None = None
    height: int | None = None


def decode_ref_image(data_url: str) -> Image.Image:
    raw = (data_url or "").strip()
    if not raw:
        raise HTTPException(status_code=400, detail="Reference image is required.")
    try:
        if "," in raw and raw.lower().startswith("data:"):
            raw = raw.split(",", 1)[1]
        image_bytes = base64.b64decode(raw, validate=False)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        return image
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="Invalid reference image.") from exc


def encode_png(image: Image.Image) -> str:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    base64_image = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{base64_image}"


def pil_to_png_bytes(image: Image.Image) -> bytes:
    """hf-inference expects bytes/path/URL for image inputs, not a PIL Image."""
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


@app.get("/api/health")
def health() -> Dict[str, Any]:
    has_token = bool(os.getenv("HF_API_TOKEN") or os.getenv("HF_TOKEN"))
    has_dashscope = bool(os.getenv("DASHSCOPE_API_KEY") or os.getenv("QWEN_API_KEY"))
    return {
        "ok": True,
        "hasToken": has_token,
        "hasDashscope": has_dashscope,
        "refMode": "vlm-caption-then-t2i",
        "refCaptionBackend": REF_CAPTION_BACKEND,
        "refCaptionModel": REF_CAPTION_MODEL,
        "dashscopeVlModel": DASHSCOPE_VL_MODEL,
        "refImageModel": REF_T2I_MODEL,
        "refProvider": REF_PROVIDER,
        "refCaptionProvider": REF_CAPTION_PROVIDER,
    }


@app.post("/api/generate")
def generate(payload: GeneratePayload) -> Dict[str, Any]:
    if not payload.prompt or not payload.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt is required.")

    pricing = compute_cost(payload.tier, payload.outputType, payload.seconds)

    if payload.outputType != "image":
        return pricing

    hf_token = os.getenv("HF_API_TOKEN") or os.getenv("HF_TOKEN")
    if not hf_token:
        raise HTTPException(status_code=500, detail="Image service is not configured.")

    model_key = payload.model or "vidcraft"
    if model_key == "huggingface":
        model_key = "vidcraft"
    model_id = MODEL_MAP.get(model_key, MODEL_MAP["vidcraft"])
    width, height = resolve_image_size(
        payload.resolution,
        payload.aspectRatio,
        payload.width,
        payload.height,
    )

    try:
        client = InferenceClient(provider="auto", token=hf_token)
        image = client.text_to_image(
            payload.prompt.strip(),
            model=model_id,
            width=width,
            height=height,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if not isinstance(image, Image.Image):
        raise HTTPException(status_code=502, detail="VidCraft did not return an image.")

    return {
        **pricing,
        "modelId": model_id,
        "width": width,
        "height": height,
        "imageDataUrl": encode_png(image),
    }


def build_ref_prompt(user_prompt: str, caption: str, strength: float) -> str:
    """Blend user intent with reference caption. Higher strength = follow prompt more."""
    caption = (caption or "").strip()
    user_prompt = (user_prompt or "").strip()
    if not caption:
        return user_prompt
    # strength 0.15..0.95 → how much to lean on the user prompt vs the reference description
    if strength >= 0.75:
        return (
            f"{user_prompt}. Inspired by this reference scene: {caption}. "
            "Match camera angle and composition where possible."
        )
    if strength <= 0.35:
        return (
            f"Create an image matching this reference: {caption}. "
            f"Apply this change: {user_prompt}. Keep style, subject identity, and layout close to the reference."
        )
    return (
        f"{user_prompt}. "
        f"Use this reference as visual guidance (style, subject, composition, camera): {caption}."
    )


def prepare_caption_image(ref: Image.Image) -> Image.Image:
    """Downscale reference before VLM captioning to cut tokens/cost."""
    image = ref.convert("RGB")
    max_side = max(256, REF_CAPTION_MAX_SIDE)
    if max(image.size) > max_side:
        image = image.copy()
        image.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    return image


def extract_chat_text(completion: Any) -> str:
    """Normalize OpenAI-style / HF chat completion payloads into plain text."""
    if completion is None:
        return ""
    if isinstance(completion, str):
        return completion.strip()

    choices = getattr(completion, "choices", None)
    if choices is None and isinstance(completion, dict):
        choices = completion.get("choices")
    if not choices:
        return str(completion).strip()

    first = choices[0]
    message = getattr(first, "message", None)
    if message is None and isinstance(first, dict):
        message = first.get("message")

    content = getattr(message, "content", None) if message is not None else None
    if content is None and isinstance(message, dict):
        content = message.get("content")

    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict) and item.get("type") == "text":
                parts.append(str(item.get("text") or ""))
            else:
                text = getattr(item, "text", None)
                if text:
                    parts.append(str(text))
        return " ".join(part.strip() for part in parts if part and str(part).strip()).strip()

    if content is not None:
        return str(content).strip()

    text = getattr(first, "text", None)
    if text is None and isinstance(first, dict):
        text = first.get("text")
    return str(text or "").strip()


def get_dashscope_config() -> tuple[str, str]:
    key = (
        os.getenv("DASHSCOPE_API_KEY")
        or os.getenv("QWEN_API_KEY")
        or ""
    ).strip()
    base_url = (
        os.getenv("QWEN_BASE_URL")
        or os.getenv("DASHSCOPE_BASE_URL")
        or "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
    ).rstrip("/")
    return key, base_url


def caption_reference_with_dashscope(ref: Image.Image) -> str:
    """Describe the reference with DashScope Qwen-VL (OpenAI-compatible)."""
    import json
    import urllib.error
    import urllib.request

    key, base_url = get_dashscope_config()
    if not key:
        raise RuntimeError("DASHSCOPE_API_KEY / QWEN_API_KEY is not configured.")

    caption_image = prepare_caption_image(ref)
    # DashScope rejects tiny images (<10px); enforce a minimum canvas.
    if min(caption_image.size) < 32:
        canvas = Image.new("RGB", (max(32, caption_image.width), max(32, caption_image.height)), (0, 0, 0))
        canvas.paste(caption_image, (0, 0))
        caption_image = canvas

    data_url = encode_png(caption_image)
    payload = {
        "model": DASHSCOPE_VL_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": CAPTION_SYSTEM_PROMPT},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            }
        ],
        "max_tokens": 180,
        "temperature": 0.2,
    }
    req = urllib.request.Request(
        f"{base_url}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            raw = resp.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"DashScope VL failed ({exc.code}): {detail}") from exc

    try:
        completion = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"DashScope VL returned non-JSON: {raw[:300]}") from exc

    caption = extract_chat_text(completion)
    if not caption:
        raise RuntimeError("DashScope VL returned an empty caption.")
    return caption


def caption_reference_with_vlm(client: InferenceClient, ref: Image.Image) -> str:
    """Describe the reference image with a live HF image-text-to-text (VLM) model."""
    caption_image = prepare_caption_image(ref)
    data_url = encode_png(caption_image)

    completion = client.chat.completions.create(
        model=REF_CAPTION_MODEL,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": CAPTION_SYSTEM_PROMPT},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            }
        ],
        max_tokens=180,
        temperature=0.2,
    )
    caption = extract_chat_text(completion)
    if not caption:
        raise RuntimeError("VLM returned an empty caption.")
    return caption


def caption_reference(client: InferenceClient | None, ref: Image.Image) -> str:
    """
    Caption order:
    1) DashScope Qwen-VL (preferred for reliability/cost)
    2) HF Inference Providers VLM (featherless / auto)
    """
    errors: list[str] = []
    backend = REF_CAPTION_BACKEND

    use_dashscope = backend in ("auto", "dashscope", "qwen")
    use_hf = backend in ("auto", "hf", "huggingface")

    if use_dashscope:
        try:
            print(f"[ref] caption via DashScope / {DASHSCOPE_VL_MODEL}")
            return caption_reference_with_dashscope(ref)
        except Exception as exc:  # noqa: BLE001
            errors.append(f"dashscope: {exc}")
            print(f"[ref] dashscope caption failed: {exc}")
            if backend in ("dashscope", "qwen"):
                raise RuntimeError("Could not analyze reference image: " + " | ".join(errors)) from exc

    if use_hf:
        if client is None:
            errors.append("hf: InferenceClient not available")
        else:
            try:
                print(f"[ref] caption via HF / {REF_CAPTION_PROVIDER} / {REF_CAPTION_MODEL}")
                return caption_reference_with_vlm(client, ref)
            except Exception as exc:  # noqa: BLE001
                errors.append(f"hf-vlm: {exc}")
                print(f"[ref] hf caption failed: {exc}")

            # Legacy path kept as a last resort for older/self-hosted setups
            try:
                ref_bytes = pil_to_png_bytes(prepare_caption_image(ref))
                result = client.image_to_text(ref_bytes, model=REF_CAPTION_MODEL)
                if isinstance(result, str) and result.strip():
                    return result.strip()
                if isinstance(result, dict):
                    text = str(result.get("generated_text") or result.get("answer") or "").strip()
                    if text:
                        return text
                text = getattr(result, "generated_text", None) or getattr(result, "answer", None)
                if text:
                    return str(text).strip()
            except Exception as exc:  # noqa: BLE001
                errors.append(f"image_to_text: {exc}")

    raise RuntimeError("Could not analyze reference image: " + " | ".join(errors))


@app.post("/api/generate-from-ref")
def generate_from_ref(payload: GenerateFromRefPayload) -> Dict[str, Any]:
    """
    HF Ref flow:
    1) Caption the reference with a vision LLM (DashScope Qwen-VL, else HF VLM)
    2) Merge caption + user prompt
    3) Generate with Hugging Face text-to-image (same path as /api/generate)
    True pixel img2img still needs a partner edit model (e.g. Fal Kontext).
    """
    if not payload.prompt or not payload.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt is required.")

    pricing = compute_cost(payload.tier, "image", 1)
    hf_token = os.getenv("HF_API_TOKEN") or os.getenv("HF_TOKEN")
    if not hf_token:
        raise HTTPException(status_code=500, detail="Image service is not configured.")

    ref = decode_ref_image(payload.refImage)

    strength = payload.strength if payload.strength is not None else 0.65
    strength = max(0.05, min(1.0, float(strength)))

    width, height = resolve_image_size(
        payload.resolution,
        payload.aspectRatio,
        payload.width,
        payload.height,
    )

    max_side = max(width, height, 1024)
    if max(ref.size) > max_side:
        ref.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)

    # Prefer explicit t2i model; ignore partner-only edit models passed from older clients
    model_id = (payload.model or "").strip() or REF_T2I_MODEL
    if model_id in MODEL_MAP:
        model_id = MODEL_MAP[model_id]
    if "kontext" in model_id.lower() or model_id == "stabilityai/stable-diffusion-xl-base-1.0":
        model_id = MODEL_MAP.get("vidcraft", REF_T2I_MODEL)

    caption_warning = ""
    caption_source = ""
    try:
        caption_client = InferenceClient(provider=REF_CAPTION_PROVIDER, token=hf_token)
        try:
            caption = caption_reference(caption_client, ref)
            caption_source = "dashscope" if REF_CAPTION_BACKEND in ("dashscope", "qwen") else "vlm"
            # Detect which path likely succeeded via recent log markers is hard;
            # prefer reporting backend preference.
            if REF_CAPTION_BACKEND in ("auto",):
                caption_source = "auto"
        except Exception as caption_exc:  # noqa: BLE001
            # Soft-fail: still generate from the user prompt alone
            caption = ""
            caption_warning = str(caption_exc)
            print(f"[ref] caption failed, continuing with prompt only: {caption_warning}")

        if not caption:
            caption = "a detailed reference image"
            merged_prompt = payload.prompt.strip()
            if not caption_warning:
                caption_warning = "Caption unavailable; used user prompt only."
        else:
            merged_prompt = build_ref_prompt(payload.prompt.strip(), caption, strength)

        # Same routing as simple Image generation
        t2i_client = InferenceClient(provider=REF_PROVIDER, token=hf_token)
        image = t2i_client.text_to_image(
            merged_prompt,
            model=model_id,
            width=width,
            height=height,
        )
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if not isinstance(image, Image.Image):
        raise HTTPException(status_code=502, detail="VidCraft did not return an image.")

    result: Dict[str, Any] = {
        **pricing,
        "modelId": model_id,
        "captionModel": DASHSCOPE_VL_MODEL if not caption_warning else REF_CAPTION_MODEL,
        "provider": REF_PROVIDER,
        "refCaption": caption,
        "mergedPrompt": merged_prompt,
        "width": width,
        "height": height,
        "strength": strength,
        "imageDataUrl": encode_png(image),
        "mode": "ref-vlm-caption-t2i",
        "captionSource": caption_source or ("prompt-only" if caption_warning else "vlm"),
    }
    if caption_warning:
        result["captionWarning"] = caption_warning
    return result
