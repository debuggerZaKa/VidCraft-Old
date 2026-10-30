import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const VISUALS = [
  "hook",
  "title",
  "zoom_in",
  "atom",
  "atoms_repel",
  "wall",
  "ball_bounce",
  "materials",
  "zoom_out",
  "figures_ball",
  "handoff",
  "throw",
  "punchline",
  "force",
  "outro",
];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export const normalizeCinematicPlan = (raw) => {
  const plan = raw || {};
  const scenesIn = Array.isArray(plan.scenes) ? plan.scenes : [];
  const scenes = (scenesIn.length ? scenesIn : [{ visual: "title", lines: ["Your story"], durationInFrames: 120 }])
    .slice(0, 16)
    .map((scene, index) => {
      const durationInFrames = clamp(Number(scene.durationInFrames) || 180, 90, 480);
      return {
        visual: VISUALS.includes(scene.visual) ? scene.visual : index === 0 ? "hook" : "force",
        durationInFrames,
        headline: String(scene.headline || scene.title || "").slice(0, 90),
        body: String(scene.body || "").slice(0, 280),
        lines: Array.isArray(scene.lines)
          ? scene.lines.map((l) => String(l).slice(0, 100)).slice(0, 3)
          : [],
        labels: Array.isArray(scene.labels)
          ? scene.labels.map((l) => String(l).slice(0, 24)).slice(0, 4)
          : [],
        accent: scene.accent || plan.accent || "#66aaff",
      };
    });

  let cursor = 0;
  const timed = scenes.map((scene) => {
    const startFrame = cursor;
    cursor += scene.durationInFrames;
    return { ...scene, startFrame, endFrame: cursor };
  });

  const durationInFrames = clamp(
    Number(plan.durationInFrames) || cursor,
    Math.max(cursor, 300),
    5400
  );

  return {
    title: String(plan.title || "Cinematic Story").slice(0, 100),
    fps: 30,
    width: 1280,
    height: 720,
    durationInFrames,
    background: plan.background || "#070b18",
    accent: plan.accent || "#f59e0b",
    textColor: plan.textColor || "#f5f7fb",
    mutedColor: plan.mutedColor || "#9aa3b5",
    scenes: timed,
    preset: plan.preset || null,
  };
};

const AtomSVG = ({ cx, cy, r, frame, color = "#66aaff", speedMul = 1 }) => {
  const orbits = useMemo(
    () => [
      { rx: r * 0.48, ry: r * 0.18, tilt: 0, spd: 0.026 },
      { rx: r * 0.58, ry: r * 0.3, tilt: 62, spd: 0.019 },
      { rx: r * 0.64, ry: r * 0.22, tilt: -55, spd: 0.034 },
    ],
    [r]
  );
  const nR = r * 0.13;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r * 1.08} fill={color} opacity={0.035} />
      <circle cx={cx} cy={cy} r={r * 0.82} fill={color} opacity={0.065} />
      {orbits.map((o, i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx={o.rx}
          ry={o.ry}
          fill="none"
          stroke={color}
          strokeWidth={0.9}
          opacity={0.28}
          transform={`rotate(${o.tilt} ${cx} ${cy})`}
        />
      ))}
      <circle cx={cx} cy={cy} r={nR * 1.4} fill={color} opacity={0.5} />
      <circle cx={cx} cy={cy} r={nR} fill="white" opacity={0.97} />
      {orbits.map((o, i) => {
        const ang = frame * o.spd * speedMul + i * 2.09;
        const tr = (o.tilt * Math.PI) / 180;
        const ex =
          cx + o.rx * Math.cos(ang) * Math.cos(tr) - o.ry * Math.sin(ang) * Math.sin(tr);
        const ey =
          cy + o.rx * Math.cos(ang) * Math.sin(tr) + o.ry * Math.sin(ang) * Math.cos(tr);
        return <circle key={i} cx={ex} cy={ey} r={r * 0.052} fill="white" opacity={0.96} />;
      })}
    </g>
  );
};

