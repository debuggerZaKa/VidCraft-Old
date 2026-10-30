import { useEffect, useRef, useState } from "react";
import { Download, ImagePlus, Ticket, Upload, X, ZoomIn } from "lucide-react";
import { ASPECT_RATIOS, RESOLUTIONS } from "../config/vidcraft";
import { resolveImageSize } from "../utils/imageSize";

const MAX_REF_BYTES = 6 * 1024 * 1024;

const fileFromClipboard = (clipboardData) => {
  if (!clipboardData) return null;

  const items = clipboardData.items;
  if (items) {
    for (const item of items) {
      if (item.type?.startsWith("image/")) {
        return item.getAsFile();
      }
    }
  }

  const files = clipboardData.files;
  if (files?.length) {
    for (const file of files) {
      if (file.type?.startsWith("image/")) return file;
    }
  }

  return null;
};

export const RefStudioView = ({
  prompt,
  setPrompt,
  refImage,
  setRefImage,
  strength,
  setStrength,
  generating,
  genPct,
  latestImage,
  genError,
  handleGenerate,
  resolution,
  setResolution,
  aspectRatio,
  setAspectRatio,
}) => {
  const fileRef = useRef(null);
  const [lightbox, setLightbox] = useState(null);
  const sizePreview = resolveImageSize(resolution, aspectRatio);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return;
    }
    if (file.size > MAX_REF_BYTES) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setRefImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const onPaste = (event) => {
      const file = fileFromClipboard(event.clipboardData);
      if (!file) return;

      // Prefer image paste over inserting binary junk into the prompt
      event.preventDefault();
      handleFile(file);
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- paste while Ref studio is mounted
  }, [setRefImage]);

  useEffect(() => {
    if (!lightbox) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightbox]);

  const handleDownload = (src, kind = "ref") => {
    if (!src) return;
    const link = document.createElement("a");
    link.href = src;
    link.download = `vidcraft-${kind}-${aspectRatio.replace(":", "x")}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const canGenerate = Boolean(prompt.trim() && refImage && !generating);

  return (
    <div className="vc-studio vc-ref-studio">
      <div className="vc-studio-stage vc-ref-stage">
        <div className="vc-studio-hero">
          <div className="vc-studio-kicker">Generate with</div>
          <div className="vc-studio-model">VidCraft Ref</div>
          <p className="vc-studio-sub">
            Upload a reference image and describe what you want — VidCraft builds a new
            image guided by your ref.
          </p>
        </div>

        <div className="vc-ref-layout">
          <div className="vc-ref-panel">
            <div className="vc-ref-panel-head">
              <div className="vc-ref-panel-label">Reference</div>
              {refImage && (
                <div className="vc-ref-actions">
                  <button
                    className="vc-btn-ghost vc-ref-action"
                    type="button"
                    onClick={() => setLightbox({ src: refImage, title: "Reference" })}
                  >
                    <ZoomIn size={14} strokeWidth={1.8} />
                    View
                  </button>
                </div>
              )}
            </div>
            {refImage ? (
              <div className="vc-ref-preview-wrap">
                <button
                  type="button"
                  className="vc-ref-preview-hit"
                  onClick={() => setLightbox({ src: refImage, title: "Reference" })}
                  aria-label="View reference fullscreen"
                >
                  <img className="vc-ref-preview" src={refImage} alt="Reference" />
                </button>
                <button
                  className="vc-ref-clear"
                  type="button"
                  aria-label="Remove reference"
                  onClick={() => setRefImage(null)}
                >
                  <X size={14} strokeWidth={1.8} />
                </button>
              </div>
            ) : (
              <button
                className="vc-ref-drop"
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFile(e.dataTransfer.files?.[0]);
                }}
              >
                <Upload size={22} strokeWidth={1.7} />
                <span>Drop, click, or Ctrl+V to paste</span>
                <span className="vc-ref-drop-hint">PNG, JPG · up to 6MB</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              hidden
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {refImage && (
              <button
                className="vc-btn-ghost vc-ref-replace"
                type="button"
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus size={14} strokeWidth={1.8} />
                Replace reference
              </button>
            )}
          </div>

          <div className="vc-ref-panel">
            <div className="vc-ref-panel-head">
              <div className="vc-ref-panel-label">Result</div>
              {!generating && latestImage && (
                <div className="vc-ref-actions">
                  <button
                    className="vc-btn-ghost vc-ref-action"
                    type="button"
                    onClick={() => setLightbox({ src: latestImage, title: "Result" })}
                  >
                    <ZoomIn size={14} strokeWidth={1.8} />
                    View
                  </button>
                  <button
                    className="vc-btn-download vc-ref-action-dl"
                    type="button"
                    onClick={() => handleDownload(latestImage, "result")}
                  >
                    <Download size={14} strokeWidth={1.8} />
                    Download
                  </button>
                </div>
              )}
            </div>
            {generating && (
              <div className="vc-ref-result-empty">
                <div className="vc-progress">
                  <div className="vc-progress-bar" style={{ width: `${genPct || 6}%` }} />
                </div>
                <div className="vc-progress-label">
                  Generating with VidCraft Ref {genPct ? `${genPct}%` : ""} ·{" "}
                  {sizePreview.width}×{sizePreview.height}
                </div>
              </div>
            )}
            {!generating && genError && <div className="vc-error">{genError}</div>}
            {!generating && latestImage && (
              <div className="vc-ref-preview-wrap">
                <button
                  type="button"
                  className="vc-ref-preview-hit"
                  onClick={() => setLightbox({ src: latestImage, title: "Result" })}
                  aria-label="View result fullscreen"
                >
                  <img className="vc-ref-preview" src={latestImage} alt="Generated" />
                </button>
              </div>
            )}
            {!generating && !latestImage && !genError && (
              <div className="vc-ref-result-empty">Output appears here after generation.</div>
            )}
          </div>
        </div>
      </div>

      <div className="vc-dock">
        <div className="vc-dock-inner">
          <div className="vc-dock-input-row">
            <textarea
              className="vc-prompt"
              rows={2}
              placeholder="Describe how to transform the reference, e.g. Same pose, cyberpunk city at night…"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (canGenerate) handleGenerate();
                }
              }}
            />
          </div>

          <div className="vc-dock-controls">
            <div className="vc-control-group">
              <label className="vc-control">
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

              <label className="vc-control vc-strength-control" title="How strongly the prompt overrides the reference">
                <span className="vc-strength-label">Strength {Number(strength).toFixed(2)}</span>
                <input
                  type="range"
                  min="0.15"
                  max="0.95"
                  step="0.05"
                  value={strength}
                  onChange={(e) => setStrength(Number(e.target.value))}
                  aria-label="Prompt strength"
                />
              </label>

              <span className="vc-size-hint">
                {sizePreview.width}×{sizePreview.height}
              </span>
            </div>

            <button
              className="vc-btn-primary"
              onClick={handleGenerate}
              disabled={!canGenerate}
            >
              {generating ? (
                <>
                  <span className="vc-spinner" />
                  Generating {genPct ? `${genPct}%` : ""}
                </>
              ) : (
                <>
                  Generate with VidCraft
                  <Ticket size={15} strokeWidth={1.8} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {lightbox && (
        <div
          className="vc-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.title || "Image preview"}
          onClick={() => setLightbox(null)}
        >
          <div className="vc-lightbox-bar" onClick={(e) => e.stopPropagation()}>
            <span className="vc-lightbox-title">{lightbox.title || "Preview"}</span>
            <div className="vc-lightbox-actions">
              <button
                className="vc-btn-download"
                type="button"
                onClick={() =>
                  handleDownload(
                    lightbox.src,
                    lightbox.title === "Reference" ? "reference" : "result"
                  )
                }
              >
                <Download size={14} strokeWidth={1.8} />
                Download
              </button>
              <button
                className="vc-lightbox-close"
                type="button"
                aria-label="Close preview"
                onClick={() => setLightbox(null)}
              >
                <X size={16} strokeWidth={1.8} />
              </button>
            </div>
          </div>
          <img
            className="vc-lightbox-img"
            src={lightbox.src}
            alt={lightbox.title || "Preview"}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
