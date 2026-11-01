from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

import base64

from analyzer import EmptyPromptError, score_prompt
from narration import NarratorOutputError, beat_timeline, synthesize, write_narration
from narration.tts import BEAT_PADDING_SECONDS, DEFAULT_VOICE, SILENT_BEAT_SECONDS, SpeechSynthesisError
from clarification import build_brief, generate_questions
from critic import CriticConfigError, CriticEvaluationError, evaluate_frame
from llm import GroqConfigError
from orchestrator import (
    CinematographerOutputError,
    ScreenwriterOutputError,
    generate_storyboard,
)

app = FastAPI(title="VidCraft AI Microservice")


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-service"}


class AnalyzeRequest(BaseModel):
    prompt: str = Field(..., min_length=1)


class AnalyzeResponse(BaseModel):
    overall_score: int
    dimensions: dict[str, int]
    flags: list[str]
    suggestions: list[str]


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest):
    try:
        return score_prompt(request.prompt)
    except EmptyPromptError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


class ClarifyQuestionsRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    flags: list[str] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)
    # Optional so an older caller that sends only flags keeps working; when
    # present it sharpens the question budget for prompts that are mediocre
    # across every dimension rather than broken in one (ADR-031).
    overall_score: int | None = Field(default=None, ge=0, le=100)


class ClarifyQuestionsResponse(BaseModel):
    questions: list[str]


@app.post("/clarify/questions", response_model=ClarifyQuestionsResponse)
def clarify_questions(request: ClarifyQuestionsRequest):
    try:
        questions = generate_questions(
            request.prompt, request.flags, request.suggestions, request.overall_score
        )
        return {"questions": questions}
    except GroqConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


class ClarifyResolveRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    questions: list[str] = Field(default_factory=list)
    answers: list[str] = Field(default_factory=list)


class ClarifyResolveResponse(BaseModel):
    brief: dict
    clarified_prompt: str


@app.post("/clarify/resolve", response_model=ClarifyResolveResponse)
def clarify_resolve(request: ClarifyResolveRequest):
    try:
        return build_brief(request.prompt, request.questions, request.answers)
    except GroqConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


class StoryboardRequest(BaseModel):
    clarified_prompt: str = Field(..., min_length=1)


class StoryboardResponse(BaseModel):
    storyboard_id: str
    world_state: dict
    shots: list[dict]


@app.post("/storyboard/generate", response_model=StoryboardResponse)
def storyboard_generate(request: StoryboardRequest):
    try:
        return generate_storyboard(request.clarified_prompt)
    except GroqConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except (ScreenwriterOutputError, CinematographerOutputError) as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


class NarrationRequest(BaseModel):
    shots: list[dict] = Field(..., min_length=1)
    world_state: dict = Field(default_factory=dict)
    voice: str | None = None


class NarrationResponse(BaseModel):
    shots: list[dict]
    total_duration_s: float


@app.post("/narration/script", response_model=NarrationResponse)
def narration_script(request: NarrationRequest):
    """FR-10 (ADR-032): write the beat script, speak it, and time the result.

    Returns each shot with its beats — every beat carrying the MEASURED
    duration of its own narration and the audio as base64 — plus the shot
    ``duration_s`` the video must adopt for the voice to stay in sync. The
    caller writes the audio to disk and renders against these durations; it
    must not recompute them, for the same reason ADR-028 exported one shot
    filter instead of letting a second copy drift.

    Synthesis failures are per-beat and non-fatal: that beat falls back to a
    silent slot of the same shape, so one dead line costs its voiceover and
    not the whole video.
    """
    try:
        narrated = write_narration(request.shots, request.world_state)
    except NarratorOutputError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except GroqConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    voice = request.voice or DEFAULT_VOICE
    for shot in narrated:
        for beat in shot["beats"]:
            if not beat["narration"]:
                beat.update({"duration_s": SILENT_BEAT_SECONDS, "audio_base64": None})
                continue
            try:
                spoken = synthesize(beat["narration"], voice=voice)
            except (SpeechSynthesisError, ValueError) as exc:
                beat.update(
                    {
                        "duration_s": SILENT_BEAT_SECONDS,
                        "audio_base64": None,
                        "narration_error": str(exc),
                    }
                )
                continue
            beat.update(
                {
                    "duration_s": spoken["duration_s"] + BEAT_PADDING_SECONDS,
                    "audio_base64": base64.b64encode(spoken["audio"]).decode("ascii"),
                    "voice": spoken["voice"],
                }
            )

    timeline = beat_timeline(narrated)
    return {
        "shots": timeline,
        "total_duration_s": round(sum(s["duration_s"] for s in timeline), 3),
    }


