"""Computer Vision Face Tracking & Podcast Split-Screen Layout Engine.

Detects single or dual speakers across video frames to enable:
1. 'face_track': Dynamically crops and centers the vertical frame on the active speaker.
2. 'split_screen': Stacks two podcast/interview participants vertically (Top / Bottom).
3. 'blur': Ambient blurred background canvas (Default).
4. 'direct_crop': Direct center crop.
"""

import logging
import os
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np

logger = logging.getLogger("reels.face_tracker")

CASCADE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "haarcascade_frontalface_default.xml")


def _get_cascade() -> Optional[cv2.CascadeClassifier]:
    if not os.path.exists(CASCADE_PATH):
        logger.warning("Haar cascade file missing at: %s", CASCADE_PATH)
        return None
    classifier = cv2.CascadeClassifier(CASCADE_PATH)
    return classifier if not classifier.empty() else None


def analyze_speaker_faces(
    video_path: str,
    start_time: float,
    duration: float,
    num_samples: int = 6,
) -> Dict[str, Any]:
    """Sample frames across [start_time, start_time + duration] to detect speaker positions."""
    default_info = {
        "status": "fallback",
        "has_faces": False,
        "mode": "none",
        "video_w": 1920,
        "video_h": 1080,
        "center_x": 0.5,
        "left_speaker_x": 0.3,
        "right_speaker_x": 0.7,
    }

    if not os.path.exists(video_path):
        return default_info

    classifier = _get_cascade()
    if not classifier:
        return default_info

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return default_info

    video_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 1920)
    video_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 1080)
    default_info["video_w"] = video_w
    default_info["video_h"] = video_h

    sample_times = [
        start_time + duration * factor
        for factor in np.linspace(0.15, 0.85, num_samples)
    ]

    left_faces: List[Tuple[int, int, int, int]] = []
    right_faces: List[Tuple[int, int, int, int]] = []
    all_faces: List[Tuple[int, int, int, int]] = []

    mid_x = video_w / 2.0

    for t in sample_times:
        cap.set(cv2.CAP_PROP_POS_MSEC, max(0.0, t * 1000.0))
        ret, frame = cap.read()
        if not ret or frame is None:
            continue

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        # Fast downscale for speed
        scale_factor = 0.5
        small = cv2.resize(gray, (0, 0), fx=scale_factor, fy=scale_factor)

        detected = classifier.detectMultiScale(small, scaleFactor=1.15, minNeighbors=4, minSize=(30, 30))

        for (x, y, w, h) in detected:
            # Scale back up
            rx = int(x / scale_factor)
            ry = int(y / scale_factor)
            rw = int(w / scale_factor)
            rh = int(h / scale_factor)
            box = (rx, ry, rw, rh)
            all_faces.append(box)

            cx = rx + rw / 2.0
            if cx < mid_x:
                left_faces.append(box)
            else:
                right_faces.append(box)

    cap.release()

    if not all_faces:
        logger.info("No faces detected in video clip; using default center framing.")
        return default_info

    default_info["has_faces"] = True

    # Check if this is a dual-speaker layout (faces detected consistently on both left and right)
    if len(left_faces) >= 2 and len(right_faces) >= 2:
        default_info["mode"] = "two_speaker"
        left_cx = np.median([x + w / 2.0 for (x, y, w, h) in left_faces])
        right_cx = np.median([x + w / 2.0 for (x, y, w, h) in right_faces])
        default_info["left_speaker_x"] = float(left_cx / video_w)
        default_info["right_speaker_x"] = float(right_cx / video_w)
        default_info["center_x"] = float(left_cx / video_w)  # initial fallback

        # Detect dynamic camera cuts for active speaker
        default_info["speaker_cuts"] = detect_active_speaker_cuts(
            video_path=video_path,
            start_time=start_time,
            duration=duration,
            face_info=default_info,
        )
    else:
        default_info["mode"] = "single"
        all_cx = [x + w / 2.0 for (x, y, w, h) in all_faces]
        median_x = float(np.median(all_cx))
        default_info["center_x"] = float(median_x / video_w)

    logger.info(
        "Face analysis complete: mode=%s, primary_x=%.2f, left_x=%.2f, right_x=%.2f, cuts=%s",
        default_info["mode"],
        default_info["center_x"],
        default_info["left_speaker_x"],
        default_info["right_speaker_x"],
        len(default_info.get("speaker_cuts", [])),
    )
    return default_info


