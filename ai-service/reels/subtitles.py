"""Subtitle & Transcript generation with multiple aesthetic presets, positions, and export formats (.ass, .srt, .vtt, .txt)."""

import os
import tempfile
from typing import Any, Dict, List

ASPECT_CONFIGS = {
    "9:16": {"res_x": 1080, "res_y": 1920, "font_size": 56, "margin_v_bottom": 480, "margin_v_middle": 960, "margin_v_top": 1500},
    "1:1": {"res_x": 1080, "res_y": 1080, "font_size": 46, "margin_v_bottom": 160, "margin_v_middle": 540, "margin_v_top": 860},
    "16:9": {"res_x": 1920, "res_y": 1080, "font_size": 50, "margin_v_bottom": 110, "margin_v_middle": 540, "margin_v_top": 880},
    "4:5": {"res_x": 1080, "res_y": 1350, "font_size": 52, "margin_v_bottom": 240, "margin_v_middle": 675, "margin_v_top": 1050},
}

STYLE_PRESETS = {
    "hormozi": {
        "name": "Hormozi Gold",
        "font": "Arial Black",
        "active_color": "&H0000FFFF",  # Bright Yellow
        "inactive_color": "&H00FFFFFF",  # White
        "outline_color": "&H00000000",
        "outline": 6,
        "shadow": 3,
        "active_scale": 108,
    },
    "beast": {
        "name": "MrBeast Neon",
        "font": "Impact",
        "active_color": "&H0000FF00",  # Neon Green
        "inactive_color": "&H00FFFFFF",
        "outline_color": "&H00000000",
        "outline": 7,
        "shadow": 4,
        "active_scale": 112,
    },
    "minimal": {
        "name": "Clean Minimalist",
        "font": "Arial",
        "active_color": "&H00FFFFFF",  # White
        "inactive_color": "&H00B0B0B0",  # Muted Gray
        "outline_color": "&H80000000",
        "outline": 2,
        "shadow": 1,
        "active_scale": 104,
    },
    "cyberpunk": {
        "name": "Cyberpunk Neon",
        "font": "Trebuchet MS",
        "active_color": "&H00FFFF00",  # Electric Cyan
        "inactive_color": "&H00FF00FF",  # Neon Magenta
        "outline_color": "&H00000000",
        "outline": 5,
        "shadow": 3,
        "active_scale": 110,
    },
    "urdu_nastaliq": {
        "name": "Urdu Royal Nastaliq",
        "font": "Noto Nastaliq Urdu",
        "active_color": "&H0000D7FF",  # Shimmering Gold
        "inactive_color": "&H00F0E6D2",  # Warm Cream
        "outline_color": "&H00050B1A",  # Deep outline
        "outline": 5,
        "shadow": 3,
        "active_scale": 108,
    },
    "urdu_gulzar": {
        "name": "Urdu Gulzar Cyan",
        "font": "Gulzar",
        "active_color": "&H00FFFF00",  # Vivid Cyan
        "inactive_color": "&H00FFFFFF",  # Pure White
        "outline_color": "&H00000000",
        "outline": 6,
        "shadow": 4,
        "active_scale": 110,
    },
}

SIZE_MULTIPLIERS = {
    "compact": 0.8,
    "standard": 1.0,
    "large": 1.25,
}


def _format_ass_time(seconds: float) -> str:
    """Format seconds into ASS timestamp format: H:MM:SS.cs."""
    if seconds < 0:
        seconds = 0.0
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    centis = int(round((seconds - int(seconds)) * 100))
    if centis >= 100:
        secs += 1
        centis = 0
    return f"{hrs}:{mins:02d}:{secs:02d}.{centis:02d}"


def _format_srt_time(seconds: float) -> str:
    """Format seconds into SRT timestamp format: HH:MM:SS,mmm."""
    if seconds < 0:
        seconds = 0.0
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int(round((seconds - int(seconds)) * 1000))
    if millis >= 1000:
        secs += 1
        millis = 0
    return f"{hrs:02d}:{mins:02d}:{secs:02d},{millis:03d}"


