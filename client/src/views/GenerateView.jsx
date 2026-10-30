import { COLORS, GEN_MODELS } from "../config/vidcraft";
import { RemotionPreview } from "../components/RemotionPreview";

export const GenerateView = ({
  ctType,
  setCtType,
  path,
  setPath,
  tier,
  setTier,
  mediaType,
  genModel,
  setGenModel,
  generating,
  genPct,
  handleGenerate,
  costPerSec,
  hasPrompt,
}) => {
  const isImage = mediaType === "image";
  const modelOptions = GEN_MODELS.filter(
    (item) => item.mediaType === mediaType && item.tier === tier
  );
  const selectedModel = GEN_MODELS.find((item) => item.id === genModel);
  const unitCost = selectedModel?.costPerUnit ?? costPerSec;
  const unitLabel = selectedModel?.unit ?? (isImage ? "image" : "sec");
  const duration = isImage ? 1 : 10;
  const iterations = 10;
  const WITH_VC = path === "remotion" ? 0 : unitCost * duration * iterations;
  const baselineUnit = isImage ? 8 : 27.9;
  const WITHOUT = baselineUnit * duration * iterations;
  const SAVING = WITHOUT === 0 ? 0 : Math.round((1 - WITH_VC / WITHOUT) * 100);

  const CT_ITEMS = isImage
    ? [
        { k: "photorealistic", l: "◉ Photorealistic", rec: "api" },
        { k: "illustration", l: "✦ Illustration", rec: "api" },
        { k: "product", l: "◈ Product Still", rec: "api" },
      ]
    : [
        { k: "animated", l: "◈ Animated Explainer", rec: "remotion" },
        { k: "narrative", l: "▶ Narrative Scene", rec: "api" },
        { k: "photorealistic", l: "◉ Photorealistic", rec: "api" },
      ];
  const CT_HINTS = {
    animated:
      "✦ Animated explainers are best served by Remotion — zero cost, perfect quality for educational content.",
    narrative:
      "✦ Narrative scenes benefit from AI API generation with cinematic framing and temporal coherence.",
    photorealistic: isImage
      ? "✦ Photorealistic stills for posters, thumbnails, and hero assets."
      : "✦ Photorealistic synthesis requires AI API — WaveSpeed recommended for best cost efficiency.",
    illustration: "✦ Stylized illustration outputs for concept art and visuals.",
    product: "✦ Clean stills for product highlights and thumbnails.",
  };
  const GEN_STEPS = isImage
    ? ["⟳ Parsing prompt components…", "⟳ Generating image…", "⟳ Upscaling output…", "⟳ Packaging asset…"]
    : ["⟳ Parsing prompt components…", "⟳ Mapping to compositions…", "⟳ Rendering frames…", "⟳ Encoding output…"];

  return (
    <div>
      <div className="vc-card" style={{ marginBottom: 18 }}>
        <div className="vc-lbl">CONTENT CATEGORY</div>
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 10 }}>
          {CT_ITEMS.map((ct) => (
            <button
              key={ct.k}
              className={`vc-pill ${
                ctType === ct.k ? (ct.k === "animated" ? "pa" : ct.k === "narrative" ? "pn" : "pp") : ""
              }`}
              onClick={() => {
                setCtType(ct.k);
                if (ct.rec) setPath(ct.rec);
              }}
            >
              {ct.l}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: COLORS.muted }}>{CT_HINTS[ctType]}</p>
      </div>

      <div className="g2" style={{ marginBottom: 18 }}>
        <div
          className={`vc-path pr ${path === "remotion" ? "sel" : ""}`}
          onClick={() => !isImage && setPath("remotion")}
          style={isImage ? { opacity: 0.45, pointerEvents: "none" } : undefined}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 18, filter: `drop-shadow(0 0 7px ${COLORS.lime})` }}>⬡</span>
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14 }}>
                  Remotion Render
                </span>
              </div>
              <span
                style={{
                  display: "inline-block",
                  background: COLORS.lime,
                  color: "#000",
                  fontFamily: "'Syne',sans-serif",
                  fontWeight: 800,
                  fontSize: 10,
                  letterSpacing: 1.5,
                  padding: "2px 8px",
                  borderRadius: 4,
                }}
              >
                FREE
              </span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontWeight: 800,
                  fontSize: 32,
                  color: COLORS.lime,
                  textShadow: `0 0 18px ${COLORS.lime}`,
                  lineHeight: 1,
                }}
              >
                ₹0
              </div>
              <div style={{ fontSize: 10, color: COLORS.muted }}>per generation</div>
            </div>
          </div>
          <div style={{ height: 1, background: "rgba(170,255,0,.1)", margin: "12px 0" }} />
          {[
            ["◉", "React declarative rendering"],
            ["◉", "useCurrentFrame + spring API"],
            ["◉", "FFmpeg local MP4 export"],
            ["◉", "Zero marginal cost per run"],
            ["◉", "Best: animated & educational"],
          ].map(([icon, text]) => (
            <div key={text} style={{ display: "flex", gap: 8, fontSize: 12, color: "#94A3B8", padding: "4px 0" }}>
              <span style={{ color: COLORS.lime }}>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
          <div
            style={{
              marginTop: 12,
              padding: "9px 12px",
              borderRadius: 9,
              background: "rgba(170,255,0,.05)",
              border: "1px solid rgba(170,255,0,.12)",
            }}
          >
            <span style={{ fontSize: 10, color: COLORS.lime, fontFamily: "'JetBrains Mono',monospace" }}>
              H2: Mean evaluator rating ≥ 3.5/5 for animated content
            </span>
          </div>
          {path === "remotion" && (
            <div style={{ marginTop: 10, textAlign: "center", color: COLORS.lime, fontSize: 11, fontWeight: 700 }}>
              ✦ SELECTED PATH
            </div>
          )}
        </div>

        <div className={`vc-path pa-c ${path === "api" ? "sel" : ""}`} onClick={() => setPath("api")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18, filter: `drop-shadow(0 0 7px ${COLORS.cyan})` }}>⬡</span>
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14 }}>
                  AI API Synthesis
                </span>
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                {["free", "wavespeed", "premium"].map((t) => (
                  <button
                    key={t}
                    className="vc-tb"
                    style={{
                      background: t === tier ? "rgba(0,229,255,.15)" : "rgba(0,229,255,.04)",
                      border: `1px solid ${t === tier ? "rgba(0,229,255,.38)" : "rgba(0,229,255,.14)"}`,
                      color: t === tier ? COLORS.cyan : COLORS.muted,
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setTier(t);
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontWeight: 800,
                  fontSize: 32,
                  color: COLORS.cyan,
                  textShadow: `0 0 18px ${COLORS.cyan}`,
                  lineHeight: 1,
                }}
              >
                ₹{tier === "free" ? "0" : tier === "wavespeed" ? "27.9" : "55"}
              </div>
              <div style={{ fontSize: 10, color: COLORS.muted }}>per second</div>
            </div>
          </div>
          <div style={{ height: 1, background: "rgba(0,229,255,.1)", margin: "12px 0" }} />
          {[
            ["◉", tier === "premium" ? "Sora / Veo generation" : "WaveSpeed-hosted models"],
            ["◉", "Photorealistic synthesis"],
            ["◉", "Intelligent tier routing"],
            ["◉", "Best: narrative & photorealistic"],
            ["◉", "Fallback: free → WaveSpeed → premium"],
          ].map(([icon, text]) => (
            <div key={text} style={{ display: "flex", gap: 8, fontSize: 12, color: "#94A3B8", padding: "4px 0" }}>
              <span style={{ color: COLORS.cyan }}>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
          <div
            style={{
              marginTop: 12,
              padding: "9px 12px",
              borderRadius: 9,
              background: "rgba(0,229,255,.05)",
              border: "1px solid rgba(0,229,255,.12)",
            }}
          >
            <span style={{ fontSize: 10, color: COLORS.cyan, fontFamily: "'JetBrains Mono',monospace" }}>
              {tier === "free"
                ? "Free tier — limited availability & quality"
                : tier === "wavespeed"
                ? "WaveSpeed: cost-optimised AI generation layer"
                : "Premium: highest quality synthesis, peak cost"}
            </span>
          </div>
          {path === "api" && (
            <div style={{ marginTop: 10, textAlign: "center", color: COLORS.cyan, fontSize: 11, fontWeight: 700 }}>
              ✦ SELECTED PATH
            </div>
          )}
        </div>
      </div>

      {path === "remotion" && !isImage && <RemotionPreview />}

      <div className="vc-card" style={{ marginBottom: 18 }}>
        <div className="vc-lbl">GENERATION MODEL</div>
        {path === "remotion" ? (
          <div style={{ fontSize: 12, color: COLORS.muted }}>
            Remotion renders use your selected composition. Model selection applies to API generations only.
          </div>
        ) : modelOptions.length ? (
          <div className="g2">
            {modelOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setGenModel(option.id)}
                style={{
                  textAlign: "left",
                  padding: 12,
                  borderRadius: 12,
                  background: "rgba(4,8,18,.6)",
                  border: `1px solid ${
                    genModel === option.id ? "rgba(0,229,255,.35)" : COLORS.border
                  }`,
                  color: COLORS.text,
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 12 }}>{option.label}</div>
                <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 4 }}>{option.note}</div>
                <div style={{ fontSize: 10, color: COLORS.cyan, marginTop: 6 }}>
                  {option.costPerUnit} per {option.unit}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: COLORS.muted }}>
            No models available for this tier. Pick a different tier to continue.
          </div>
        )}
      </div>

      <div className="vc-card" style={{ marginBottom: 18 }}>
        <div className="vc-lbl">
          COST ANALYSIS — {iterations} iterations × {duration} {unitLabel}
        </div>
        <div className="g3">
          {[
            ["WITHOUT VIDCRAFT", `₹${WITHOUT.toLocaleString()}`, COLORS.red, "API-only pipeline"],
            [
              "WITH VIDCRAFT",
              `₹${WITH_VC}`,
              path === "remotion" ? COLORS.lime : COLORS.cyan,
              path === "remotion" ? "Remotion path" : "API path",
            ],
            ["COST REDUCTION", path === "remotion" ? ">99%" : `${SAVING}%`, COLORS.lime, "H2: target ≥ 90%"],
          ].map(([label, value, color, sub]) => (
            <div
              key={label}
              style={{
                padding: "14px",
                borderRadius: 11,
                background: `${color}08`,
                border: `1px solid ${color}22`,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color,
                  marginBottom: 5,
                  fontFamily: "'JetBrains Mono',monospace",
                  letterSpacing: 1,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontWeight: 800,
                  fontSize: 26,
                  color,
                  textShadow: `0 0 14px ${color}`,
                }}
              >
                {value}
              </div>
              <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 2 }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="vc-card" style={{ marginBottom: 18 }}>
        <div className="vc-lbl">RESEARCH HYPOTHESES BEING TESTED</div>
        <div className="g3">
          {[
            ["H1", "Prompt quality", "Mean evaluator rating +1.5/5 vs raw baseline", COLORS.cyan],
            ["H2", "Cost reduction", "≥90% savings via dual-gen architecture", COLORS.lime],
            ["H3", "Token efficiency", "phi3-mini reduces tokens >30% vs GPT-4o Mini", COLORS.purple],
          ].map(([code, title, desc, color]) => (
            <div
              key={code}
              style={{
                padding: "12px",
                borderRadius: 10,
                background: `${color}06`,
                border: `1px solid ${color}1A`,
              }}
            >
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5 }}>
                <span
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontWeight: 800,
                    fontSize: 14,
                    color,
                    textShadow: `0 0 10px ${color}`,
                  }}
                >
                  {code}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.text }}>{title}</span>
              </div>
              <span style={{ fontSize: 11, color: COLORS.muted }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="vc-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14 }}>
              Ready to Generate
            </div>
            <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
              Output: <span style={{ color: COLORS.text }}>{mediaType}</span>
              &nbsp;·&nbsp; Path: <span style={{ color: path === "remotion" ? COLORS.lime : COLORS.cyan }}>{path === "remotion" ? "Remotion Render" : `AI API — ${tier}`}</span>
              &nbsp;·&nbsp; Type: <span style={{ color: COLORS.text }}>{ctType}</span>
            </div>
          </div>
          {!hasPrompt && (
            <span style={{ fontSize: 11, color: COLORS.orange, fontFamily: "'JetBrains Mono',monospace" }}>
              ⚠ Add a prompt in Studio first
            </span>
          )}
        </div>
        <button className="vc-btn bg" onClick={handleGenerate} disabled={generating}>
          {generating ? (
            <>
              <div
                className="vc-sp"
                style={{ borderTopColor: "#000", borderColor: "rgba(0,0,0,.2)", width: 16, height: 16 }}
              />
              {path === "remotion" ? "Rendering with Remotion…" : isImage ? "Generating image…" : "Submitting to API…"}
            </>
          ) : (
            <>
              <span>▶</span> Generate {isImage ? "Image" : path === "remotion" ? "Animated Video" : "AI Video"}
            </>
          )}
        </button>
        {generating && (
          <div>
            <div className="vc-prog">
              <div className="vc-pf" style={{ width: `${genPct}%` }} />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 5,
                fontSize: 10,
                color: COLORS.muted,
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              <span>{GEN_STEPS[genPct < 30 ? 0 : genPct < 60 ? 1 : genPct < 90 ? 2 : 3]}</span>
              <span>{genPct}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
