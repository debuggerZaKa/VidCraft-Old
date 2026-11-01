"""Audio extraction and timestamped transcription using FFmpeg and Groq Whisper."""

import json
import logging
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Any, Dict, List

from config import GROQ_API_KEY
from groq import Groq

logger = logging.getLogger("reels.transcriber")


def extract_audio(video_path: str, output_audio_path: str | None = None) -> str:
    """Extract 16kHz mono MP3 audio from a video using FFmpeg."""
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found at: {video_path}")

    if not output_audio_path:
        temp_dir = tempfile.gettempdir()
        base_name = Path(video_path).stem
        output_audio_path = os.path.join(temp_dir, f"{base_name}_audio.mp3")

    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        video_path,
        "-vn",
        "-acodec",
        "libmp3lame",
        "-ar",
        "16000",
        "-ac",
        "1",
        "-b:a",
        "64k",
        output_audio_path,
    ]

    logger.info("Extracting audio: %s -> %s", video_path, output_audio_path)
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode != 0:
        err = result.stderr.decode("utf-8", errors="ignore")
        logger.error("FFmpeg audio extraction failed: %s", err)
        raise RuntimeError(f"FFmpeg audio extraction failed: {err}")

    return output_audio_path


def _mock_transcription(audio_path: str, language: str | None = None) -> Dict[str, Any]:
    """Fallback transcription for demo/testing when no API key is available or during offline mode."""
    logger.warning("Using simulated transcription fallback for language=%s.", language)

    if language and (language.lower() in ("ur", "urdu") or "ur" in language.lower()):
        text = (
            "کامیابی کا اصل راز مستقل مزاجی اور محنت میں پوشیدہ ہے۔ "
            "جب انسان اپنے مقصد پر فوکس کرتا ہے تو راہیں آسان ہو جاتی ہیں۔ "
            "کبھی بھی اپنے خوابوں پر سمجھوتہ مت کریں اور ہر دن ایک نیا قدم اٹھائیں۔"
        )
        segments = [
            {
                "id": 0,
                "start": 0.0,
                "end": 6.8,
                "text": "کامیابی کا اصل راز مستقل مزاجی اور محنت میں پوشیدہ ہے۔",
            },
            {
                "id": 1,
                "start": 6.9,
                "end": 14.5,
                "text": "جب انسان اپنے مقصد پر فوکس کرتا ہے تو راہیں آسان ہو جاتی ہیں۔",
            },
            {
                "id": 2,
                "start": 14.6,
                "end": 22.0,
                "text": "کبھی بھی اپنے خوابوں پر سمجھوتہ مت کریں اور ہر دن ایک نیا قدم اٹھائیں۔",
            },
        ]
        detected_lang = "ur"
    else:
        text = (
            "Welcome everyone to this session. Today we are diving into the secrets of creating "
            "impactful content. Most people think motivation is what gets you started, but the brutal truth "
            "is that discipline eats motivation for breakfast. If you wait until you feel ready, you will wait "
            "forever. Focus on daily repetition and consistency, because that is where real mastery happens."
        )
        segments = [
            {
                "id": 0,
                "start": 0.0,
                "end": 8.5,
                "text": "Welcome everyone to this session. Today we are diving into the secrets of creating impactful content.",
            },
            {
                "id": 1,
                "start": 8.6,
                "end": 20.2,
                "text": "Most people think motivation is what gets you started, but the brutal truth is that discipline eats motivation for breakfast.",
            },
            {
                "id": 2,
                "start": 20.3,
                "end": 32.0,
                "text": "If you wait until you feel ready, you will wait forever. Focus on daily repetition and consistency, because that is where real mastery happens.",
            },
        ]
        detected_lang = "en"

    words = []
    current_time = 0.5
    for w in text.split():
        duration = max(0.28, len(w) * 0.07)
        words.append(
            {
                "word": w,
                "start": round(current_time, 2),
                "end": round(current_time + duration, 2),
            }
        )
        current_time += duration + 0.08

    return {
        "text": text,
        "language": detected_lang,
        "words": words,
        "segments": segments,
        "is_simulated": True,
    }


def transcribe_video_audio(video_path: str, language: str | None = None) -> Dict[str, Any]:
    """Extract audio from video/audio file and transcribe it with word-level timestamps using Groq Whisper."""
    audio_path = extract_audio(video_path)

    if not GROQ_API_KEY or GROQ_API_KEY == "your_groq_api_key_here":
        logger.warning("GROQ_API_KEY is not set. Falling back to mock transcription.")
        return _mock_transcription(audio_path, language=language)

    try:
        client = Groq(api_key=GROQ_API_KEY)
        with open(audio_path, "rb") as audio_file:
            logger.info("Sending audio to Groq Whisper API (whisper-large-v3, language=%s)...", language)
            create_kwargs: Dict[str, Any] = {
                "file": (os.path.basename(audio_path), audio_file.read()),
                "model": "whisper-large-v3",
                "response_format": "verbose_json",
                "timestamp_granularities": ["word", "segment"],
            }
            if language and language not in ("auto", "all"):
                create_kwargs["language"] = language.lower()

            transcription = client.audio.transcriptions.create(**create_kwargs)

        # Groq returns TranscriptionVerbose object or dict
        if hasattr(transcription, "model_dump"):
            dumped = transcription.model_dump()
        elif hasattr(transcription, "to_dict"):
            dumped = transcription.to_dict()
        else:
            dumped = json.loads(json.dumps(transcription, default=lambda o: getattr(o, "__dict__", str(o))))

        words = dumped.get("words", [])
        segments = dumped.get("segments", [])
        full_text = dumped.get("text", "")
        detected_language = dumped.get("language", language or "en")

        return {
            "text": full_text,
            "language": detected_language,
            "words": words,
            "segments": segments,
            "audio_path": audio_path,
            "is_simulated": False,
        }
    except Exception as exc:
        logger.error("Groq Whisper API call failed: %s. Falling back to mock.", exc)
        fallback = _mock_transcription(audio_path, language=language)
        fallback["error_message"] = str(exc)
        return fallback
