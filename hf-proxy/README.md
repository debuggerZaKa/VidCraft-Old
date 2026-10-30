# HF Proxy Service

This small FastAPI service proxies image generation requests to Hugging Face.

## Setup

```bash
cd hf-proxy
python -m venv .venv
. .venv/Scripts/activate
pip install -r requirements.txt
```

## Environment

Add your token to the repo root `.env`:

```
HF_API_TOKEN=your_token_here
```

Optional model overrides:

```
HF_MODEL_SDXL_TURBO=stabilityai/sdxl-turbo
HF_MODEL_KANDINSKY_3=kandinsky-community/kandinsky-3
HF_MODEL_FLUX_PRO=black-forest-labs/FLUX.1-schnell

# Ref Image: VLM caption then text-to-image
HF_REF_CAPTION_MODEL=Qwen/Qwen2.5-VL-3B-Instruct
HF_REF_CAPTION_PROVIDER=auto
HF_MODEL_IMG2IMG=black-forest-labs/FLUX.1-schnell
HF_IMG2IMG_PROVIDER=auto
```

Ref Image flow uses a vision LLM (chat + image) to describe the reference,
then generates with text-to-image. Classic BLIP caption models are no longer
served by Hugging Face Inference Providers.

## Run

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The `app.main:app` import path is supported for compatibility with the launch
command used by the client and local dev scripts.

## Client config

Set the client to use this proxy for image generation:

```
VITE_PY_API_BASE_URL=http://localhost:8000
```
