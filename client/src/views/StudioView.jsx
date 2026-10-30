import {
  BarChart3,
  Download,
  Frame,
  Gem,
  Minus,
  Plus,
  Ticket,
  X,
} from "lucide-react";
import {
  ASPECT_RATIOS,
  GEN_MODELS,
  RESOLUTIONS,
  STUDIO_PREVIEWS,
} from "../config/vidcraft";
import { resolveImageSize } from "../utils/imageSize";
import { RemotionScriptPlayer } from "../components/RemotionScriptPlayer";

export const StudioView = ({
  prompt,
  setPrompt,
  mediaType,
  path,
  generating,
  genPct,
  latestImage,
  latestVideo,
  remotionPlan,
  remotionGeneration,
  remotionWarning,
  genError,
  handleGenerate,
  selectedTemplate,
  onClearTemplate,
  genModel,
  setGenModel,
  resolution,
  setResolution,
  aspectRatio,
  setAspectRatio,
  batchSize,
  setBatchSize,
}) => {
  const isImage = mediaType === "image";
  const isRemotion = path === "remotion" && !isImage;
  const previews = STUDIO_PREVIEWS[isImage ? "image" : "video"];
  const models = GEN_MODELS.filter((model) => model.mediaType === mediaType);
  const activeModel =
    models.find((model) => model.id === genModel) || models[0];
  const modelLabel = isRemotion
    ? "VidCraft Remotion Engine"
    : activeModel?.label || (isImage ? "VidCraft" : "VidCraft");
  const sizePreview = resolveImageSize(resolution, aspectRatio);

  const handleDownload = () => {
    if (isImage && latestImage) {
      const link = document.createElement("a");
      link.href = latestImage;
      link.download = `vidcraft-${aspectRatio.replace(":", "x")}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }
    if (!isImage && latestVideo) {
      const link = document.createElement("a");
      link.href = latestVideo;
      link.download = `vidcraft-video-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  return (
    <div className="vc-studio">
      <div className="vc-studio-stage">
        {(!isRemotion || (!remotionGeneration && !remotionPlan)) && (
          <div className="vc-float-row">
            {previews.map((item, index) => (
              <div
                key={`${item.src}-${index}`}
                className="vc-float-card"
                style={{ transform: `rotate(${item.rotate}deg)` }}
              >
                <img src={item.src} alt="" loading="lazy" />
              </div>
            ))}
          </div>
        )}

        <div className="vc-studio-hero">
          <div className="vc-studio-kicker">
            {isRemotion ? "Turn your script into" : "Generate with"}
          </div>
          <div className="vc-studio-model">{modelLabel}</div>
          <p className="vc-studio-sub">
            {isRemotion
              ? "Paste a full video script — VidCraft writes brand-new Remotion code on the spot and we preview it."
              : "Describe a scene, character, mood, or style — and watch it come to life with VidCraft."}
          </p>
        </div>

        {isRemotion && (generating || remotionGeneration || remotionPlan || genError) && (
          <div className="vc-studio-result vc-remotion-result">
            <div className="vc-result-head">
              <div className="vc-result-title">
                {remotionGeneration?.meta?.title || remotionPlan?.title || "Generated Remotion code"}
                {remotionGeneration?.meta?.durationInFrames
                  ? ` · ${(remotionGeneration.meta.durationInFrames / 30).toFixed(0)}s`
                  : remotionPlan?.durationInFrames
                    ? ` · ${(remotionPlan.durationInFrames / 30).toFixed(0)}s`
                    : ""}
              </div>
            </div>
            {generating && (
              <>
                <div className="vc-progress">
                  <div
                    className="vc-progress-bar"
                    style={{ width: `${genPct || 6}%` }}
                  />
                </div>
                <div className="vc-progress-label">
                  VidCraft is writing new Remotion code {genPct ? `${genPct}%` : ""}
                </div>
              </>
            )}
            {genError && <div className="vc-error">{genError}</div>}
            {remotionWarning && !genError && (
              <div className="vc-warn">{remotionWarning}</div>
            )}
            {remotionGeneration && !generating && (
              <RemotionScriptPlayer
                generationId={remotionGeneration.id}
                meta={remotionGeneration.meta}
              />
            )}
          </div>
        )}

        {isImage && (generating || latestImage || genError) && (
          <div className="vc-studio-result">
            <div className="vc-result-head">
              <div className="vc-result-title">Generation output</div>
              {latestImage && !generating && (
                <button className="vc-btn-download" onClick={handleDownload} type="button">
                  <Download size={14} strokeWidth={1.8} />
                  Download
                </button>
              )}
            </div>
            {generating && (
              <>
                <div className="vc-progress">
                  <div
                    className="vc-progress-bar"
                    style={{ width: `${genPct || 6}%` }}
                  />
                </div>
                <div className="vc-progress-label">
                  Generating {genPct ? `${genPct}%` : ""} · {sizePreview.width}×
                  {sizePreview.height}
                </div>
              </>
            )}
            {genError && <div className="vc-error">{genError}</div>}
            {latestImage && (
              <div className="vc-result-media">
                <img className="vc-result-image" src={latestImage} alt="Generated output" />
              </div>
            )}
          </div>
        )}

        {!isImage && !isRemotion && (generating || latestVideo || genError) && (
          <div className="vc-studio-result">
            <div className="vc-result-head">
              <div className="vc-result-title">
                {generating ? "Rendering video" : "Generated video · ~2s"}
              </div>
              {latestVideo && !generating && (
                <button className="vc-btn-download" onClick={handleDownload} type="button">
                  <Download size={14} strokeWidth={1.8} />
                  Download MP4
                </button>
              )}
            </div>
            {generating && (
              <>
                <div className="vc-progress">
                  <div className="vc-progress-bar" style={{ width: `${genPct || 6}%` }} />
                </div>
                <div className="vc-progress-label">
                  Generating with VidCraft {genPct ? `${genPct}%` : ""} · this can take 1–3 min
                </div>
              </>
            )}
            {genError && <div className="vc-error">{genError}</div>}
            {latestVideo && !generating && (
              <div className="vc-result-media">
                <video
                  className="vc-result-video"
                  src={latestVideo}
                  controls
                  autoPlay
                  loop
                  playsInline
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="vc-dock">
        <div className="vc-dock-inner">
          {selectedTemplate && (
            <div className="vc-template-chip">
              <span>Template: {selectedTemplate.label}</span>
              <button
                className="vc-chip-clear"
                onClick={onClearTemplate}
                aria-label="Clear template"
              >
                <X size={14} strokeWidth={1.8} />
              </button>
            </div>
          )}

          <div className="vc-dock-input-row">
            <button className="vc-attach-btn" type="button" aria-label="Add reference">
              <Plus size={18} strokeWidth={1.8} />
            </button>
            <textarea
              className="vc-prompt"
              rows={2}
              placeholder={
                isRemotion
                  ? "Write a video script, e.g. Explain how a stack works in 3 steps..."
                  : "Describe the scene you imagine."
              }
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleGenerate();
                }
              }}
            />
          </div>

          <div className="vc-dock-controls">
            <div className="vc-control-group">
              {!isRemotion && (
                <>
                  <label className="vc-control">
                    <BarChart3 size={13} strokeWidth={1.8} />
                    <select
                      value={genModel}
                      onChange={(event) => setGenModel(event.target.value)}
                      aria-label="Model"
                    >
                      {models.map((model) => {
                        const locked = model.selectable === false;
                        return (
                          <option key={model.id} value={model.id} disabled={locked}>
                            {locked ? `${model.label} (unavailable)` : model.label}
                          </option>
                        );
                      })}
                    </select>
                  </label>

                  <label className="vc-control">
                    <Gem size={13} strokeWidth={1.8} />
                    <select
                      value={resolution}
                      onChange={(event) => setResolution(event.target.value)}
                      aria-label="Resolution"
                    >
                      {RESOLUTIONS.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="vc-control">
                    <Frame size={13} strokeWidth={1.8} />
                    <select
                      value={aspectRatio}
                      onChange={(event) => setAspectRatio(event.target.value)}
                      aria-label="Aspect ratio"
                    >
                      {ASPECT_RATIOS.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>

                  {isImage && (
                    <span className="vc-size-hint">
                      {sizePreview.width}×{sizePreview.height}
                    </span>
                  )}

                  <div className="vc-batch">
                    <button
                      type="button"
                      aria-label="Decrease batch"
                      onClick={() => setBatchSize((n) => Math.max(1, n - 1))}
                    >
                      <Minus size={12} strokeWidth={2} />
                    </button>
                    <span>
                      {batchSize}/{4}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase batch"
                      onClick={() => setBatchSize((n) => Math.min(4, n + 1))}
                    >
                      <Plus size={12} strokeWidth={2} />
                    </button>
                  </div>
                </>
              )}

              {isRemotion && (
                <span className="vc-size-hint">VidCraft → new Remotion TSX</span>
              )}
            </div>

            <button
              className="vc-btn-primary"
              onClick={handleGenerate}
              disabled={!prompt.trim() || generating}
            >
              {generating ? (
                <>
                  <span className="vc-spinner" />
                  Generating {genPct ? `${genPct}%` : ""}
                </>
              ) : (
                <>
                  {isImage ? "Generate with VidCraft" : "Generate"}
                  <Ticket size={15} strokeWidth={1.8} />
                  {isRemotion || isImage ? "" : batchSize}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
