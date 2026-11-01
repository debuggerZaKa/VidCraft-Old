"""Advanced Video Processing Engine using FFmpeg.

Supports:
- Aspect Ratios: 9:16, 1:1, 16:9, 4:5
- Layout Modes: 'blur' (Default), 'face_track' (CV Smart Crop), 'split_screen' (Podcast Stacked), 'direct_crop'
- Subtitles: Dynamic ASS burning with presets (Hormozi, MrBeast, Minimal, Cyberpunk)
- Audio Pacing: Optional dead air / silence trimming & subtle ambient BGM
"""

import logging
import os
import subprocess
from typing import Any, Dict, Optional

from .face_tracker import analyze_speaker_faces, build_video_layout_filter

logger = logging.getLogger("reels.video_processor")

ASPECT_DIMENSIONS = {
    "9:16": (1080, 1920),
    "1:1": (1080, 1080),
    "16:9": (1920, 1080),
    "4:5": (1080, 1350),
}


def _escape_filter_path(file_path: str) -> str:
    """Escape file path for FFmpeg filter arguments on Windows and POSIX."""
    abs_path = os.path.abspath(file_path).replace("\\", "/")
    abs_path = abs_path.replace(":", "\\:")
    abs_path = abs_path.replace("'", "'\\\\''")
    return abs_path


def render_reel_video(
    input_video_path: str,
    start_time: float,
    end_time: float,
    output_reel_path: str,
    ass_subtitle_path: Optional[str] = None,
    aspect_ratio: str = "9:16",
    layout_mode: str = "blur",
    trim_silence: bool = False,
    bgm_preset: str = "none",
) -> str:
    """Render reel with chosen aspect ratio, CV layout (blur/face_track/split_screen), and burned subtitles."""
    if not os.path.exists(input_video_path):
        raise FileNotFoundError(f"Source video not found: {input_video_path}")

    os.makedirs(os.path.dirname(os.path.abspath(output_reel_path)), exist_ok=True)
    duration = max(1.0, end_time - start_time)

    width, height = ASPECT_DIMENSIONS.get(aspect_ratio, ASPECT_DIMENSIONS["9:16"])

    # 1. Computer Vision Face Analysis (if face_track or split_screen selected)
    face_info: Dict[str, Any] = {}
    if layout_mode in ("face_track", "split_screen"):
        try:
            logger.info("Running Computer Vision face analysis for layout: %s", layout_mode)
            face_info = analyze_speaker_faces(input_video_path, start_time, duration)
        except Exception as exc:
            logger.warning("Face analysis failed; falling back to blur layout: %s", exc)
            layout_mode = "blur"

    # 2. Build Video Layout Filter
    base_filter = build_video_layout_filter(layout_mode, aspect_ratio, width, height, face_info)

    # 3. Audio Filters (Silence trimming & BGM)
    audio_filters = []
    if trim_silence:
        audio_filters.append("silenceremove=start_periods=1:stop_periods=-1:stop_duration=1.2:stop_threshold=-32dB")

    # Background music synthesization if requested
    extra_inputs = []
    if bgm_preset in ("lofi", "motivational", "tension"):
        # Procedural subtle ambient chords with auto-ducking volume (0.04 volume)
        freq = "220" if bgm_preset == "motivational" else ("174" if bgm_preset == "lofi" else "110")
        bgm_filter = f"aevalsrc=sin({freq}*2*PI*t)*0.025+sin({int(freq)*1.5}*2*PI*t)*0.015:s=44100:d={duration}"
        extra_inputs.extend(["-f", "lavfi", "-i", bgm_filter])

    # 4. First Attempt: With burned-in subtitles
    if ass_subtitle_path and os.path.exists(ass_subtitle_path):
        escaped_ass = _escape_filter_path(ass_subtitle_path)
        full_video_filter = f"{base_filter}[vbase];[vbase]ass='{escaped_ass}'[outv]"

        cmd = [
            "ffmpeg",
            "-y",
            "-ss",
            str(start_time),
            "-t",
            str(duration),
            "-i",
            input_video_path,
        ]

        if extra_inputs:
            cmd.extend(extra_inputs)
            # Mix primary speech with background audio
            full_audio_filter = "amix=inputs=2:duration=first:dropout_transition=2"
            if audio_filters:
                full_audio_filter = f"{audio_filters[0]},{full_audio_filter}"
            cmd.extend(["-filter_complex", f"{full_video_filter};[0:a][1:a]{full_audio_filter}[outa]"])
            cmd.extend(["-map", "[outv]", "-map", "[outa]"])
        else:
            if audio_filters:
                cmd.extend(["-filter_complex", full_video_filter, "-af", ",".join(audio_filters), "-map", "[outv]", "-map", "0:a?"])
            else:
                cmd.extend(["-filter_complex", full_video_filter, "-map", "[outv]", "-map", "0:a?"])

        cmd.extend([
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "23",
            "-c:a",
            "aac",
            "-b:a",
            "160k",
            output_reel_path,
        ])

        logger.info("Executing FFmpeg render (%s, %s): %s", aspect_ratio, layout_mode, output_reel_path)
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if result.returncode == 0:
            return output_reel_path

        err = result.stderr.decode("utf-8", errors="ignore")
        logger.warning("Burned subtitles failed: %s. Falling back to clean render.", err)

    # 5. Fallback: Clean render without subtitles
    cmd_fallback = [
        "ffmpeg",
        "-y",
        "-ss",
        str(start_time),
        "-t",
        str(duration),
        "-i",
        input_video_path,
        "-filter_complex",
        f"{base_filter}[outv]",
        "-map",
        "[outv]",
        "-map",
        "0:a?",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-c:a",
        "aac",
        "-b:a",
        "160k",
        output_reel_path,
    ]

    logger.info("Executing clean fallback render (%s, %s): %s", aspect_ratio, layout_mode, output_reel_path)
    result = subprocess.run(cmd_fallback, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode != 0:
        err = result.stderr.decode("utf-8", errors="ignore")
        logger.error("FFmpeg render failed: %s", err)
        raise RuntimeError(f"FFmpeg reel rendering failed: {err}")

    return output_reel_path
