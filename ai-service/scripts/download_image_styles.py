import json
import os
import re
import urllib.request

URLS = [
    ("fooocus", "https://raw.githubusercontent.com/lllyasviel/Fooocus/main/sdxl_styles/sdxl_styles_fooocus.json"),
    ("sai", "https://raw.githubusercontent.com/lllyasviel/Fooocus/main/sdxl_styles/sdxl_styles_sai.json"),
    ("mre", "https://raw.githubusercontent.com/lllyasviel/Fooocus/main/sdxl_styles/sdxl_styles_mre.json"),
    ("twri", "https://raw.githubusercontent.com/lllyasviel/Fooocus/main/sdxl_styles/sdxl_styles_twri.json"),
    ("diva", "https://raw.githubusercontent.com/lllyasviel/Fooocus/main/sdxl_styles/sdxl_styles_diva.json"),
]

MASTER_NEGATIVE = (
    "ugly, deformed, disfigured, poor anatomy, bad hands, missing fingers, "
    "extra limbs, fused fingers, distorted face, blurry, low quality, low resolution, "
    "jpeg artifacts, watermark, signature, username, text, oversaturated, amateur"
)

CATEGORIES = [
    {"id": "photographic", "label": "Photorealistic & Portrait"},
    {"id": "cinematic", "label": "Cinematic & Film"},
    {"id": "anime", "label": "Anime & Manga"},
    {"id": "digital_3d", "label": "3D Render & CGI"},
    {"id": "cyberpunk", "label": "Cyberpunk & Sci-Fi"},
    {"id": "fantasy", "label": "Fantasy & Mythic"},
    {"id": "artistic", "label": "Artistic & Painting"},
    {"id": "commercial", "label": "Commercial & Advertising"},
    {"id": "noir", "label": "Noir & Moody"},
    {"id": "vintage", "label": "Vintage & Retro"},
]


