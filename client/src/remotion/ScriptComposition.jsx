import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const DEFAULT_PLAN = {
  title: "VidCraft Animation",
  fps: 30,
  durationInFrames: 150,
  width: 1280,
  height: 720,
  background: "#0a0e1b",
  accent: "#f59e0b",
  textColor: "#f5f7fb",
  mutedColor: "#8b93a7",
  scenes: [
    {
      startFrame: 0,
      durationInFrames: 150,
      headline: "Your animation",
      body: "Describe a script and generate with Remotion Engine.",
      layout: "center",
      items: [],
    },
  ],
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const normalizePlan = (raw) => {
  const plan = { ...DEFAULT_PLAN, ...(raw || {}) };
  const scenes = Array.isArray(raw?.scenes) && raw.scenes.length
    ? raw.scenes
    : DEFAULT_PLAN.scenes;

  let cursor = 0;
  const normalizedScenes = scenes.slice(0, 8).map((scene, index) => {
    const durationInFrames = clamp(Number(scene.durationInFrames) || 60, 30, 180);
    const startFrame =
      Number.isFinite(Number(scene.startFrame)) && Number(scene.startFrame) >= 0
        ? Number(scene.startFrame)
        : cursor;
    cursor = startFrame + durationInFrames;
    return {
      startFrame,
      durationInFrames,
      headline: String(scene.headline || `Scene ${index + 1}`).slice(0, 80),
      body: String(scene.body || "").slice(0, 220),
      layout: ["center", "left", "cards"].includes(scene.layout) ? scene.layout : "center",
      items: Array.isArray(scene.items)
        ? scene.items.map((item) => String(item).slice(0, 40)).slice(0, 5)
        : [],
    };
  });

  const last = normalizedScenes[normalizedScenes.length - 1];
  const durationInFrames = clamp(
    Number(plan.durationInFrames) || last.startFrame + last.durationInFrames,
    90,
    900
  );

  return {
    title: String(plan.title || DEFAULT_PLAN.title).slice(0, 80),
    fps: 30,
    durationInFrames,
    width: 1280,
    height: 720,
    background: plan.background || DEFAULT_PLAN.background,
    accent: plan.accent || DEFAULT_PLAN.accent,
    textColor: plan.textColor || DEFAULT_PLAN.textColor,
    mutedColor: plan.mutedColor || DEFAULT_PLAN.mutedColor,
    scenes: normalizedScenes,
  };
};

const SceneBlock = ({ scene, accent, textColor, mutedColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - scene.startFrame;
  if (local < 0 || local >= scene.durationInFrames) return null;

  const enter = spring({
    frame: local,
    fps,
    config: { damping: 200, stiffness: 120 },
  });
  const opacity = interpolate(local, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(enter, [0, 1], [28, 0]);

  if (scene.layout === "cards") {
    return (
      <AbsoluteFill style={{ opacity, padding: 72, justify: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ transform: `translateY(${y}px)` }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: textColor, marginBottom: 12 }}>
            {scene.headline}
          </div>
          <div style={{ fontSize: 22, color: mutedColor, marginBottom: 28, maxWidth: 900 }}>
            {scene.body}
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {scene.items.map((item, index) => {
              const cardSpring = spring({
                frame: local - index * 6,
                fps,
                config: { damping: 180, stiffness: 140 },
              });
              return (
                <div
                  key={`${item}-${index}`}
                  style={{
                    minWidth: 160,
                    padding: "18px 20px",
                    borderRadius: 16,
                    background: `linear-gradient(135deg, ${accent}, #f97316)`,
                    color: "#0a0e1b",
                    fontWeight: 700,
                    fontSize: 20,
                    transform: `scale(${interpolate(cardSpring, [0, 1], [0.86, 1])})`,
                    opacity: interpolate(cardSpring, [0, 1], [0, 1]),
                  }}
                >
                  {item}
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  if (scene.layout === "left") {
    return (
      <AbsoluteFill style={{ opacity, padding: "80px 90px", display: "flex", alignItems: "center" }}>
        <div style={{ transform: `translateY(${y}px)`, maxWidth: 760 }}>
          <div
            style={{
              width: 56,
              height: 6,
              borderRadius: 999,
              background: accent,
              marginBottom: 22,
            }}
          />
          <div style={{ fontSize: 54, fontWeight: 800, color: textColor, lineHeight: 1.1 }}>
            {scene.headline}
          </div>
          <div style={{ fontSize: 24, color: mutedColor, marginTop: 18, lineHeight: 1.45 }}>
            {scene.body}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        opacity,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 80,
      }}
    >
      <div style={{ transform: `translateY(${y}px)`, maxWidth: 920 }}>
        <div style={{ fontSize: 58, fontWeight: 800, color: textColor, lineHeight: 1.08 }}>
          {scene.headline}
        </div>
        <div style={{ fontSize: 24, color: mutedColor, marginTop: 18, lineHeight: 1.45 }}>
          {scene.body}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ScriptComposition = ({ plan }) => {
  const safePlan = normalizePlan(plan);
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: safePlan.background, fontFamily: "Outfit, Segoe UI, sans-serif" }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 20% 15%, rgba(245,158,11,0.16), transparent 42%), radial-gradient(circle at 80% 80%, rgba(45,50,80,0.45), transparent 50%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 28,
          left: 36,
          fontSize: 14,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: safePlan.accent,
          fontWeight: 700,
          opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        {safePlan.title}
      </div>
      {safePlan.scenes.map((scene, index) => (
        <SceneBlock
          key={`${scene.headline}-${index}`}
          scene={scene}
          accent={safePlan.accent}
          textColor={safePlan.textColor}
          mutedColor={safePlan.mutedColor}
        />
      ))}
    </AbsoluteFill>
  );
};
