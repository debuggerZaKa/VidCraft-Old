import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

// Timing map (frames @ 30 fps, total = 5400 = 3:00)
const S = {
  intro: { f: 0, t: 240 },
  fingers: { f: 240, t: 600 },
  atomZoom: { f: 600, t: 1020 },
  repulsion: { f: 1020, t: 1500 },
  wall: { f: 1500, t: 1950 },
  ballBounce: { f: 1950, t: 2400 },
  textures: { f: 2400, t: 2880 },
  zoomOut: { f: 2880, t: 3360 },
  charsBall: { f: 3360, t: 3900 },
  handoff: { f: 3900, t: 4440 },
  ballThrow: { f: 4440, t: 4950 },
  street: { f: 4950, t: 5250 },
  punchline: { f: 5250, t: 5400 },
};

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

const fadeScene = (frame: number, from: number, to: number, d = 25) =>
  interpolate(frame, [from, from + d, to - d, to], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const lp = (frame: number, key: keyof typeof S) => {
  const { f, t } = S[key];
  return clamp((frame - f) / (t - f), 0, 1);
};

const SUBS = [
  {
    f: 0,
    t: 240,
    lines: ["What if I told you...", "we never truly touch anything."],
  },
  {
    f: 240,
    t: 600,
    lines: [
      "Do you know our atoms never touch each other?",
      'The "touch" we feel is atoms pushing against atoms.',
    ],
  },
  { f: 600, t: 1020, lines: ["At that scale, it is all fields and forces."] },
  {
    f: 1020,
    t: 1500,
    lines: [
      "Electrons repel.",
      "Their invisible pressure pushes back before contact can happen.",
    ],
  },
  {
    f: 1500,
    t: 1950,
    lines: ["So when you press a wall,", "you feel the wall pressing you."],
  },
  {
    f: 1950,
    t: 2400,
    lines: ["The bounce is just force meeting force--", "like two storms colliding."],
  },
  {
    f: 2400,
    t: 2880,
    lines: [
      "Roughness, softness, warmth--",
      "patterns of resistance and energy exchange.",
    ],
  },
  { f: 2880, t: 3360, lines: ["We do not touch.", "We negotiate with forces."] },
  {
    f: 3360,
    t: 3900,
    lines: [
      "Watch the ball. It never truly meets the hand.",
      "It turns away at the last instant.",
    ],
  },
  {
    f: 3900,
    t: 4440,
    lines: ["Even a handoff is a silent standoff between fields."],
  },
  {
    f: 4440,
    t: 4950,
    lines: ["Then it leaves...", "disappearing into the vacuum of distance."],
  },
  { f: 4950, t: 5250, lines: ["Which brings us to a curious... legal argument."] },
  {
    f: 5250,
    t: 5400,
    lines: ["So yes, officer...", "technically I did not touch that kid."],
  },
];

interface AtomProps {
  cx: number;
  cy: number;
  r: number;
  frame: number;
  color?: string;
  speedMul?: number;
  electronCount?: number;
}

const AtomSVG: React.FC<AtomProps> = ({
  cx,
  cy,
  r,
  frame,
  color = "#66aaff",
  speedMul = 1,
  electronCount = 3,
}) => {
  const orbits = useMemo(
    () =>
      [
        { rx: r * 0.48, ry: r * 0.18, tilt: 0, spd: 0.026 },
        { rx: r * 0.58, ry: r * 0.3, tilt: 62, spd: 0.019 },
        { rx: r * 0.64, ry: r * 0.22, tilt: -55, spd: 0.034 },
      ].slice(0, electronCount),
    [r, electronCount]
  );

  const nR = r * 0.13;

  return (
    <g>
      <circle cx={cx} cy={cy} r={r * 1.08} fill={color} opacity={0.035} />
      <circle cx={cx} cy={cy} r={r * 0.82} fill={color} opacity={0.065} />
      <circle cx={cx} cy={cy} r={r * 0.52} fill={color} opacity={0.1} />

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

      <circle cx={cx} cy={cy} r={nR * 2.2} fill={color} opacity={0.16} />
      <circle cx={cx} cy={cy} r={nR * 1.4} fill={color} opacity={0.5} />
      <circle cx={cx} cy={cy} r={nR} fill="white" opacity={0.97} />

      {orbits.map((o, i) => {
        const ang = frame * o.spd * speedMul + i * 2.09;
        const tr = (o.tilt * Math.PI) / 180;
        const ex =
          cx + o.rx * Math.cos(ang) * Math.cos(tr) - o.ry * Math.sin(ang) * Math.sin(tr);
        const ey =
          cy + o.rx * Math.cos(ang) * Math.sin(tr) + o.ry * Math.sin(ang) * Math.cos(tr);
        return (
          <g key={i}>
            <circle cx={ex} cy={ey} r={r * 0.095} fill={color} opacity={0.35} />
            <circle cx={ex} cy={ey} r={r * 0.052} fill="white" opacity={0.96} />
          </g>
        );
      })}
    </g>
  );
};

const ForceArrow: React.FC<{
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  len: number;
  op?: number;
}> = ({ x, y, dx, dy, color, len, op = 0.88 }) => {
  const ex = x + dx * len;
  const ey = y + dy * len;
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const a = 8;
  return (
    <g opacity={op}>
      <line x1={x} y1={y} x2={ex} y2={ey} stroke={color} strokeWidth={2.5} />
      <polygon
        points={`0,0 -${a},-${a * 0.5} -${a},${a * 0.5}`}
        fill={color}
        transform={`translate(${ex},${ey}) rotate(${ang})`}
      />
    </g>
  );
};

interface FigureProps {
  x: number;
  groundY: number;
  color: string;
  sz?: number;
  armL?: number;
  armR?: number;
  legL?: number;
  legR?: number;
  flip?: boolean;
}

const Figure: React.FC<FigureProps> = ({
  x,
  groundY,
  color,
  sz = 1,
  armL = 0,
  armR = 0,
  legL = 0,
  legR = 0,
  flip = false,
}) => {
  const hR = 26 * sz;
  const bW = 30 * sz;
  const bH = 66 * sz;
  const lbW = 9 * sz;
  const aL = 44 * sz;
  const lgL = 52 * sz;
  const fL = 16 * sz;

  const bTop = groundY - lgL - bH;
  const shY = bTop + 12 * sz;
  const hipY = bTop + bH;
  const hCy = bTop - hR - 3 * sz;

  const mx = (px: number) => (flip ? 2 * x - px : px);

  const armDiv = (angle: number, side: "L" | "R") => {
    const base = side === "L" ? -90 + angle : -90 - angle;
    const ox = side === "L" ? x - bW / 2 : x + bW / 2;
    return (
      <div
        key={`arm${side}`}
        style={{
          position: "absolute",
          width: lbW,
          height: aL,
          background: color,
          borderRadius: lbW / 2,
          left: mx(ox) - lbW / 2,
          top: shY,
          transformOrigin: `${lbW / 2}px 0`,
          transform: `rotate(${base}deg)`,
        }}
      />
    );
  };

  const legAndFoot = (angle: number, side: "L" | "R") => {
    const ox = side === "L" ? x - bW / 4 : x + bW / 4;
    const rad = (angle * Math.PI) / 180;
    const fx = mx(ox) + Math.sin(rad) * lgL - lbW / 2;
    const fy = hipY + Math.cos(rad) * lgL;
    return (
      <React.Fragment key={`leg${side}`}>
        <div
          style={{
            position: "absolute",
            width: lbW,
            height: lgL,
            background: "#1a1a44",
            borderRadius: lbW / 2,
            left: mx(ox) - lbW / 2,
            top: hipY,
            transformOrigin: `${lbW / 2}px 0`,
            transform: `rotate(${angle}deg)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: fL,
            height: lbW,
            background: "#0d0d22",
            borderRadius: lbW / 2,
            left: fx,
            top: fy,
          }}
        />
      </React.Fragment>
    );
  };

  return (
    <>
      {armDiv(armL, "L")}
      {armDiv(armR, "R")}
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
          top: hCy - hR,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          padding: "7px 10px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ width: 5, height: 6, borderRadius: "50%", background: "#222" }} />
        <div style={{ width: 5, height: 6, borderRadius: "50%", background: "#222" }} />
      </div>
      {legAndFoot(legL, "L")}
      {legAndFoot(legR, "R")}
    </>
  );
};

const Ball: React.FC<{ cx: number; cy: number; r: number; opacity?: number }> = ({
  cx,
  cy,
  r,
  opacity = 1,
}) => (
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
      opacity,
    }}
  />
);

const GroundLayer: React.FC<{ W: number; H: number; GY: number; dark?: boolean }> = ({
  W,
  H,
  GY,
  dark = false,
}) => (
  <>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: GY,
        width: W,
        height: H - GY,
        background: dark
          ? "linear-gradient(180deg,#1e1e1e,#0a0a0a)"
          : "linear-gradient(180deg,#1a3a22,#0d2016)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 0,
        top: GY - 2,
        width: W,
        height: 3,
        background: dark ? "#444" : "#2e6b38",
        boxShadow: dark ? "none" : "0 0 10px rgba(46,107,56,0.5)",
      }}
    />
  </>
);

export const AtomTouch: React.FC = () => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();

  const CX = W / 2;
  const CY = H / 2;
  const GY = H * 0.81;

  const particles = useMemo(
    () =>
      Array.from({ length: 70 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 2 + 0.4,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.25,
        ph: Math.random() * Math.PI * 2,
      })),
    []
  );

  const introOp = fadeScene(frame, S.intro.f, S.intro.t, 20);
  const fingersOp = fadeScene(frame, S.fingers.f, S.fingers.t, 22);
  const atomZOp = fadeScene(frame, S.atomZoom.f, S.atomZoom.t, 25);
  const repOp = fadeScene(frame, S.repulsion.f, S.repulsion.t, 25);
  const wallOp = fadeScene(frame, S.wall.f, S.wall.t, 25);
  const bounceOp = fadeScene(frame, S.ballBounce.f, S.ballBounce.t, 25);
  const texOp = fadeScene(frame, S.textures.f, S.textures.t, 22);
  const zOutOp = fadeScene(frame, S.zoomOut.f, S.zoomOut.t, 25);
  const charsOp = fadeScene(frame, S.charsBall.f, S.handoff.t, 25);
  const throwOp = fadeScene(frame, S.ballThrow.f, S.ballThrow.t, 25);
  const streetOp = fadeScene(frame, S.street.f, S.street.t, 25);
  const punchOp = fadeScene(frame, S.punchline.f, S.punchline.t, 15);

  const sub = SUBS.find((s) => frame >= s.f && frame < s.t);

  const fingerScale = interpolate(frame, [S.fingers.f, S.fingers.t], [1.0, 5.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const atomR = interpolate(frame, [S.atomZoom.f, S.atomZoom.t], [70, 210], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rp = lp(frame, "repulsion");
  const approach = clamp(rp / 0.44, 0, 1);
  const repelProg = clamp((rp - 0.55) / 0.45, 0, 1);
  const atomSep =
    interpolate(approach, [0, 1], [W * 0.36, W * 0.12]) +
    interpolate(repelProg, [0, 1], [0, W * 0.36]);
  const flashOp =
    rp > 0.44 && rp < 0.66
      ? interpolate(rp, [0.44, 0.5, 0.6, 0.66], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;
  const forceArrOp = clamp((rp - 0.52) * 5, 0, 1);
  const repelLabel = rp > 0.38 && rp < 0.58;

  const wp = lp(frame, "wall");
  const handX = interpolate(
    wp,
    [0.05, 0.45, 0.75],
    [W * 0.22, W * 0.47, W * 0.45],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const wallDent = interpolate(wp, [0.38, 0.52, 0.75], [0, 22, 14], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bf = frame - S.ballBounce.f;
  const bounceY = CY + 90 - Math.abs(Math.sin(bf * 0.065 * Math.PI)) * 195;
  const nearFloor = 1 - clamp(Math.abs(bounceY - (GY - 25)) / 90, 0, 1);

  const tp = lp(frame, "textures");
  const textures = [
    {
      label: "Wood",
      bg: "repeating-linear-gradient(88deg,#7a5228 0px,#6b4520 4px,#8a6230 8px,#5d3d1a 12px,#7a5228 16px)",
    },
    {
      label: "Metal",
      bg: "linear-gradient(130deg,#b0b8c0 0%,#6e7880 25%,#d8dce0 48%,#8090a0 72%,#b0b8c0 100%)",
    },
    {
      label: "Fabric",
      bg: "repeating-conic-gradient(#7055a0 0% 25%,#4a3a72 25% 50%) 0 0 / 10px 10px",
    },
  ];

  const zOutScale = interpolate(frame, [S.zoomOut.f, S.zoomOut.t], [5.5, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const handReveal = interpolate(lp(frame, "zoomOut"), [0.68, 1.0], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const aX = 290;
  const lf = Math.max(0, frame - S.charsBall.f);
  const aBounce = Math.sin(lf * 0.075 * Math.PI);
  const aBallY = GY - 32 - 115 * Math.abs(aBounce);
  const aArmL = 28 + aBounce * 16;
  const aLegSwing = Math.sin(lf * 0.1) * 10;

  const bWalkP = clamp((frame - S.handoff.f) / (S.handoff.t - S.handoff.f), 0, 1);
  const bX = interpolate(bWalkP, [0, 0.5, 1], [W + 110, 555, 555], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bWalking = bWalkP < 0.52;
  const bLegSwing = Math.sin(frame * 0.22) * 20 * (bWalking ? 1 : 0);
  const bArmSwing = Math.sin(frame * 0.22) * 15 * (bWalking ? 1 : 0);

  let ballX: number;
  let ballY_: number;
  let ballR: number;
  let ballOp: number;
  if (frame < S.handoff.f) {
    ballX = aX + 52;
    ballY_ = aBallY;
    ballR = 22;
    ballOp = 1;
  } else if (frame < S.ballThrow.f) {
    const hp = clamp((frame - S.handoff.f) / (S.handoff.t - S.handoff.f), 0, 1);
    ballX = interpolate(hp, [0.35, 0.72], [aX + 52, bX - 46], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    ballY_ = GY - 115;
    ballR = 22;
    ballOp = 1;
  } else {
    const tp2 = clamp(
      (frame - S.ballThrow.f) / (S.ballThrow.t - S.ballThrow.f),
      0,
      1
    );
    ballX = bX - 46 + tp2 * 18;
    ballY_ = (GY - 115) - tp2 * H * 1.15;
    ballR = 22 * (1 - tp2 * 0.72);
    ballOp = interpolate(tp2, [0.25, 1.0], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  const officerX = interpolate(frame, [S.street.f, S.street.f + 130], [W + 90, W * 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bubbleOp = interpolate(frame, [S.punchline.f, S.punchline.f + 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleCardOp = interpolate(
    frame,
    [S.punchline.f + 35, S.punchline.f + 80],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <div
      style={{
        width: W,
        height: H,
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(180deg,#03050e 0%,#07101f 55%,#0c1630 100%)",
        fontFamily: "Segoe UI, Helvetica Neue, sans-serif",
      }}
    >
      <div style={{ position: "absolute", inset: 0, opacity: introOp, pointerEvents: "none" }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {particles.map((p, i) => {
            const px = ((p.x + p.vx * frame) % W + W) % W;
            const py = ((p.y + p.vy * frame) % H + H) % H;
            const twinkle = 0.25 + 0.55 * Math.sin(frame * 0.045 + p.ph);
            return (
              <circle key={i} cx={px} cy={py} r={p.r} fill="white" opacity={twinkle} />
            );
          })}
        </svg>
        <div
          style={{
            position: "absolute",
            top: "38%",
            width: "100%",
            textAlign: "center",
            color: "white",
            fontSize: 56,
            fontWeight: 900,
            letterSpacing: 1,
            textShadow: "0 0 50px rgba(120,190,255,0.55)",
            opacity: interpolate(frame, [0, 25, 190, 220], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          What if I told you...
        </div>
        <div
          style={{
            position: "absolute",
            top: "52%",
            width: "100%",
            textAlign: "center",
            color: "rgba(180,210,255,0.7)",
            fontSize: 28,
            fontWeight: 400,
            letterSpacing: 3,
            opacity: interpolate(frame, [30, 60, 190, 220], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          a physics story
        </div>
      </div>

      <div style={{ position: "absolute", inset: 0, opacity: fingersOp, pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            left: CX - 85,
            top: CY - 110,
            transformOrigin: "center bottom",
            transform: `scale(${fingerScale})`,
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 26,
                height: 78 + i * 7,
                background: "radial-gradient(ellipse at 38% 28%, #f8ccaa, #c07848)",
                borderRadius: "44% 44% 22% 22%",
                left: i * 30,
                bottom: 0,
                transform: `rotate(${(i - 2) * 5}deg)`,
                transformOrigin: "bottom center",
                boxShadow: "inset 0 -8px 14px rgba(0,0,0,0.22)",
              }}
            />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: H * 0.22,
            width: "100%",
            textAlign: "center",
            color: "rgba(255,255,255,0.4)",
            fontSize: 16,
            letterSpacing: 4,
          }}
        >
          ZOOMING IN...
        </div>
      </div>

      <div style={{ position: "absolute", inset: 0, opacity: atomZOp, pointerEvents: "none" }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <radialGradient id="bgAtomGlow">
              <stop offset="0%" stopColor="#1a3a70" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#03050e" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx={CX} cy={CY} rx={atomR * 1.9} ry={atomR * 1.5} fill="url(#bgAtomGlow)" />
          <AtomSVG cx={CX} cy={CY} r={atomR} frame={frame} color="#66aaff" />
        </svg>
        <div
          style={{
            position: "absolute",
            top: 52,
            width: "100%",
            textAlign: "center",
            color: "rgba(120,190,255,0.80)",
            fontSize: 18,
            letterSpacing: 4,
            fontWeight: 600,
          }}
        >
          ELECTRON CLOUD
        </div>
        <div
          style={{
            position: "absolute",
            top: CY - 14,
            left: CX + atomR + 12,
            color: "rgba(255,255,255,0.55)",
            fontSize: 14,
          }}
        >
          &lt;- nucleus
        </div>
        <div
          style={{
            position: "absolute",
            top: CY - atomR * 0.25,
            left: CX + atomR * 0.55,
            color: "rgba(100,210,255,0.50)",
            fontSize: 13,
          }}
        >
          electron -&gt;
        </div>
      </div>

      <div style={{ position: "absolute", inset: 0, opacity: repOp, pointerEvents: "none" }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <radialGradient id="flashG" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity={flashOp * 0.95} />
              <stop offset="40%" stopColor="#88ccff" stopOpacity={flashOp * 0.55} />
              <stop offset="100%" stopColor="#0044cc" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx={CX} cy={CY} r={90} fill="url(#flashG)" opacity={flashOp} />

          <AtomSVG cx={CX - atomSep} cy={CY} r={82} frame={frame} color="#66aaff" />
          <AtomSVG
            cx={CX + atomSep}
            cy={CY}
            r={82}
            frame={frame}
            color="#ff8866"
            speedMul={-0.75}
          />

          {approach < 0.98 && approach > 0.05 ? (
            <>
              <ForceArrow x={CX - atomSep + 95} y={CY} dx={1} dy={0} color="#66aaff" len={45} op={0.55} />
              <ForceArrow x={CX + atomSep - 95} y={CY} dx={-1} dy={0} color="#ff8866" len={45} op={0.55} />
            </>
          ) : null}

          {forceArrOp > 0.05 ? (
            <g opacity={forceArrOp}>
              <ForceArrow x={CX - 92} y={CY} dx={-1} dy={0} color="#66aaff" len={62} />
              <ForceArrow x={CX - 110} y={CY - 35} dx={-1} dy={-0.5} color="#66aaff" len={52} />
              <ForceArrow x={CX - 110} y={CY + 35} dx={-1} dy={0.5} color="#66aaff" len={52} />
              <ForceArrow x={CX + 92} y={CY} dx={1} dy={0} color="#ff8866" len={62} />
              <ForceArrow x={CX + 110} y={CY - 35} dx={1} dy={-0.5} color="#ff8866" len={52} />
              <ForceArrow x={CX + 110} y={CY + 35} dx={1} dy={0.5} color="#ff8866" len={52} />
            </g>
          ) : null}
        </svg>

        <div
          style={{
            position: "absolute",
            top: 48,
            width: "100%",
            textAlign: "center",
            color: "rgba(255,200,90,0.90)",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          ELECTROMAGNETIC REPULSION
        </div>

        {repelLabel ? (
          <div
            style={{
              position: "absolute",
              top: CY + 110,
              width: "100%",
              textAlign: "center",
              color: "rgba(255,90,90,0.90)",
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            Closest approach -- never actually touching
          </div>
        ) : null}
      </div>

      <div style={{ position: "absolute", inset: 0, opacity: wallOp, pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            right: W * 0.26,
            top: H * 0.18,
            width: 24,
            height: H * 0.64,
            background: "linear-gradient(90deg,#7a5c3a,#b8885a,#7a5c3a)",
            borderRadius: 5,
            transform: `skewX(${-wallDent * 0.4}deg) scaleX(${1 + wallDent * 0.006})`,
            transformOrigin: "right center",
            boxShadow: "6px 0 22px rgba(0,0,0,0.45)",
          }}
        />

        <div style={{ position: "absolute", left: handX - 55, top: CY - 65 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 25,
                height: 70 + i * 6,
                background: "radial-gradient(ellipse at 38% 30%, #f8ccaa, #c07848)",
                borderRadius: "44% 44% 22% 22%",
                left: i * 29,
                bottom: 0,
                transform: `rotate(${(i - 2) * 4}deg)`,
                transformOrigin: "bottom center",
              }}
            />
          ))}
        </div>

        {wp > 0.38 ? (
          <svg style={{ position: "absolute", inset: 0 }} width={W} height={H}>
            {[-40, -20, 0, 20, 40].map((dy, i) => (
              <React.Fragment key={i}>
                <ForceArrow x={W * 0.55} y={CY + dy} dx={-1} dy={0} color="#55ffcc" len={36} op={0.75} />
                <ForceArrow x={W * 0.63} y={CY + dy} dx={1} dy={0} color="#ffcc44" len={36} op={0.75} />
              </React.Fragment>
            ))}
          </svg>
        ) : null}

        <div
          style={{
            position: "absolute",
            top: 52,
            width: "100%",
            textAlign: "center",
            color: "rgba(255,255,255,0.55)",
            fontSize: 18,
            letterSpacing: 2,
          }}
        >
          ELECTROSTATIC FORCE FIELDS
        </div>
        <div
          style={{
            position: "absolute",
            bottom: H * 0.22,
            width: "100%",
            textAlign: "center",
            color: "rgba(90,220,170,0.85)",
            fontSize: 19,
            fontWeight: 600,
          }}
        >
          Force meeting force -- no surface contact required
        </div>
      </div>

      <div style={{ position: "absolute", inset: 0, opacity: bounceOp, pointerEvents: "none" }}>
        <GroundLayer W={W} H={H} GY={GY} />
        <svg style={{ position: "absolute", inset: 0 }} width={W} height={H}>
          <ForceArrow x={CX} y={bounceY - 30} dx={0} dy={1} color="#ff6644" len={55} op={0.8} />
          <ForceArrow x={CX} y={GY - 8} dx={0} dy={-1} color="#44aaff" len={50} op={nearFloor * 0.9} />
          {nearFloor > 0.5 ? (
            <>
              <ellipse
                cx={CX}
                cy={GY}
                rx={nearFloor * 55}
                ry={nearFloor * 12}
                fill="none"
                stroke="#44aaff"
                strokeWidth={1.5}
                opacity={nearFloor * 0.45}
              />
              <ellipse
                cx={CX}
                cy={GY}
                rx={nearFloor * 90}
                ry={nearFloor * 18}
                fill="none"
                stroke="#44aaff"
                strokeWidth={1}
                opacity={nearFloor * 0.22}
              />
            </>
          ) : null}
        </svg>
        <Ball cx={CX} cy={bounceY} r={26} />
        <div
          style={{
            position: "absolute",
            top: 52,
            width: "100%",
            textAlign: "center",
            color: "rgba(255,200,90,0.85)",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          FORCE MEETING FORCE
        </div>
        <div
          style={{
            position: "absolute",
            top: bounceY - 65,
            left: CX + 36,
            color: "#ff6644",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          gravity
        </div>
        <div
          style={{
            position: "absolute",
            top: GY - 70,
            left: CX + 36,
            color: "#44aaff",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          normal force
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: texOp,
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 44,
        }}
      >
        {textures.map((t, i) => {
          const threshold = i * 0.28;
          const tOp = interpolate(tp, [threshold, threshold + 0.12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={i}
              style={{
                width: 210,
                height: 210,
                borderRadius: 14,
                background: t.bg,
                boxShadow: "0 8px 34px rgba(0,0,0,0.65)",
                opacity: tOp,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                paddingBottom: 14,
              }}
            >
              <span
                style={{
                  color: "white",
                  fontWeight: 800,
                  fontSize: 20,
                  textShadow: "0 2px 8px rgba(0,0,0,0.95)",
                }}
              >
                {t.label}
              </span>
            </div>
          );
        })}
        <div
          style={{
            position: "absolute",
            top: 52,
            width: "100%",
            textAlign: "center",
            color: "rgba(255,255,255,0.5)",
            fontSize: 18,
            letterSpacing: 3,
          }}
        >
          ALL TEXTURE IS ELECTROMAGNETIC
        </div>
      </div>

      <div style={{ position: "absolute", inset: 0, opacity: zOutOp, pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${zOutScale})`,
            transformOrigin: "center",
          }}
        >
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            <AtomSVG cx={CX} cy={CY} r={110} frame={frame} color="#aaddff" speedMul={1.2} />
          </svg>
        </div>
        <div
          style={{
            position: "absolute",
            left: CX - 68,
            top: CY - 90,
            opacity: handReveal,
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 26,
                height: 76 + i * 5,
                background: "radial-gradient(ellipse at 38% 30%, #f8ccaa, #c07848)",
                borderRadius: "44% 44% 22% 22%",
                left: i * 30,
                bottom: 0,
                transform: `rotate(${(i - 2) * 5}deg)`,
                transformOrigin: "bottom center",
              }}
            />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: H * 0.2,
            width: "100%",
            textAlign: "center",
            color: "rgba(180,210,255,0.70)",
            fontSize: 20,
            fontWeight: 600,
            opacity: handReveal,
          }}
        >
          Zoom out -&gt; atoms inside your hand
        </div>
      </div>

      <div style={{ position: "absolute", inset: 0, opacity: charsOp, pointerEvents: "none" }}>
        <GroundLayer W={W} H={H} GY={GY} />

        <Figure
          x={aX}
          groundY={GY}
          color="#3a7fd8"
          armL={aArmL}
          armR={-14}
          legL={aLegSwing}
          legR={-aLegSwing}
        />

        {frame >= S.handoff.f ? (
          <Figure
            x={bX}
            groundY={GY}
            color="#d84c3a"
            flip
            armL={bArmSwing}
            armR={-bArmSwing}
            legL={bLegSwing}
            legR={-bLegSwing}
          />
        ) : null}

        {ballOp > 0 && ballR > 0 ? (
          <Ball cx={ballX} cy={ballY_} r={ballR} opacity={ballOp} />
        ) : null}

        {frame < S.handoff.f ? (
          <div
            style={{
              position: "absolute",
              top: aBallY - 50,
              left: aX + 30,
              color: "rgba(100,220,255,0.75)",
              fontSize: 13,
              fontWeight: 600,
              borderBottom: "1px dashed rgba(100,220,255,0.4)",
              paddingBottom: 3,
            }}
          >
            ~1 angstrom gap -- forces only
          </div>
        ) : null}
      </div>

      <div style={{ position: "absolute", inset: 0, opacity: throwOp, pointerEvents: "none" }}>
        <GroundLayer W={W} H={H} GY={GY} />
        <Figure x={bX} groundY={GY} color="#d84c3a" flip armR={-78} armL={18} legL={-12} legR={18} />
        {ballOp > 0 && ballR > 0 ? (
          <Ball cx={ballX} cy={ballY_} r={ballR} opacity={ballOp} />
        ) : null}
      </div>

      <div style={{ position: "absolute", inset: 0, opacity: streetOp, pointerEvents: "none" }}>
        <GroundLayer W={W} H={H} GY={GY} dark />

        <Figure x={290} groundY={GY} color="#3a7fd8" armL={8} armR={-8} />
        <Figure x={officerX} groundY={GY} color="#6a7a8a" flip armL={-12} armR={12} />

        <div
          style={{
            position: "absolute",
            left: W * 0.46,
            top: GY - 22,
            width: 72,
            height: 22,
            background: "#d4884a",
            borderRadius: 11,
            boxShadow: "0 3px 9px rgba(0,0,0,0.5)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: W * 0.475,
            top: GY - 40,
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "#f5c89a",
            boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            color: "#333",
            fontWeight: 900,
            letterSpacing: 2,
          }}
        >
          x x
        </div>

        <div
          style={{
            position: "absolute",
            top: 52,
            width: "100%",
            textAlign: "center",
            color: "rgba(255,200,90,0.85)",
            fontSize: 24,
            fontWeight: 800,
          }}
        >
          A curious... legal argument
        </div>
      </div>

      <div style={{ position: "absolute", inset: 0, opacity: punchOp, pointerEvents: "none" }}>
        <GroundLayer W={W} H={H} GY={GY} dark />

        <Figure x={290} groundY={GY} color="#3a7fd8" armL={22} armR={-6} />
        <Figure x={W * 0.6} groundY={GY} color="#6a7a8a" flip armL={-12} armR={12} />

        <div
          style={{
            position: "absolute",
            left: W * 0.46,
            top: GY - 22,
            width: 72,
            height: 22,
            background: "#d4884a",
            borderRadius: 11,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: W * 0.475,
            top: GY - 40,
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "#f5c89a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            color: "#333",
            fontWeight: 900,
            letterSpacing: 2,
          }}
        >
          x x
        </div>

        <div
          style={{
            position: "absolute",
            left: 135,
            top: GY - 310,
            background: "rgba(255,255,255,0.96)",
            color: "#111",
            borderRadius: 16,
            padding: "14px 22px",
            fontSize: 21,
            fontWeight: 700,
            maxWidth: 420,
            boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
            opacity: bubbleOp,
            lineHeight: 1.55,
          }}
        >
          <div>"So yes, officer...</div>
          <div>technically I did not touch that kid."</div>
          <div
            style={{
              position: "absolute",
              bottom: -15,
              left: 44,
              width: 0,
              height: 0,
              borderLeft: "13px solid transparent",
              borderRight: "13px solid transparent",
              borderTop: "15px solid rgba(255,255,255,0.96)",
            }}
          />
        </div>

        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(3,5,14,0.90)",
            opacity: titleCardOp,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              color: "white",
              fontSize: 52,
              fontWeight: 900,
              textAlign: "center",
              textShadow: "0 0 50px rgba(120,180,255,0.65)",
              letterSpacing: 1,
            }}
          >
            Touch is an illusion.
          </div>
          <div
            style={{
              color: "#66aaff",
              fontSize: 38,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            Physics is real.
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: 24,
              marginTop: 8,
            }}
          >
            And it is hilarious.
          </div>
        </div>
      </div>

      {sub ? (
        <div
          style={{
            position: "absolute",
            bottom: 38,
            left: 0,
            right: 0,
            textAlign: "center",
            pointerEvents: "none",
            opacity: fadeScene(frame, sub.f, sub.t, 12),
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "rgba(0,0,0,0.58)",
              backdropFilter: "blur(4px)",
              borderRadius: 9,
              padding: "10px 26px",
            }}
          >
            {sub.lines.map((line, i) => (
              <div
                key={i}
                style={{
                  color: "white",
                  fontSize: 27,
                  fontWeight: 600,
                  textShadow: "0 1px 7px rgba(0,0,0,0.95)",
                  lineHeight: 1.5,
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
