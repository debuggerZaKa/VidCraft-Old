"""Prompt Architect: Intelligent RAG-Grounded Prompt Expansion for Image Models.

Uses a 12,000+ Midjourney/Diffusion exemplar vector index (FAISS) + Groq LLM
to elevate simple user requests into award-winning photographic & artistic briefs.
"""

import json
import logging
import os
import faiss
import numpy as np

from config import EMBEDDING_DIM
from llm import complete_json
from rag.embedder import embed

logger = logging.getLogger(__name__)

INDEX_DIR = os.path.join(os.path.dirname(__file__), "rag", "data")
INDEX_PATH = os.path.join(INDEX_DIR, "prompt_index.faiss")
META_PATH = os.path.join(INDEX_DIR, "prompt_index.meta.json")

_cached_index = None
_cached_metadata = None


def get_prompt_index():
    global _cached_index, _cached_metadata
    if _cached_index is not None and _cached_metadata is not None:
        return _cached_index, _cached_metadata

    if not os.path.exists(INDEX_PATH) or not os.path.exists(META_PATH):
        logger.warning("Prompt index not found at %s. Please run build_prompt_index.py", INDEX_PATH)
        return None, []

    logger.info("Loading prompt FAISS index from %s...", INDEX_PATH)
    _cached_index = faiss.read_index(INDEX_PATH)
    with open(META_PATH, "r", encoding="utf-8") as f:
        _cached_metadata = json.load(f)
    return _cached_index, _cached_metadata


def search_exemplars(query: str, k: int = 3, category_filter: str = None) -> list[dict]:
    """Retrieve top k most relevant real-world Midjourney/Diffusion exemplars from 12k corpus."""
    index, metadata = get_prompt_index()
    if index is None or not metadata:
        return []

    # Embed query using all-MiniLM-L6-v2
    query_vec = embed(query)  # shape (1, 384), L2-normalized
    k_search = min(k * 4 if category_filter else k, len(metadata))

    distances, indices = index.search(query_vec, k_search)
    results = []

    for score, idx in zip(distances[0], indices[0]):
        if idx < 0 or idx >= len(metadata):
            continue
        item = metadata[idx]
        if category_filter and item.get("metadata", {}).get("category") != category_filter:
            continue
        results.append({
            "text": item["text"],
            "category": item.get("metadata", {}).get("category", "general"),
            "score": float(score),
        })
        if len(results) >= k:
            break

    return results


PROMPT_ARCHITECT_SYSTEM_PROMPT = """You are VidCraft's Expert Diffusion Prompt Architect & Master Cinematographer.
Your job is to transform a simple user prompt into an extraordinary, award-winning scene brief optimized for modern diffusion models (FLUX.1, SDXL, Leonardo Phoenix).

Guidelines for Enhanced Prompt:
1. Core Subject & Action: Specific anatomical micro-details, genuine emotion, posture, clothing textures, materials.
2. Setting & Environment: Spatial depth, background layering, architectural/environmental context, physical atmosphere (dust, moisture, haze, particles).
3. Lighting & Optics: Concrete lighting setup (e.g., golden hour rim light, soft volumetric godrays, 3200K tungsten bounce) and camera equipment (e.g., 50mm f/1.4 lens, 35mm film grain, Arri Alexa, shallow depth of field).
4. Do NOT use buzzword soup (avoid "4k, 8k, trending on artstation, octane render"). Instead, describe the physical optics and scene reality.
5. Draw stylistic composition and aesthetic cues from the retrieved community exemplars provided.

Output valid JSON matching this schema:
{
  "enhanced_prompt": "<vivid 60-120 word photographic/cinematic description>",
  "negative_prompt": "<negative prompt tokens tailored to prevent blur, plastic skin, deformities>",
  "lighting": "<short description of lighting>",
  "camera": "<lens, aperture, shot type>"
}
"""


REF_PROMPT_ARCHITECT_SYSTEM_PROMPT = """You are VidCraft's Expert Reference-Conditioned Diffusion Prompt Architect.
Your task is to place a SPECIFIC, PRE-EXISTING SUBJECT from a reference image into a NEW SCENE or ACTION described by the user.

STRICT INVARIANCE RULES:
1. LOCKED SUBJECT: The provided `subject_anchor` is an immutable ground truth. You MUST keep this exact subject at the front of the prompt. Do NOT change its model, color, costume, facial traits, or distinctive features.
2. NEW CONTEXT: Transform the environment, lighting, weather, or action strictly as requested by the user prompt.
3. OPTICS & LIGHTING: Ground the new setting using professional cinematography optics (e.g. 35mm / 85mm prime lens, shallow depth of field, volumetric rim lighting, ambient reflections) drawing from the community exemplars.
4. COHESION: Ensure the locked subject seamlessly integrates with the new environment's physical reflections, cast shadows, and color temperature.

Output valid JSON matching this schema:
{
  "enhanced_prompt": "<[Locked Subject Anchor], in [New Setting/Action], [Lighting & Atmosphere], [Camera Optics]>",
  "negative_prompt": "<tokens to prevent subject distortion, extra limbs, low resolution, blur>",
  "lighting": "<description of new lighting interacting with the subject>",
  "camera": "<lens, aperture, perspective>"
}
"""


