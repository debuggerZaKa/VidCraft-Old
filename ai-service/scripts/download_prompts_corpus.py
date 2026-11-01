import io
import json
import os
import re
import urllib.request
import pyarrow.parquet as pq

GUSTAVOSTA_URL = "https://huggingface.co/datasets/Gustavosta/Stable-Diffusion-Prompts/resolve/refs%2Fconvert%2Fparquet/default/train/0000.parquet"
MIDJOURNEY_URL = "https://huggingface.co/datasets/wtcherr/midjourney-prompts/resolve/refs%2Fconvert%2Fparquet/default/train/0000.parquet"

TARGET_COUNT = 12000

def clean_prompt(raw: str) -> str:
    if not raw or not isinstance(raw, str):
        return ""
    # Strip URLs
    text = re.sub(r"https?://\S+", "", raw)
    # Strip Discord / Midjourney CLI flags e.g. --ar 16:9, --v 5, --s 750, --q 2, --uplight, --test
    text = re.sub(r"--[a-zA-Z0-9_:-]+(\s+[a-zA-Z0-9_:-]+)?", "", text)
    # Strip <...> tags
    text = re.sub(r"<[^>]+>", "", text)
    # Strip mention handles @username
    text = re.sub(r"@[a-zA-Z0-9_]+", "", text)
    # Normalize punctuation and whitespace
    text = text.replace("\n", " ").replace("\r", " ")
    text = re.sub(r"\s+", " ", text).strip(" \t\r\n\",'.-")
    return text

def categorize(prompt: str) -> str:
    p = prompt.lower()
    if any(k in p for k in ["portrait", "face", "eyes", "skin", "headshot", "woman", "man", "girl", "boy"]):
        return "portrait"
    elif any(k in p for k in ["cinematic", "film still", "movie", "cinemascope", "anamorphic", "kodak", "35mm"]):
        return "cinematic"
    elif any(k in p for k in ["cyberpunk", "sci-fi", "futuristic", "neon", "mecha", "robot", "cyborg"]):
        return "cyberpunk"
    elif any(k in p for k in ["anime", "manga", "studio ghibli", "makoto shinkai", "cel-shaded", "pixiv"]):
        return "anime"
    elif any(k in p for k in ["3d", "octane render", "unreal engine", "cgi", "blender", "isometric", "render"]):
        return "digital_3d"
    elif any(k in p for k in ["landscape", "mountain", "forest", "ocean", "nature", "sky", "sunset", "wildlife", "space"]):
        return "landscape"
    elif any(k in p for k in ["fantasy", "dragon", "magic", "mythic", "celestial", "ethereal", "gothic"]):
        return "fantasy"
    elif any(k in p for k in ["car", "automotive", "architecture", "interior", "fashion", "product", "commercial"]):
        return "commercial"
    return "artistic"

def download_data():
    headers = {"User-Agent": "Mozilla/5.0"}
    all_prompts = set()

    # 1. Fetch Gustavosta Stable Diffusion Prompts (80k high quality prompts)
    print("Fetching Gustavosta/Stable-Diffusion-Prompts...")
    try:
        req = urllib.request.Request(GUSTAVOSTA_URL, headers=headers)
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = resp.read()
            table = pq.read_table(io.BytesIO(data))
            for p in table["Prompt"]:
                cleaned = clean_prompt(str(p))
                if 50 <= len(cleaned) <= 380 and not cleaned.isdigit():
                    all_prompts.add(cleaned)
        print(f"Loaded {len(all_prompts)} prompts from Gustavosta.")
    except Exception as e:
        print(f"Error fetching Gustavosta: {e}")

    # 2. Fetch Midjourney Prompts
    print("Fetching wtcherr/midjourney-prompts...")
    try:
        req = urllib.request.Request(MIDJOURNEY_URL, headers=headers)
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = resp.read()
            table = pq.read_table(io.BytesIO(data))
            for p in table["text"]:
                cleaned = clean_prompt(str(p))
                if 50 <= len(cleaned) <= 380 and not cleaned.isdigit():
                    all_prompts.add(cleaned)
        print(f"Total unique prompts combined: {len(all_prompts)}")
    except Exception as e:
        print(f"Error fetching Midjourney: {e}")

    # Balance categories
    categorized = {}
    for p in all_prompts:
        cat = categorize(p)
        categorized.setdefault(cat, []).append(p)

    print("Distribution across categories:")
    for cat, items in categorized.items():
        print(f"  {cat:<12}: {len(items)}")

    # Sample balanced dataset up to TARGET_COUNT
    per_cat_limit = TARGET_COUNT // len(categorized) + 100
    curated_items = []
    idx = 0

    for cat, items in categorized.items():
        selected = items[:per_cat_limit]
        for p in selected:
            idx += 1
            curated_items.append({
                "text": p,
                "metadata": {
                    "id": f"prompt-{idx:05d}",
                    "category": cat,
                    "length": len(p),
                    "tags": [cat, "diffusion", "exemplar"],
                }
            })
            if len(curated_items) >= TARGET_COUNT:
                break
        if len(curated_items) >= TARGET_COUNT:
            break

    print(f"Selected {len(curated_items)} balanced exemplar prompts.")

    # Save to ai-service/rag/corpus/prompts_corpus.json
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "rag", "corpus"))
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "prompts_corpus.json")

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(curated_items, f, indent=2)

    print(f"Successfully wrote {len(curated_items)} prompts to {out_file} ({os.path.getsize(out_file) // 1024} KB)!")

if __name__ == "__main__":
    download_data()

