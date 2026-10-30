import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

// Timing constants (frames at 30 fps)
const T = {
  bounceStart: 0,
  bounceEnd: 300,
  bWalkStart: 300,
  bWalkEnd: 480,
  throwStart: 480,
  throwEnd: 630,
  flyStart: 630,
  flyEnd: 810,
  holdStart: 810,
  holdEnd: 900,
};

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

interface CharProps {
  x: number;
  groundY: number;
  color: string;
  flip?: boolean;
  armAngleL?: number;
  armAngleR?: number;
  legAngleL?: number;
  legAngleR?: number;
  holdBall?: boolean;
}

const Character: React.FC<CharProps> = ({
  x,
  groundY,
  color,
  flip = false,
  armAngleL = 0,
  armAngleR = 0,
  legAngleL = 0,
  legAngleR = 0,
}) => {
  const H = 720;
  const scale = H / 720;

  const headR = 28 * scale;
  const bodyH = 70 * scale;
  const bodyW = 36 * scale;
  const limbW = 10 * scale;
  const armLen = 48 * scale;
  const legLen = 56 * scale;
  const footLen = 18 * scale;

  const bodyTop = groundY - legLen - bodyH;
  const headCY = bodyTop - headR - 4 * scale;
  const shoulderY = bodyTop + 12 * scale;
  const hipY = bodyTop + bodyH;

  const mirrorX = (px: number) => (flip ? 2 * x - px : px);

  const armStyle = (
    angle: number,
    side: "left" | "right"
  ): React.CSSProperties => {
    const base = side === "left" ? -90 + angle : -90 - angle;
    const originX = side === "left" ? x - bodyW / 2 : x + bodyW / 2;
    return {
      position: "absolute",
      width: limbW,
      height: armLen,
      background: color,
      borderRadius: limbW / 2,
      left: mirrorX(originX) - limbW / 2,
      top: shoulderY,
      transformOrigin: `${limbW / 2}px 0px`,
      transform: `rotate(${base}deg)`,
    };
  };

  const legStyle = (
    angle: number,
    side: "left" | "right"
  ): React.CSSProperties => {
    const originX = side === "left" ? x - bodyW / 4 : x + bodyW / 4;
    return {
      position: "absolute",
      width: limbW,
      height: legLen,
      background: "#2a2a5a",
      borderRadius: limbW / 2,
      left: mirrorX(originX) - limbW / 2,
      top: hipY,
      transformOrigin: `${limbW / 2}px 0px`,
      transform: `rotate(${angle}deg)`,
    };
  };

  return (
    <>
      <div style={armStyle(armAngleL, "left")} />
      <div style={armStyle(armAngleR, "right")} />

      <div
        style={{
          position: "absolute",
          width: bodyW,
          height: bodyH,
          background: color,
          borderRadius: 6,
          left: mirrorX(x) - bodyW / 2,
          top: bodyTop,
        }}
      />

      <div
        style={{
          position: "absolute",
          width: headR * 2,
          height: headR * 2,
          borderRadius: "50%",
          background: "#f5c89a",
          left: mirrorX(x) - headR,
          top: headCY - headR,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          padding: "8px 10px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: 6,
            height: 7,
            borderRadius: "50%",
            background: "#222",
          }}
        />
        <div
          style={{
            width: 6,
            height: 7,
            borderRadius: "50%",
            background: "#222",
          }}
        />
      </div>

      <div style={legStyle(legAngleL, "left")} />
      <div style={legStyle(legAngleR, "right")} />

      {(
        [
          { side: "left" as const, angle: legAngleL },
          { side: "right" as const, angle: legAngleR },
        ]
      ).map(({ side, angle }) => {
        const lx = side === "left" ? x - bodyW / 4 : x + bodyW / 4;
        const rad = (angle * Math.PI) / 180;
        const sx = mirrorX(lx) + Math.sin(rad) * legLen - limbW / 2;
        const sy = hipY + Math.cos(rad) * legLen;
        return (
          <div
            key={side}
            style={{
              position: "absolute",
              width: footLen,
              height: limbW,
              background: "#111",
              borderRadius: limbW / 2,
              left: sx,
              top: sy,
            }}
          />
        );
      })}
    </>
  );
};