def expand_ref_prompt(
    prompt: str,
    ref_analysis: dict,
    style: str = None,
    style_tokens: list[str] = None,
    strength: float = 0.75,
) -> dict:
    """Takes a reference image analysis and user prompt, fusing them with locked subject anchoring."""
    subject_anchor = ref_analysis.get("subject_anchor", "primary subject from reference image")
    materials = ref_analysis.get("materials_colors", "")

    # Retrieve exemplars for the requested new setting/action
    search_query = f"{prompt} {style or ''}"
    exemplars = search_exemplars(search_query, k=3)
    exemplars_text = "\n".join([f"- Exemplar {i+1}: {e['text']}" for i, e in enumerate(exemplars)])

    user_message = f"""LOCKED SUBJECT ANCHOR (MUST BE PRESERVED VERBATIM):
"{subject_anchor}"
Materials & Surface Finishes: {materials}

USER REQUESTED TRANSFORMATION:
"{prompt}"
Style / Aesthetic: {style or 'Cinematic'}
Extra Style Tags: {', '.join(style_tokens or [])}

Top-Rated Diffusion Exemplars for the New Setting:
{exemplars_text if exemplars_text else "(None)"}

Synthesize the reference-anchored prompt now:"""

    try:
        response = complete_json(
            system=REF_PROMPT_ARCHITECT_SYSTEM_PROMPT,
            user=user_message,
            temperature=0.25,
        )
        return {
            "original_prompt": prompt,
            "subject_anchor": subject_anchor,
            "enhanced_prompt": response.get("enhanced_prompt", f"{subject_anchor}, {prompt}"),
            "negative_prompt": response.get("negative_prompt", "ugly, deformed, blurry, distorted subject, bad anatomy"),
            "lighting": response.get("lighting", "cinematic lighting"),
            "camera": response.get("camera", "35mm prime lens"),
            "exemplars_used": [e["text"] for e in exemplars],
            "method": "ref_anchored_architect",
        }
    except Exception as exc:
        logger.warning("Ref Prompt Architect failed (%s), using deterministic anchor merge.", exc)
        return {
            "original_prompt": prompt,
            "subject_anchor": subject_anchor,
            "enhanced_prompt": f"{subject_anchor}, {prompt}, cinematic lighting, sharp focus, 35mm photo",
            "negative_prompt": "ugly, deformed, blurry, low quality",
            "lighting": "cinematic lighting",
            "camera": "35mm lens",
            "exemplars_used": [e["text"] for e in exemplars],
            "method": "ref_deterministic_fallback",
        }


def expand_prompt(prompt: str, style: str = None, style_tokens: list[str] = None) -> dict:
    """Takes a user prompt and uses RAG exemplar retrieval + Groq LLM to synthesize an enhanced prompt."""
    search_query = prompt
    if style:
        search_query = f"{style} style: {prompt}"
    if style_tokens:
        search_query += f" ({', '.join(style_tokens)})"

    # 1. RAG retrieval from 12k Midjourney/Diffusion corpus
    exemplars = search_exemplars(search_query, k=3)
    exemplars_text = "\n".join([f"- Exemplar {i+1}: {e['text']}" for i, e in enumerate(exemplars)])

    user_message = f"""User Request: "{prompt}"
Desired Style / Tone: {style or 'Photorealistic Cinematic'}
Additional Style Tags: {', '.join(style_tokens or [])}

Top-Rated Diffusion Exemplars for this concept:
{exemplars_text if exemplars_text else "(No exemplars available)"}

Generate the JSON prompt expansion now:"""

    try:
        response = complete_json(
            system=PROMPT_ARCHITECT_SYSTEM_PROMPT,
            user=user_message,
            temperature=0.35,
        )
        return {
            "original_prompt": prompt,
            "enhanced_prompt": response.get("enhanced_prompt", prompt),
            "negative_prompt": response.get("negative_prompt", "ugly, deformed, blurry, low quality, bad anatomy"),
            "lighting": response.get("lighting", "natural cinematic lighting"),
            "camera": response.get("camera", "50mm f/1.8 lens"),
            "exemplars_used": [e["text"] for e in exemplars],
            "method": "rag_llm_architect",
        }
    except Exception as exc:
        logger.warning("Prompt Architect LLM generation failed (%s); returning exemplar-enhanced fallback.", exc)
        # Graceful fallback: pick top exemplar style or structured enhancement
        fallback_prompt = prompt
        if exemplars:
            fallback_prompt = f"{prompt}, in the style of: {exemplars[0]['text'][:100]}"
        return {
            "original_prompt": prompt,
            "enhanced_prompt": fallback_prompt,
            "negative_prompt": "ugly, deformed, blurry, low resolution, bad hands",
            "lighting": "cinematic",
            "camera": "35mm photo",
            "exemplars_used": [e["text"] for e in exemplars],
            "method": "exemplar_fallback",
        }