def generate_ass_subtitles(
    words: List[Dict[str, Any]],
    clip_start: float,
    clip_end: float,
    output_path: str | None = None,
    words_per_batch: int = 3,
    aspect_ratio: str = "9:16",
    style_preset: str = "hormozi",
    position: str = "bottom",
    font_size_choice: str = "standard",
) -> str:
    """Generate an ASS subtitle file with dynamic theme presets, font sizing, and positioning."""
    cfg = ASPECT_CONFIGS.get(aspect_ratio, ASPECT_CONFIGS["9:16"])
    theme = STYLE_PRESETS.get(style_preset, STYLE_PRESETS["hormozi"])
    size_mult = SIZE_MULTIPLIERS.get(font_size_choice, 1.0)

    final_font_size = int(cfg["font_size"] * size_mult)

    # Determine vertical margin based on position choice
    if position == "middle":
        margin_v = cfg["margin_v_middle"]
    elif position == "top":
        margin_v = cfg["margin_v_top"]
    else:
        margin_v = cfg["margin_v_bottom"]

    if not output_path:
        temp_dir = tempfile.gettempdir()
        output_path = os.path.join(temp_dir, f"sub_{int(clip_start)}_{int(clip_end)}.ass")

    clip_words = []
    for w in words:
        w_start = float(w.get("start", 0.0))
        w_end = float(w.get("end", 0.0))
        text = w.get("word", "").strip().upper()
        if not text:
            continue
        if w_end > clip_start and w_start < clip_end:
            rel_start = max(0.0, w_start - clip_start)
            rel_end = min(clip_end - clip_start, w_end - clip_start)
            clip_words.append({"word": text, "start": rel_start, "end": rel_end})

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {cfg['res_x']}
PlayResY: {cfg['res_y']}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: ReelStyle,{theme['font']},{final_font_size},{theme['inactive_color']},{theme['active_color']},{theme['outline_color']},&H80000000,-1,0,0,0,100,100,0,0,1,{theme['outline']},{theme['shadow']},2,40,40,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    events: List[str] = []

    for i in range(0, len(clip_words), words_per_batch):
        batch = clip_words[i : i + words_per_batch]
        if not batch:
            continue

        for active_idx, active_word in enumerate(batch):
            start_str = _format_ass_time(active_word["start"])
            end_str = _format_ass_time(active_word["end"])

            formatted_words = []
            for idx, item in enumerate(batch):
                if idx == active_idx:
                    scale = theme["active_scale"]
                    formatted_words.append(f"{{\\c{theme['active_color']}\\fscx{scale}\\fscy{scale}}}{item['word']}{{\\r}}")
                else:
                    formatted_words.append(f"{{\\c{theme['inactive_color']}}}{item['word']}")

            line_text = " ".join(formatted_words)
            event_line = f"Dialogue: 0,{start_str},{end_str},ReelStyle,,0,0,0,,{line_text}"
            events.append(event_line)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(header)
        f.write("\n".join(events))
        f.write("\n")

    return output_path


def generate_srt_subtitles(words: List[Dict[str, Any]], clip_start: float, clip_end: float) -> str:
    """Generate standard SRT subtitle text for downloading."""
    clip_words = []
    for w in words:
        w_start = float(w.get("start", 0.0))
        w_end = float(w.get("end", 0.0))
        text = w.get("word", "").strip()
        if text and w_end > clip_start and w_start < clip_end:
            clip_words.append({"word": text, "start": max(0.0, w_start - clip_start), "end": min(clip_end - clip_start, w_end - clip_start)})

    lines = []
    counter = 1
    batch_size = 5
    for i in range(0, len(clip_words), batch_size):
        batch = clip_words[i : i + batch_size]
        if not batch:
            continue
        start_str = _format_srt_time(batch[0]["start"])
        end_str = _format_srt_time(batch[-1]["end"])
        text = " ".join(b["word"] for b in batch)
        lines.append(f"{counter}\n{start_str} --> {end_str}\n{text}\n")
        counter += 1

    return "\n".join(lines)


def generate_txt_transcript(words: List[Dict[str, Any]], clip_start: float, clip_end: float) -> str:
    """Generate plain text transcript for downloading."""
    clip_words = [
        w.get("word", "").strip()
        for w in words
        if float(w.get("end", 0.0)) > clip_start and float(w.get("start", 0.0)) < clip_end
    ]
    return " ".join(w for w in clip_words if w)