class CriticEvaluateRequest(BaseModel):
    image_base64: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)


class CriticEvaluateResponse(BaseModel):
    passed: bool
    reason: str


@app.post("/critic/evaluate", response_model=CriticEvaluateResponse)
def critic_evaluate(request: CriticEvaluateRequest):
    try:
        return evaluate_frame(request.image_base64, request.description)
    except CriticConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except CriticEvaluationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


# --- Reels & Shorts Studio Endpoints ---
from reels import process_reels_pipeline, render_single_reel


class ReelsProcessRequest(BaseModel):
    video_path: str = Field(..., min_length=1)
    aspect_ratio: str = Field(default="9:16")
    duration_mode: str = Field(default="auto")
    target_count: int | None = Field(default=None)
    time_range: list[float] | None = Field(default=None)
    layout_mode: str = Field(default="blur")
    subtitle_style: str = Field(default="hormozi")
    subtitle_position: str = Field(default="bottom")
    font_size_choice: str = Field(default="standard")
    trim_silence: bool = Field(default=False)
    bgm_preset: str = Field(default="none")
    auto_render_first: bool = False
    output_dir: str | None = None


@app.post("/reels/process")
def reels_process(request: ReelsProcessRequest):
    try:
        t_range = (request.time_range[0], request.time_range[1]) if request.time_range and len(request.time_range) == 2 else None
        return process_reels_pipeline(
            video_path=request.video_path,
            aspect_ratio=request.aspect_ratio,
            duration_mode=request.duration_mode,
            target_count=request.target_count,
            time_range=t_range,
            layout_mode=request.layout_mode,
            subtitle_style=request.subtitle_style,
            subtitle_position=request.subtitle_position,
            font_size_choice=request.font_size_choice,
            trim_silence=request.trim_silence,
            bgm_preset=request.bgm_preset,
            auto_render_first=request.auto_render_first,
            output_dir=request.output_dir,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


class ReelsRenderRequest(BaseModel):
    video_path: str = Field(..., min_length=1)
    start_time: float = Field(..., ge=0)
    end_time: float = Field(..., gt=0)
    words: list[dict] = Field(default_factory=list)
    output_dir: str | None = None
    aspect_ratio: str = Field(default="9:16")
    layout_mode: str = Field(default="blur")
    subtitle_style: str = Field(default="hormozi")
    subtitle_position: str = Field(default="bottom")
    font_size_choice: str = Field(default="standard")
    trim_silence: bool = Field(default=False)
    bgm_preset: str = Field(default="none")


@app.post("/reels/render")
def reels_render(request: ReelsRenderRequest):
    try:
        return render_single_reel(
            video_path=request.video_path,
            start_time=request.start_time,
            end_time=request.end_time,
            words=request.words,
            output_dir=request.output_dir,
            aspect_ratio=request.aspect_ratio,
            layout_mode=request.layout_mode,
            subtitle_style=request.subtitle_style,
            subtitle_position=request.subtitle_position,
            font_size_choice=request.font_size_choice,
            trim_silence=request.trim_silence,
            bgm_preset=request.bgm_preset,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


class CaptionsTranscribeRequest(BaseModel):
    video_path: str = Field(..., min_length=1)
    language: str | None = None


@app.post("/captions/transcribe")
def captions_transcribe(request: CaptionsTranscribeRequest):
    try:
        from reels.transcriber import transcribe_video_audio
        return transcribe_video_audio(request.video_path, language=request.language)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# --- Presentation Maker Endpoints ---
from presentation import generate_presentation_deck, create_pptx_deck


class PresentationGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=1)
    target_slides: int = Field(default=5, ge=2, le=15)
    theme_key: str = Field(default="cyberpunk_dark")
    master_template: str = Field(default="auto")
    audience: str = Field(default="general")
    tone: str = Field(default="visionary")


@app.post("/presentation/generate")
def presentation_generate(request: PresentationGenerateRequest):
    try:
        return generate_presentation_deck(
            topic=request.topic,
            target_slides=request.target_slides,
            theme_key=request.theme_key,
            master_template=request.master_template,
            audience=request.audience,
            tone=request.tone,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


class PresentationExportPptxRequest(BaseModel):
    deck: dict = Field(...)
    output_filename: str | None = None


@app.post("/presentation/export-pptx")
def presentation_export_pptx(request: PresentationExportPptxRequest):
    try:
        import os
        deck_id = request.deck.get("deck_id", "deck")
        filename = request.output_filename or f"{deck_id}.pptx"
        output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "generated", "presentations"))
        os.makedirs(output_dir, exist_ok=True)
        file_path = os.path.join(output_dir, filename)

        saved_path = create_pptx_deck(request.deck, output_path=file_path)
        return {
            "status": "success",
            "file_path": saved_path,
            "filename": filename,
            "download_url": f"/media/presentations/{filename}",
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


class PresentationNarrateRequest(BaseModel):
    text: str = Field(..., min_length=1)
    voice: str = Field(default=DEFAULT_VOICE)


@app.post("/presentation/narrate")
def presentation_narrate(request: PresentationNarrateRequest):
    try:
        spoken = synthesize(request.text, voice=request.voice)
        audio_b64 = base64.b64encode(spoken["audio"]).decode("ascii")
        return {
            "duration_s": spoken["duration_s"] + BEAT_PADDING_SECONDS,
            "audio_base64": audio_b64,
            "voice": spoken["voice"],
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


class PresentationImportPptxRequest(BaseModel):
    template_name: str | None = None
    file_path: str | None = None


@app.post("/presentation/import-pptx")
def presentation_import_pptx(request: PresentationImportPptxRequest):
    try:
        from presentation.pptx_importer import convert_pptx_to_polotno
        import os

        target_file = request.file_path
        if not target_file and request.template_name:
            target_file = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "templates", "pptx", f"{request.template_name}.pptx")
            )

        if not target_file or not os.path.exists(target_file):
            raise HTTPException(status_code=404, detail=f"PPTX file not found: {target_file}")

        polotno_data = convert_pptx_to_polotno(target_file)
        return {
            "status": "success",
            "template": request.template_name,
            "polotno": polotno_data,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


class ExpandPromptRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    style: str | None = None
    style_tokens: list[str] = Field(default_factory=list)


@app.post("/images/expand-prompt")
def expand_image_prompt(request: ExpandPromptRequest):
    try:
        from prompt_architect import expand_prompt
        return expand_prompt(
            prompt=request.prompt,
            style=request.style,
            style_tokens=request.style_tokens,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


class AnalyzeRefRequest(BaseModel):
    ref_image: str = Field(..., min_length=1)


@app.post("/images/analyze-ref")
def analyze_ref_image(request: AnalyzeRefRequest):
    try:
        from ref_analyzer import analyze_reference_image
        return analyze_reference_image(request.ref_image)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


class ExpandRefPromptRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    ref_analysis: dict = Field(..., description="Anchors returned by /images/analyze-ref")
    style: str | None = None
    style_tokens: list[str] = Field(default_factory=list)
    strength: float = 0.75


@app.post("/images/expand-ref-prompt")
def expand_ref_prompt_endpoint(request: ExpandRefPromptRequest):
    try:
        from prompt_architect import expand_ref_prompt
        return expand_ref_prompt(
            prompt=request.prompt,
            ref_analysis=request.ref_analysis,
            style=request.style,
            style_tokens=request.style_tokens,
            strength=request.strength,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc







