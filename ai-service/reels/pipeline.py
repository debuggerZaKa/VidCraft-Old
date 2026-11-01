"""End-to-end pipeline orchestrating transcription, intelligent topic segmentation, and multi-ratio reel rendering."""

import logging
import os
import uuid
from typing import Any, Dict, List, Optional, Tuple

from .clip_finder import find_viral_clips
from .subtitles import generate_ass_subtitles, generate_srt_subtitles, generate_txt_transcript
from .transcriber import transcribe_video_audio
from .video_processor import render_reel_video

logger = logging.getLogger("reels.pipeline")


def render_single_reel(
    video_path: str,
    start_time: float,
    end_time: float,
    words: Optional[List[Dict[str, Any]]] = None,
    output_dir: Optional[str] = None,
    aspect_ratio: str = "9:16",
    layout_mode: str = "blur",
    subtitle_style: str = "hormozi",
    subtitle_position: str = "bottom",
    font_size_choice: str = "standard",
    trim_silence: bool = False,
    bgm_preset: str = "none",
) -> Dict[str, Any]:
    """Render a single reel/clip with chosen layout (blur, face_track, split_screen), subtitle styling, and audio pacing."""
    if not output_dir:
        output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "generated", "reels")
    os.makedirs(output_dir, exist_ok=True)

    reel_id = uuid.uuid4().hex[:10]
    safe_ratio = aspect_ratio.replace(":", "x")
    reel_filename = f"reel_{safe_ratio}_{layout_mode}_{reel_id}.mp4"
    output_reel_path = os.path.join(output_dir, reel_filename)

    ass_path = None
    srt_content = ""
    txt_content = ""

    if words:
        try:
            ass_path = os.path.join(output_dir, f"sub_{reel_id}.ass")
            generate_ass_subtitles(
                words=words,
                clip_start=start_time,
                clip_end=end_time,
                output_path=ass_path,
                aspect_ratio=aspect_ratio,
                style_preset=subtitle_style,
                position=subtitle_position,
                font_size_choice=font_size_choice,
            )
            srt_content = generate_srt_subtitles(words, start_time, end_time)
            txt_content = generate_txt_transcript(words, start_time, end_time)
        except Exception as exc:
            logger.warning("Failed to generate subtitles: %s", exc)
            ass_path = None

    rendered_path = render_reel_video(
        input_video_path=video_path,
        start_time=start_time,
        end_time=end_time,
        output_reel_path=output_reel_path,
        ass_subtitle_path=ass_path,
        aspect_ratio=aspect_ratio,
        layout_mode=layout_mode,
        trim_silence=trim_silence,
        bgm_preset=bgm_preset,
    )

    return {
        "reel_id": reel_id,
        "filename": reel_filename,
        "video_path": rendered_path,
        "start_time": start_time,
        "end_time": end_time,
        "duration": round(end_time - start_time, 2),
        "aspect_ratio": aspect_ratio,
        "layout_mode": layout_mode,
        "subtitle_style": subtitle_style,
        "srt_content": srt_content,
        "txt_content": txt_content,
    }


def process_reels_pipeline(
    video_path: str,
    aspect_ratio: str = "9:16",
    duration_mode: str = "auto",
    target_count: Optional[int] = None,
    time_range: Optional[Tuple[float, float]] = None,
    layout_mode: str = "blur",
    subtitle_style: str = "hormozi",
    subtitle_position: str = "bottom",
    font_size_choice: str = "standard",
    trim_silence: bool = False,
    bgm_preset: str = "none",
    auto_render_first: bool = False,
    output_dir: Optional[str] = None,
) -> Dict[str, Any]:
    """Run full intelligent pipeline:

    1. Transcribe speech across the ENTIRE video.
    2. Analyze video themes and identify major topic segments with full dialogue completion.
    3. Return clips list instantly for user preview.
    """
    logger.info("Starting intelligent Reels pipeline for: %s (Ratio: %s, Layout: %s)", video_path, aspect_ratio, layout_mode)

    # 1. Transcribe
    transcription = transcribe_video_audio(video_path)
    full_text = transcription.get("text", "")
    segments = transcription.get("segments", [])
    words = transcription.get("words", [])

    # 2. Extract intelligent topic clips
    clips = find_viral_clips(
        segments=segments,
        full_text=full_text,
        target_count=target_count,
        duration_mode=duration_mode,
        time_range=time_range,
    )

    # Attach whole-video transcript exports
    full_srt = generate_srt_subtitles(words, 0.0, 999999.0) if words else ""
    full_txt = full_text

    return {
        "status": "success",
        "video_path": video_path,
        "aspect_ratio": aspect_ratio,
        "duration_mode": duration_mode,
        "layout_mode": layout_mode,
        "subtitle_style": subtitle_style,
        "transcription": {
            "text": full_text[:600] + ("..." if len(full_text) > 600 else ""),
            "word_count": len(words),
            "segment_count": len(segments),
            "is_simulated": transcription.get("is_simulated", False),
        },
        "full_srt": full_srt,
        "full_txt": full_txt,
        "words": words,
        "clips": clips,
    }