def detect_active_speaker_cuts(
    video_path: str,
    start_time: float,
    duration: float,
    face_info: Dict[str, Any],
    sample_interval: float = 0.5,
    min_shot_duration: float = 2.0,
) -> List[Tuple[float, float, str]]:
    """Analyze speaker mouth/face motion across time to generate dynamic camera cuts.

    Returns:
        List of (seg_start_rel, seg_end_rel, speaker_id) where speaker_id is 'left' or 'right'.
    """
    if face_info.get("mode") != "two_speaker" or not os.path.exists(video_path):
        return [(0.0, duration, "center")]

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return [(0.0, duration, "left")]

    video_w = int(face_info.get("video_w", 1280))
    video_h = int(face_info.get("video_h", 720))

    # Calculate bounding zones for Left Speaker and Right Speaker
    lx = int(face_info.get("left_speaker_x", 0.3) * video_w)
    rx = int(face_info.get("right_speaker_x", 0.7) * video_w)
    box_w = int(video_w * 0.16)
    box_h = int(video_h * 0.25)
    y_min = int(video_h * 0.25)
    y_max = min(video_h, y_min + box_h)

    l_x1 = max(0, lx - box_w // 2)
    l_x2 = min(video_w, lx + box_w // 2)
    r_x1 = max(0, rx - box_w // 2)
    r_x2 = min(video_w, rx + box_w // 2)

    sample_ts = np.arange(start_time, start_time + duration, sample_interval)
    raw_decisions: List[Tuple[float, str]] = []
    prev_frame = None

    for t in sample_ts:
        cap.set(cv2.CAP_PROP_POS_MSEC, max(0.0, float(t) * 1000.0))
        ret, frame = cap.read()
        if not ret or frame is None:
            continue
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        if prev_frame is not None:
            diff = cv2.absdiff(gray, prev_frame)
            left_mot = float(np.mean(diff[y_min:y_max, l_x1:l_x2]))
            right_mot = float(np.mean(diff[y_min:y_max, r_x1:r_x2]))

            # Bias slightly to previous speaker if difference is marginal to prevent flutter
            if abs(left_mot - right_mot) < 2.5 and raw_decisions:
                active = raw_decisions[-1][1]
            else:
                active = "left" if left_mot >= right_mot else "right"

            rel_t = round(float(t - start_time), 2)
            raw_decisions.append((rel_t, active))
        prev_frame = gray
    cap.release()

    if not raw_decisions:
        return [(0.0, duration, "left")]

    # Hysteresis smoothing: hold camera on speaker for at least min_shot_duration
    current_spk = raw_decisions[0][1]
    last_switch_t = 0.0
    segments: List[Tuple[float, float, str]] = []
    seg_start = 0.0

    for rel_t, spk in raw_decisions:
        if spk != current_spk and (rel_t - last_switch_t) >= min_shot_duration:
            segments.append((round(seg_start, 2), round(rel_t, 2), current_spk))
            current_spk = spk
            seg_start = rel_t
            last_switch_t = rel_t

    segments.append((round(seg_start, 2), round(duration, 2), current_spk))
    return segments


def _build_crop_expression(cuts: List[Tuple[float, float, str]], x_left: int, x_right: int) -> str:
    """Build a nested FFmpeg if(lt(t, ...)) expression for dynamic camera cuts."""
    if not cuts or len(cuts) == 1:
        spk = cuts[0][2] if cuts else "left"
        return str(x_left if spk == "left" else x_right)

    last_val = x_left if cuts[-1][2] == "left" else x_right
    expr = str(last_val)

    for seg_start, seg_end, spk in reversed(cuts[:-1]):
        val = x_left if spk == "left" else x_right
        expr = f"if(lt(t,{seg_end}),{val},{expr})"

    return expr


def build_video_layout_filter(
    layout_mode: str,
    aspect_ratio: str,
    target_w: int,
    target_h: int,
    face_info: Dict[str, Any],
) -> str:
    """Construct the optimal FFmpeg filter string for the chosen layout mode.

    Modes:
    - 'blur': Fast ambient blurred background + sharp centered video (Default)
    - 'face_track': Dynamically cuts camera to the active speaker who is currently talking
    - 'split_screen': Stacks two speakers vertically (Top / Bottom)
    - 'direct_crop': Center crop to aspect ratio
    """
    video_w = face_info.get("video_w", 1920)
    video_h = face_info.get("video_h", 1080)

    # 1. Landscape (16:9) — preserve original aspect ratio cleanly
    if aspect_ratio == "16:9":
        return f"[0:v]scale={target_w}:{target_h}:force_original_aspect_ratio=decrease,pad={target_w}:{target_h}:(ow-iw)/2:(oh-ih)/2"

    # 2. Split-Screen (Podcast 2-Speaker Stack) - only relevant for vertical/portrait
    if layout_mode == "split_screen" and aspect_ratio in ("9:16", "4:5"):
        half_h = target_h // 2
        crop_w = int(video_h * (target_w / half_h))
        crop_w = min(crop_w, video_w // 2)

        lx = int(face_info.get("left_speaker_x", 0.3) * video_w - crop_w / 2.0)
        rx = int(face_info.get("right_speaker_x", 0.7) * video_w - crop_w / 2.0)

        lx = max(0, min(video_w - crop_w, lx))
        rx = max(0, min(video_w - crop_w, rx))

        # Top speaker + Bottom speaker stacked vertically
        filter_str = (
            f"[0:v]crop={crop_w}:{video_h}:{lx}:0,scale={target_w}:{half_h}[top];"
            f"[0:v]crop={crop_w}:{video_h}:{rx}:0,scale={target_w}:{half_h}[bot];"
            f"[top][bot]vstack"
        )
        return filter_str

    # 3. Smart Face Tracking (Dynamic camera cut to active speaker)
    if layout_mode == "face_track" and aspect_ratio in ("9:16", "4:5", "1:1"):
        crop_w = int(video_h * (target_w / target_h))
        crop_w = min(crop_w, video_w)

        # Multi-speaker dynamic camera switching:
        if face_info.get("mode") == "two_speaker" and face_info.get("speaker_cuts"):
            cuts = face_info["speaker_cuts"]
            lx = int(face_info.get("left_speaker_x", 0.3) * video_w - crop_w / 2.0)
            rx = int(face_info.get("right_speaker_x", 0.7) * video_w - crop_w / 2.0)
            lx = max(0, min(video_w - crop_w, lx))
            rx = max(0, min(video_w - crop_w, rx))

            expr = _build_crop_expression(cuts, lx, rx)
            logger.info("Built dynamic camera switching crop expression: %s", expr)
            filter_str = f"[0:v]crop={crop_w}:{video_h}:'{expr}':0,scale={target_w}:{target_h}"
            return filter_str

        # Single speaker mode:
        cx = int(face_info.get("center_x", 0.5) * video_w - crop_w / 2.0)
        cx = max(0, min(video_w - crop_w, cx))

        filter_str = f"[0:v]crop={crop_w}:{video_h}:{cx}:0,scale={target_w}:{target_h}"
        return filter_str

    # 4. Direct Center Crop — dynamically compute based on input video frame
    if layout_mode == "direct_crop":
        filter_str = f"[0:v]crop='min(in_w,in_h*{target_w}/{target_h})':'min(in_h,in_w*{target_h}/{target_w})',scale={target_w}:{target_h}"
        return filter_str

    # 5. Fast Ambient Blurred Canvas (Default for 9:16, 1:1, 4:5)
    bg_w, bg_h = max(160, target_w // 4), max(160, target_h // 4)
    filter_str = (
        f"[0:v]scale={bg_w}:{bg_h}:force_original_aspect_ratio=increase,crop={bg_w}:{bg_h},boxblur=8:2,scale={target_w}:{target_h}[bg];"
        f"[0:v]scale={target_w}:-2[fg];"
        f"[bg][fg]overlay=(W-w)/2:(H-h)/2"
    )
    return filter_str
