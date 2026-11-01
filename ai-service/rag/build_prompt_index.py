"""Build and persist the 12,000+ Prompt Exemplar Vector Index for Prompt Architect.

Loads the curated prompts_corpus.json, embeds them with all-MiniLM-L6-v2 in batches,
and saves the FAISS index to rag/data/prompt_index.faiss + rag/data/prompt_index.meta.json.
"""

import json
import os
import sys
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import numpy as np
import faiss

from config import EMBEDDING_DIM
from rag.embedder import get_model

CORPUS_PATH = os.path.join(os.path.dirname(__file__), "corpus", "prompts_corpus.json")
OUTPUT_BASE = os.path.join(os.path.dirname(__file__), "data", "prompt_index")

def build_prompt_index(batch_size: int = 128):
    if not os.path.exists(CORPUS_PATH):
        raise FileNotFoundError(f"Corpus not found at {CORPUS_PATH}")

    print(f"Loading prompts from {CORPUS_PATH}...")
    with open(CORPUS_PATH, "r", encoding="utf-8") as f:
        items = json.load(f)

    print(f"Loaded {len(items)} prompt items.")
    texts = [item["text"] for item in items]

    print("Loading embedding model (all-MiniLM-L6-v2)...")
    model = get_model()

    start_time = time.time()
    print(f"Encoding {len(texts)} prompts (batch_size={batch_size})...")
    embeddings = model.encode(
        texts,
        batch_size=batch_size,
        show_progress_bar=True,
        normalize_embeddings=True,
        convert_to_numpy=True
    )
    elapsed = time.time() - start_time
    print(f"Embedding completed in {elapsed:.1f}s ({len(texts)/elapsed:.1f} prompts/sec)")

    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(np.asarray(embeddings, dtype="float32"))

    os.makedirs(os.path.dirname(OUTPUT_BASE), exist_ok=True)
    faiss_path = f"{OUTPUT_BASE}.faiss"
    meta_path = f"{OUTPUT_BASE}.meta.json"

    print(f"Saving FAISS index to {faiss_path}...")
    faiss.write_index(index, faiss_path)

    print(f"Saving metadata sidecar to {meta_path}...")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(items, f)

    print(f"Successfully built prompt index with {index.ntotal} vectors ({dim}-dim)!")
    print(f"File size: {os.path.getsize(faiss_path) // 1024} KB")

if __name__ == "__main__":
    build_prompt_index()