def slugify(text: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", text.strip().lower())
    return cleaned.strip("-")


def categorize(name: str, prompt: str) -> str:
    lower = f"{name} {prompt}".lower()
    if any(k in lower for k in ["anime", "manga", "comic", "cartoon", "kawaii", "chibi", "line art"]):
        return "anime"
    if any(k in lower for k in ["cyberpunk", "neonpunk", "futuristic", "sci-fi", "synthwave", "vaporwave"]):
        return "cyberpunk"
    if any(k in lower for k in ["cinematic", "film", "movie", "cinemascope", "bokeh", "anamorphic", "35mm", "kodak", "imax"]):
        return "cinematic"
    if any(k in lower for k in ["3d", "octane", "render", "unreal", "blender", "sculpture", "isometric", "clay", "origami", "low-poly"]):
        return "digital_3d"
    if any(k in lower for k in ["photo", "portrait", "camera", "dslr", "analog", "telephoto", "macro", "polaroid", "headshot"]):
        return "photographic"
    if any(k in lower for k in ["ads", "advertising", "product", "commercial", "corporate", "editorial", "food photography", "automotive", "real estate"]):
        return "commercial"
    if any(k in lower for k in ["fantasy", "mythic", "ethereal", "celestial", "magic", "dark fantasy", "gothic", "surreal"]):
        return "fantasy"
    if any(k in lower for k in ["noir", "dark dream", "gloomy", "monochrome", "black and white", "shadow", "silhouette"]):
        return "noir"
    if any(k in lower for k in ["vintage", "retro", "pixel", "8-bit", "16-bit", "nostalgia"]):
        return "vintage"
    return "artistic"


def extract_tags(name: str, category: str, prompt: str) -> list[str]:
    tags = {category}
    words = re.findall(r"[a-zA-Z]{3,}", f"{name} {prompt}".lower())
    stopwords = {"the", "and", "for", "with", "from", "prompt", "style", "sai", "mre", "diva", "twri", "art"}
    for w in words:
        if w not in stopwords and len(w) < 15:
            tags.add(w)
    return sorted(list(tags))[:10]


def main():
    print("Downloading Fooocus SDXL styles...")
    headers = {"User-Agent": "Mozilla/5.0"}
    raw_entries = []

    for source_name, url in URLS:
        print(f"Fetching {source_name} from {url}...")
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print(f"  Loaded {len(data)} entries.")
            for item in data:
                item["source"] = source_name
                raw_entries.append(item)

    print(f"Total downloaded styles: {len(raw_entries)}")

    curated_styles = []
    rag_corpus_items = []
    seen_ids = set()

    for item in raw_entries:
        name = item.get("name", "").strip()
        raw_prompt = item.get("prompt", "").strip()
        raw_neg = item.get("negative_prompt", "").strip()
        source = item.get("source", "")

        # Handle the few styles that only define negative prompts
        if not raw_prompt:
            if "Enhance" in name:
                raw_prompt = "{prompt}, masterpiece, 8k resolution, highly detailed, sharp focus, professional rendering"
            elif "Semi Realistic" in name:
                raw_prompt = "{prompt}, semi-realistic, detailed digital illustration, vibrant lighting, smooth shading"
            else:
                raw_prompt = "{prompt}, high quality, clean focus, detailed composition"

        if "{prompt}" not in raw_prompt:
            raw_prompt = f"{raw_prompt} {{prompt}}"

        category = categorize(name, raw_prompt)
        base_slug = slugify(name)
        style_id = base_slug
        if style_id in seen_ids:
            style_id = f"{style_id}-{source}"
        seen_ids.add(style_id)

        tags = extract_tags(name, category, raw_prompt)
        neg_prompt = raw_neg if raw_neg else MASTER_NEGATIVE

        # Clean cues for textual explanation
        prompt_cues = raw_prompt.replace("{prompt}", "").strip(" ,.")
        description = (
            f"{name} style ({category}): transforms prompts using cues like '{prompt_cues}'. "
            f"Ensures clean, artifact-free diffusion rendering with targeted negative prompts."
        )

        style_entry = {
            "id": style_id,
            "name": name,
            "category": category,
            "source": source,
            "prompt_template": raw_prompt,
            "negative_prompt": neg_prompt,
            "tags": tags,
            "description": description,
        }
        curated_styles.append(style_entry)

        # RAG corpus schema: {"text": str, "metadata": dict}
        rag_item = {
            "text": description,
            "metadata": {
                "id": f"style-{style_id}",
                "name": name,
                "category": category,
                "source": source,
                "prompt_template": raw_prompt,
                "negative_prompt": neg_prompt,
                "tags": tags,
            },
        }
        rag_corpus_items.append(rag_item)

    # Output paths
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    ai_corpus_path = os.path.join(base_dir, "ai-service", "rag", "corpus", "image_styles.json")
    backend_const_dir = os.path.join(base_dir, "backend", "src", "constants")
    backend_const_path = os.path.join(backend_const_dir, "imageStyles.json")

    os.makedirs(os.path.dirname(ai_corpus_path), exist_ok=True)
    os.makedirs(backend_const_dir, exist_ok=True)

    print(f"Writing {len(rag_corpus_items)} items to {ai_corpus_path}...")
    with open(ai_corpus_path, "w", encoding="utf-8") as f:
        json.dump(rag_corpus_items, f, indent=2)

    backend_payload = {
        "masterNegativePrompt": MASTER_NEGATIVE,
        "defaultStyle": "sai-photographic",
        "categories": CATEGORIES,
        "styles": curated_styles,
    }

    print(f"Writing {len(curated_styles)} styles to {backend_const_path}...")
    with open(backend_const_path, "w", encoding="utf-8") as f:
        json.dump(backend_payload, f, indent=2)

    print("Successfully built and saved both corpus files!")


if __name__ == "__main__":
    main()