const Figure = ({ x, groundY, color, sz = 1, armR = 20, flip = false }) => {
  const hR = 22 * sz;
  const bW = 28 * sz;
  const bH = 58 * sz;
  const lgL = 46 * sz;
  const bTop = groundY - lgL - bH;
  const mx = (px) => (flip ? 2 * x - px : px);
  return (
    <>
      <div
        style={{
          position: "absolute",
          width: 8 * sz,
          height: 40 * sz,
          background: color,
          borderRadius: 4,
          left: mx(x + bW / 2) - 4 * sz,
          top: bTop + 10 * sz,
          transformOrigin: "top center",
          transform: `rotate(${-90 - armR}deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: bW,
          height: bH,
          background: color,
          borderRadius: 6,
          left: mx(x) - bW / 2,
          top: bTop,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: hR * 2,
          height: hR * 2,
          borderRadius: "50%",
          background: "#f5c89a",
          left: mx(x) - hR,
          top: bTop - hR * 2 - 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 9 * sz,
          height: lgL,
          background: "#1a1a44",
          left: mx(x - 8 * sz),
          top: bTop + bH,
          borderRadius: 4,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 9 * sz,
          height: lgL,
          background: "#1a1a44",
          left: mx(x + 2 * sz),
          top: bTop + bH,
          borderRadius: 4,
        }}
      />
    </>
  );
};

const Ball = ({ cx, cy, r }) => (
  <div
    style={{
      position: "absolute",
      width: r * 2,
      height: r * 2,
      borderRadius: "50%",
      background: "radial-gradient(circle at 35% 32%, #ffcf6e, #e05500)",
      boxShadow: "0 5px 20px rgba(0,0,0,0.55)",
      left: cx - r,
      top: cy - r,
    }}
  />
);

const Subtitles = ({ lines, textColor }) => {
  if (!lines?.length) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 80,
        bottom: 48,
        textAlign: "center",
        zIndex: 20,
      }}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            fontSize: i === 0 ? 28 : 22,
            fontWeight: i === 0 ? 700 : 500,
            color: textColor,
            textShadow: "0 2px 18px rgba(0,0,0,0.85)",
            marginTop: i ? 6 : 0,
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
};

const SceneVisual = ({ scene, local, progress, W, H, frame }) => {
  const CX = W / 2;
  const CY = H / 2;
  const GY = H * 0.81;
  const accent = scene.accent || "#66aaff";
  const enter = spring({
    frame: local,
    fps: 30,
    config: { damping: 200, stiffness: 110 },
  });

  switch (scene.visual) {
    case "hook":
    case "title":
    case "outro":
      return (
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: 80,
            opacity: enter,
            transform: `translateY(${interpolate(enter, [0, 1], [24, 0])}px)`,
          }}
        >
          <div>
            <div style={{ fontSize: 56, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>
              {scene.headline || scene.lines[0] || "Story"}
            </div>
            <div style={{ fontSize: 24, color: "#9aa3b5", marginTop: 16, maxWidth: 860, marginInline: "auto" }}>
              {scene.body || scene.lines[1] || ""}
            </div>
          </div>
        </AbsoluteFill>
      );

    case "zoom_in": {
      const scale = interpolate(progress, [0, 1], [1, 4.2]);
      return (
        <AbsoluteFill style={{ opacity: enter }}>
          <div
            style={{
              position: "absolute",
              left: CX - 90,
              top: CY - 40,
              width: 180,
              height: 220,
              borderRadius: "50% 50% 40% 40%",
              background: "linear-gradient(180deg,#f5c89a,#d4956a)",
              transform: `scale(${scale})`,
              transformOrigin: "50% 20%",
              boxShadow: "0 0 80px rgba(245,200,154,0.25)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: CX - 28,
              top: CY + 20,
              width: 56,
              height: 56,
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.35)",
              transform: `scale(${scale})`,
              transformOrigin: "50% -40px",
            }}
          />
        </AbsoluteFill>
      );
    }

    case "atom": {
      const r = interpolate(progress, [0, 1], [70, 200]);
      return (
        <AbsoluteFill style={{ opacity: enter }}>
          <svg width={W} height={H}>
            <AtomSVG cx={CX} cy={CY} r={r} frame={frame} color={accent} />
          </svg>
        </AbsoluteFill>
      );
    }

    case "atoms_repel":
    case "force": {
      const approach = clamp(progress / 0.45, 0, 1);
      const repel = clamp((progress - 0.5) / 0.5, 0, 1);
      const sep =
        interpolate(approach, [0, 1], [W * 0.34, W * 0.11]) +
        interpolate(repel, [0, 1], [0, W * 0.28]);
      const flash =
        progress > 0.42 && progress < 0.62
          ? interpolate(progress, [0.42, 0.5, 0.58, 0.62], [0, 1, 1, 0])
          : 0;
      return (
        <AbsoluteFill style={{ opacity: enter }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(circle, rgba(255,120,80,${flash * 0.35}), transparent 55%)`,
            }}
          />
          <svg width={W} height={H}>
            <AtomSVG cx={CX - sep} cy={CY} r={95} frame={frame} color="#66aaff" />
            <AtomSVG cx={CX + sep} cy={CY} r={95} frame={frame} color="#ff8a5c" speedMul={1.1} />
            {repel > 0.05 && (
              <>
                <line
                  x1={CX - sep + 70}
                  y1={CY}
                  x2={CX - 20}
                  y2={CY}
                  stroke="#ff8a5c"
                  strokeWidth={3}
                  opacity={0.85}
                />
                <line
                  x1={CX + sep - 70}
                  y1={CY}
                  x2={CX + 20}
                  y2={CY}
                  stroke="#66aaff"
                  strokeWidth={3}
                  opacity={0.85}
                />
              </>
            )}
          </svg>
        </AbsoluteFill>
      );
    }

    case "wall": {
      const push = interpolate(progress, [0, 0.5, 1], [0, 18, 10]);
      return (
        <AbsoluteFill style={{ opacity: enter }}>
          <div
            style={{
              position: "absolute",
              right: 120,
              top: 80,
              bottom: 80,
              width: 160,
              background: "linear-gradient(90deg,#3a3f55,#1c2030)",
              borderLeft: "4px solid #8b93a7",
              boxShadow: "inset 8px 0 24px rgba(0,0,0,0.35)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: CX - 160 - push,
              top: CY - 40,
              width: 150,
              height: 90,
              borderRadius: 40,
              background: "linear-gradient(180deg,#f5c89a,#d4956a)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
            }}
          />
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            {[0, 1, 2].map((i) => (
              <line
                key={i}
                x1={CX + 20}
                y1={CY - 20 + i * 20}
                x2={CX + 100}
                y2={CY - 20 + i * 20}
                stroke="#f59e0b"
                strokeWidth={3}
                opacity={0.7}
              />
            ))}
          </svg>
        </AbsoluteFill>
      );
    }

    case "ball_bounce": {
      const y = CY + Math.abs(Math.sin(progress * Math.PI * 2.2)) * -180 + 120;
      const force = Math.sin(progress * Math.PI * 2.2) < 0 ? 1 : 0.2;
      return (
        <AbsoluteFill style={{ opacity: enter }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: GY,
              width: W,
              height: H - GY,
              background: "linear-gradient(180deg,#1a3a22,#0d2016)",
            }}
          />
          <Ball cx={CX} cy={y} r={42} />
          <svg width={W} height={H}>
            <line
              x1={CX}
              y1={y + 42}
              x2={CX}
              y2={y + 42 + 50 * force}
              stroke="#66aaff"
              strokeWidth={3}
              opacity={force}
            />
            <line
              x1={CX}
              y1={y - 42}
              x2={CX}
              y2={y - 42 - 40 * force}
              stroke="#f59e0b"
              strokeWidth={3}
              opacity={force}
            />
          </svg>
        </AbsoluteFill>
      );
    }

    case "materials": {
      const labels = scene.labels.length ? scene.labels : ["Wood", "Metal", "Fabric"];
      const colors = ["#8b5a2b", "#c0c7d1", "#d4a5c9"];
      return (
        <AbsoluteFill
          style={{
            opacity: enter,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 36,
          }}
        >
          {labels.map((label, i) => {
            const s = spring({
              frame: local - i * 8,
              fps: 30,
              config: { damping: 160, stiffness: 120 },
            });
            return (
              <div
                key={label}
                style={{
                  width: 180,
                  height: 220,
                  borderRadius: 18,
                  background: colors[i % colors.length],
                  transform: `scale(${interpolate(s, [0, 1], [0.8, 1])})`,
                  opacity: s,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  paddingBottom: 18,
                  boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
                  fontWeight: 700,
                  color: "#0a0e1b",
                  fontSize: 22,
                }}
              >
                {label}
              </div>
            );
          })}
        </AbsoluteFill>
      );
    }

    case "zoom_out": {
      const scale = interpolate(progress, [0, 1], [3.5, 1]);
      return (
        <AbsoluteFill style={{ opacity: enter }}>
          <svg width={W} height={H}>
            <AtomSVG cx={CX} cy={CY} r={80 * scale} frame={frame} color={accent} />
          </svg>
          <Figure x={CX} groundY={GY} color="#3d6dff" sz={0.9} />
        </AbsoluteFill>
      );
    }

    case "figures_ball":
    case "handoff": {
      const ballX =
        scene.visual === "handoff"
          ? interpolate(progress, [0, 1], [CX - 160, CX + 140])
          : CX - 40;
      const ballY = GY - 150 + Math.sin(progress * Math.PI) * -40;
      return (
        <AbsoluteFill style={{ opacity: enter }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: GY,
              width: W,
              height: H - GY,
              background: "linear-gradient(180deg,#1a3a22,#0d2016)",
            }}
          />
          <Figure x={CX - 180} groundY={GY} color="#3d6dff" armR={35} />
          <Figure x={CX + 180} groundY={GY} color="#e05555" flip armR={25} />
          <Ball cx={ballX} cy={ballY} r={34} />
        </AbsoluteFill>
      );
    }

    case "throw": {
      const x = interpolate(progress, [0, 1], [CX - 40, W + 80]);
      const y = CY - 40 + Math.sin(progress * Math.PI) * -120;
      return (
        <AbsoluteFill style={{ opacity: enter }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: GY,
              width: W,
              height: H - GY,
              background: "linear-gradient(180deg,#1a3a22,#0d2016)",
            }}
          />
          <Figure x={CX - 200} groundY={GY} color="#3d6dff" armR={70} />
          <Ball cx={x} cy={y} r={34} />
        </AbsoluteFill>
      );
    }

    case "punchline":
      return (
        <AbsoluteFill style={{ opacity: enter }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: GY,
              width: W,
              height: H - GY,
              background: "linear-gradient(180deg,#1e1e1e,#0a0a0a)",
            }}
          />
          <Figure x={CX - 120} groundY={GY} color="#2f5bd8" />
          <Figure x={CX + 140} groundY={GY} color="#334155" />
          <div
            style={{
              position: "absolute",
              left: CX - 220,
              top: 120,
              width: 440,
              padding: "18px 22px",
              borderRadius: 16,
              background: "rgba(15,20,36,0.92)",
              border: "1px solid rgba(245,158,11,0.4)",
              color: "#f5f7fb",
              fontSize: 26,
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            {scene.headline || scene.lines[0] || "Technically..."}
          </div>
        </AbsoluteFill>
      );

    default:
      return (
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: enter,
          }}
        >
          <div style={{ fontSize: 42, fontWeight: 800, color: "#fff" }}>
            {scene.headline || "Scene"}
          </div>
        </AbsoluteFill>
      );
  }
};