const Ball: React.FC<{
  cx: number;
  cy: number;
  radius: number;
  opacity?: number;
}> = ({ cx, cy, radius, opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      width: radius * 2,
      height: radius * 2,
      borderRadius: "50%",
      background: "radial-gradient(circle at 35% 35%, #ffb347, #e05e00)",
      boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
      left: cx - radius,
      top: cy - radius,
      opacity,
    }}
  />
);

const PHASES = [
  { from: T.bounceStart, label: "Phase 1 · Character A bounces the ball" },
  {
    from: T.bWalkStart,
    label: "Phase 2 · Character B walks in and takes the ball",
  },
  { from: T.throwStart, label: "Phase 3 · Character B throws the ball skyward" },
  { from: T.flyStart, label: "Phase 4 · The ball flies high..." },
  { from: T.holdStart, label: "Phase 5 · The ball never returned." },
];

const getPhaseLabel = (frame: number) => {
  let label = PHASES[0].label;
  for (const phase of PHASES) {
    if (frame >= phase.from) {
      label = phase.label;
    }
  }
  return label;
};

export const BallStoryClaude: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const groundY = height * 0.82;
  const ballBaseR = 22;

  const aX = 280;

  const bXStart = width + 100;
  const bXEnd = 520;
  const bX = interpolate(frame, [T.bWalkStart, T.bWalkEnd], [bXStart, bXEnd], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bounceAmp = 90;
  const bounceFreq = 0.08;
  const bounceY =
    groundY -
    ballBaseR -
    Math.abs(Math.sin(frame * bounceFreq * Math.PI)) * bounceAmp;

  const ballHandOffsetX = -40;
  const ballPhase2X = interpolate(
    frame,
    [T.bWalkStart, T.bWalkEnd],
    [aX + 50, bXEnd + ballHandOffsetX],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const ballPhase2Y = groundY - 120;

  const throwProgress = interpolate(frame, [T.throwStart, T.throwEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const throwX = bXEnd + ballHandOffsetX + throwProgress * 30;
  const throwY = ballPhase2Y - throwProgress * 320;

  const flyProgress = interpolate(frame, [T.flyStart, T.flyEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const flyX = throwX + flyProgress * 10;
  const flyY = throwY - flyProgress * (height * 0.9);
  const flyOpacity = interpolate(frame, [T.flyStart + 30, T.flyEnd], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const flyRadius = ballBaseR * (1 - flyProgress * 0.7);

  let ballX: number;
  let ballY: number;
  let ballRadius: number;
  let ballOpacity: number;
  if (frame < T.bWalkStart) {
    ballX = aX + 50;
    ballY = bounceY;
    ballRadius = ballBaseR;
    ballOpacity = 1;
  } else if (frame < T.throwStart) {
    ballX = ballPhase2X;
    ballY = ballPhase2Y;
    ballRadius = ballBaseR;
    ballOpacity = 1;
  } else if (frame < T.flyStart) {
    ballX = throwX;
    ballY = throwY;
    ballRadius = ballBaseR;
    ballOpacity = 1;
  } else if (frame < T.holdStart) {
    ballX = flyX;
    ballY = flyY;
    ballRadius = flyRadius;
    ballOpacity = flyOpacity;
  } else {
    ballX = flyX;
    ballY = -100;
    ballRadius = 0;
    ballOpacity = 0;
  }

  const aBounceSwing = Math.sin(frame * bounceFreq * Math.PI * 2) * 20;
  const aLegSwing = Math.sin(frame * 0.15) * 12;

  let aArmL = 40 + aBounceSwing;
  let aArmR = -20;
  let aLegL = aLegSwing;
  let aLegR = -aLegSwing;

  if (frame >= T.bWalkStart) {
    aArmL = 10;
    aArmR = -10;
    aLegL = 0;
    aLegR = 0;
  }

  const walkCycle = Math.sin(frame * 0.3) * 20;
  let bArmL = frame < T.bWalkEnd ? walkCycle : 10;
  let bArmR = frame < T.bWalkEnd ? -walkCycle : -10;
  let bLegL = frame < T.bWalkEnd ? walkCycle : 0;
  let bLegR = frame < T.bWalkEnd ? -walkCycle : 0;

  if (frame >= T.throwStart && frame < T.flyStart) {
    const throwProgressLocal = interpolate(
      frame,
      [T.throwStart, T.throwEnd],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    bArmR = -80 * throwProgressLocal;
    bArmL = 20;
    bLegL = -10;
    bLegR = 15;
  }

  const stars = React.useMemo(() => {
    const arr: { x: number; y: number; r: number; tw: number }[] = [];
    for (let i = 0; i < 80; i += 1) {
      arr.push({
        x: Math.random() * width,
        y: Math.random() * groundY * 0.9,
        r: Math.random() * 2 + 0.5,
        tw: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, []);

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
        fontFamily: "Segoe UI, sans-serif",
        background:
          "linear-gradient(180deg, #050a1a 0%, #0d1a3a 60%, #1a2a50 100%)",
      }}
    >
      {stars.map((star, i) => {
        const twinkle = 0.5 + 0.5 * Math.sin(frame * 0.05 + star.tw);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: star.r * 2,
              height: star.r * 2,
              borderRadius: "50%",
              background: "#ffffff",
              left: star.x,
              top: star.y,
              opacity: twinkle,
            }}
          />
        );
      })}

      <div
        style={{
          position: "absolute",
          width: 70,
          height: 70,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #fffbe0, #d4c56a)",
          left: width - 130,
          top: 60,
          boxShadow: "0 0 30px 6px rgba(255,240,100,0.15)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          top: groundY,
          width,
          height: height - groundY,
          background: "linear-gradient(180deg, #1a3a22 0%, #0d2016 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: groundY - 2,
          width,
          height: 3,
          background: "#2e6b38",
          boxShadow: "0 0 12px rgba(46,107,56,0.6)",
        }}
      />

      <Character
        x={aX}
        groundY={groundY}
        color="#3a6fd8"
        armAngleL={aArmL}
        armAngleR={aArmR}
        legAngleL={aLegL}
        legAngleR={aLegR}
      />

      {frame >= T.bWalkStart ? (
        <Character
          x={bX}
          groundY={groundY}
          color="#d84c3a"
          flip
          armAngleL={bArmL}
          armAngleR={bArmR}
          legAngleL={bLegL}
          legAngleR={bLegR}
        />
      ) : null}

      {ballOpacity > 0 && ballRadius > 0 ? (
        <Ball cx={ballX} cy={ballY} radius={ballRadius} opacity={ballOpacity} />
      ) : null}

      <div
        style={{
          position: "absolute",
          top: 36,
          left: 40,
          color: "#e8d9ff",
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: 0.5,
          textShadow: "0 2px 12px rgba(0,0,0,0.8)",
        }}
      >
        The Ball That Never Returned
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 36,
          left: 40,
          color: "#a0c8ff",
          fontSize: 20,
          fontWeight: 500,
          textShadow: "0 1px 8px rgba(0,0,0,0.9)",
        }}
      >
        {getPhaseLabel(frame)}
      </div>

      {frame >= T.holdStart ? (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#ffeedd",
            fontSize: 38,
            fontWeight: 800,
            textAlign: "center",
            opacity: interpolate(frame, [T.holdStart, T.holdStart + 45], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            textShadow: "0 0 30px rgba(255,160,80,0.6)",
            letterSpacing: 1,
          }}
        >
          ...and the ball never came back.
        </div>
      ) : null}
    </div>
  );
};