export const CinematicComposition = ({ plan }) => {
  const safe = normalizeCinematicPlan(plan);
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();

  const active =
    safe.scenes.find((s) => frame >= s.startFrame && frame < s.endFrame) ||
    safe.scenes[safe.scenes.length - 1];

  const local = frame - (active?.startFrame || 0);
  const progress = active
    ? clamp(local / Math.max(active.durationInFrames, 1), 0, 1)
    : 0;

  const lines =
    active?.lines?.length > 0
      ? active.lines
      : [active?.headline, active?.body].filter(Boolean);

  return (
    <AbsoluteFill
      style={{
        background: safe.background,
        fontFamily: "Outfit, Segoe UI, sans-serif",
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 20% 15%, rgba(102,170,255,0.12), transparent 40%), radial-gradient(circle at 80% 80%, rgba(245,158,11,0.08), transparent 45%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 36,
          fontSize: 13,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: safe.accent,
          fontWeight: 700,
          opacity: 0.85,
          zIndex: 30,
        }}
      >
        {safe.title}
      </div>
      {active && (
        <SceneVisual
          scene={active}
          local={local}
          progress={progress}
          W={W}
          H={H}
          frame={frame}
        />
      )}
      <Subtitles lines={lines} textColor={safe.textColor} />
    </AbsoluteFill>
  );
};
