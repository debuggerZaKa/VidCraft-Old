import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

// Constants
const W = 1280;
const H = 720;

const S = {
  intro: { f: 0, t: 240 },
  flux: { f: 240, t: 840 },
  magnetCoil: { f: 840, t: 1500 },
  faraday: { f: 1500, t: 2100 },
  lenz: { f: 2100, t: 2700 },
  generator: { f: 2700, t: 3300 },
  transformer: { f: 3300, t: 3900 },
  eddy: { f: 3900, t: 4500 },
  apps: { f: 4500, t: 5100 },
  recap: { f: 5100, t: 5400 },
};

const SUBS = [
  {
    f: 0,
    t: 240,
    lines: ["There is a quiet law of nature", "that powers our entire world."],
  },
  {
    f: 240,
    t: 840,
    lines: [
      "When a magnetic field changes,",
      "electricity appears. This is induction.",
    ],
  },
  {
    f: 840,
    t: 1500,
    lines: ["Push a magnet into a coil", "and the coil wakes up."],
  },
  {
    f: 1500,
    t: 2100,
    lines: ["Faraday measured it:", "a changing magnetic flux produces voltage."],
  },
  {
    f: 2100,
    t: 2700,
    lines: ["The induced current fights", "the change that created it."],
  },
  {
    f: 2700,
    t: 3300,
    lines: ["Spin the field and the coil", "feeds a steady flow."],
  },
  {
    f: 3300,
    t: 3900,
    lines: ["Move energy across a gap,", "without touching a wire."],
  },
  {
    f: 3900,
    t: 4500,
    lines: ["Eddy currents push back,", "turning motion into heat."],
  },
  {
    f: 4500,
    t: 5100,
    lines: ["From kitchens to chargers,", "it is the same invisible handshake."],
  },
  {
    f: 5100,
    t: 5400,
    lines: [
      "Changing magnetic fields create electric current.",
      "That is induction.",
    ],
  },
];

// Utilities
function cl(v: number, lo = 0, hi = 1) {
  return Math.min(hi, Math.max(lo, v));
}

function ci(v: number, i0: number, i1: number, o0: number, o1: number): number {
  const t = cl((v - i0) / (i1 - i0));
  return o0 + (o1 - o0) * t;
}

function fadeIn(frame: number, start: number, dur = 22) {
  return cl(ci(frame, start, start + dur, 0, 1));
}

function fadeOut(frame: number, end: number, dur = 22) {
  return cl(ci(frame, end - dur, end, 1, 0));
}

function sceneFade(frame: number, scene: { f: number; t: number }, fi = 28, fo = 28) {
  return fadeIn(frame, scene.f, fi) * fadeOut(frame, scene.t, fo);
}

function lp(frame: number, key: keyof typeof S) {
  const { f, t } = S[key];
  return cl((frame - f) / (t - f), 0, 1);
}

// SVG defs
function SVGDefs() {
  return (
    <defs>
      <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="softGlow" x="-120%" y="-120%" width="340%" height="340%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <radialGradient id="introGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.28" />
        <stop offset="100%" stopColor="#04080f" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="recapGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#04080f" stopOpacity="0" />
      </radialGradient>

      <marker id="arrowCyan" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#00d4ff" />
      </marker>
      <marker id="arrowAmber" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#fbbf24" />
      </marker>
      <marker id="arrowPink" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#f472b6" />
      </marker>
      <marker id="arrowGray" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
      </marker>
    </defs>
  );
}

function Particles({ frame, count = 28 }: { frame: number; count?: number }) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const spd = 0.042 + (i % 7) * 0.011;
        const y = ((frame * spd + i * 53.7) % (H + 60)) - 30;
        const x =
          (Math.sin(i * 2.1 + frame * 0.006) * 370 + 640 + ((i * 173) % 390)) % W;
        const op = cl(0.055 + 0.11 * Math.sin(frame * 0.04 + i * 1.9));
        const r = 1.1 + (i % 3) * 0.65;
        return (
          <circle key={i} cx={cl(x, 0, W)} cy={cl(y, 0, H)} r={r} fill="#7dd3fc" opacity={op} />
        );
      })}
    </g>
  );
}

function Coil({
  x1,
  x2,
  cy,
  ry = 55,
  turns = 8,
  color = "#94a3b8",
  opacity = 1,
  glowColor = "#fbbf24",
  glowOpacity = 0,
}: {
  x1: number;
  x2: number;
  cy: number;
  ry?: number;
  turns?: number;
  color?: string;
  opacity?: number;
  glowColor?: string;
  glowOpacity?: number;
}) {
  const tw = (x2 - x1) / turns;
  const rx = tw / 2;
  const useGlow = glowOpacity > 0.05;

  const turnsList = Array.from({ length: turns }, (_, i) => i);

  return (
    <g>
      {turnsList.map((i) => {
        const cx = x1 + i * tw + rx;
        const d = `M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy}`;
        return (
          <path
            key={`b${i}`}
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeDasharray="5 3.5"
            opacity={opacity * 0.27}
          />
        );
      })}

      {turnsList.map((i) => {
        const cx = x1 + i * tw + rx;
        const d = `M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy}`;
        return (
          <g key={`f${i}`}>
            <path
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={useGlow ? 3.2 : 2.5}
              opacity={opacity}
              filter={useGlow ? "url(#glow)" : undefined}
            />
            {useGlow ? (
              <path
                d={d}
                fill="none"
                stroke={glowColor}
                strokeWidth={2.5}
                opacity={glowOpacity}
                filter="url(#glow)"
              />
            ) : null}
          </g>
        );
      })}
    </g>
  );
}

function BarMagnet({ x, y, w = 120, h = 44 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g transform={`translate(${x},${y})`} filter="url(#glow)">
      <rect x={-w / 2} y={-h / 2} width={w / 2} height={h} rx={5} fill="#dc2626" />
      <rect x={0} y={-h / 2} width={w / 2} height={h} rx={5} fill="#2563eb" />
      <text
        x={-w / 4}
        y={7}
        textAnchor="middle"
        fill="white"
        fontSize={20}
        fontWeight="bold"
        fontFamily="Georgia, serif"
      >
        N
      </text>
      <text
        x={w / 4}
        y={7}
        textAnchor="middle"
        fill="white"
        fontSize={20}
        fontWeight="bold"
        fontFamily="Georgia, serif"
      >
        S
      </text>
    </g>
  );
}

function Subtitle({ frame }: { frame: number }) {
  const sub = SUBS.find((s) => frame >= s.f && frame < s.t);
  if (!sub) return null;
  const op = fadeIn(frame, sub.f, 15) * fadeOut(frame, sub.t, 20);
  return (
    <g opacity={op}>
      <rect x={0} y={H - 112} width={W} height={112} fill="rgba(2,5,12,0.74)" />
      <line x1={0} y1={H - 112} x2={W} y2={H - 112} stroke="#1e293b" strokeWidth={1} />
      {sub.lines.map((line, i) => (
        <text
          key={i}
          x={W / 2}
          y={H - 66 + i * 36}
          textAnchor="middle"
          fill="white"
          fontSize={26}
          fontFamily="Georgia, Times New Roman, serif"
          style={{ letterSpacing: "0.015em" }}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function IntroScene({ frame }: { frame: number }) {
  const o = sceneFade(frame, S.intro, 10, 28);
  const lf = frame - S.intro.f;
  const tO = fadeIn(frame, S.intro.f + 18, 48);
  const scl = ci(lf, 18, 90, 0.87, 1);
  const cx = W / 2;
  const cy = H / 2 - 22;

  return (
    <g opacity={o}>
      <circle cx={cx} cy={cy} r={270} fill="url(#introGrad)" opacity={0.85} filter="url(#softGlow)" />
      {[165, 225, 290].map((r) => (
        <circle
          key={r}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth={0.8}
          opacity={0.055 + 0.025 * Math.sin(lf * 0.05 + r * 0.01)}
        />
      ))}

      <g
        opacity={tO}
        transform={`translate(${cx},${cy}) scale(${scl}) translate(${-cx},${-cy})`}
      >
        <text
          x={cx}
          y={cy - 60}
          textAnchor="middle"
          fill="white"
          fontSize={62}
          fontFamily="Georgia, Times New Roman, serif"
          fontWeight="bold"
          filter="url(#glow)"
          style={{ letterSpacing: "5px" }}
        >
          ELECTROMAGNETIC
        </text>
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          fill="#00d4ff"
          fontSize={62}
          fontFamily="Georgia, Times New Roman, serif"
          fontWeight="bold"
          filter="url(#glow)"
          style={{ letterSpacing: "5px" }}
        >
          INDUCTION
        </text>
        <line
          x1={cx - 316}
          y1={cy + 36}
          x2={cx + 316}
          y2={cy + 36}
          stroke="#00d4ff"
          strokeWidth={1.2}
          opacity={0.42}
        />
        <text
          x={cx}
          y={cy + 66}
          textAnchor="middle"
          fill="#475569"
          fontSize={20}
          fontFamily="Georgia, serif"
          fontStyle="italic"
        >
          A quiet law that powers our entire world
        </text>
      </g>
    </g>
  );
}

function FluxScene({ frame }: { frame: number }) {
  const o = sceneFade(frame, S.flux);
  const lf = frame - S.flux.f;
  const phi = 0.5 + 0.5 * Math.sin(lf * 0.033);
  const n = 7;

  return (
    <g opacity={o}>
      <rect x={88} y={H / 2 - 72} width={38} height={144} rx={9} fill="#1e293b" stroke="#334155" strokeWidth={2} />
      <text
        x={107}
        y={H / 2 + 7}
        textAnchor="middle"
        fill="#64748b"
        fontSize={24}
        fontFamily="Georgia, serif"
        fontStyle="italic"
      >
        B
      </text>

      {Array.from({ length: n }, (_, i) => {
        const sy = H / 2 - 80 + i * (160 / (n - 1));
        const spread = (i - (n - 1) / 2) * 38 * phi;
        const ex = 126 + 660 * phi;
        const qx = 126 + 660 * phi * 0.5;
        const qy = sy - spread;
        const lineOp = cl(0.14 + 0.66 * phi * (1 - (Math.abs(i - (n - 1) / 2) / n) * 0.55));
        const d = `M 126 ${sy} Q ${qx} ${qy} ${ex} ${sy}`;
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="#00d4ff"
            strokeWidth={2}
            opacity={lineOp}
            markerEnd="url(#arrowCyan)"
            filter="url(#glow)"
          />
        );
      })}

      <rect x={W - 172} y={H / 2 - 132} width={70} height={264} rx={10} fill="none" stroke="#1e293b" strokeWidth={2} />
      <rect x={W - 170} y={H / 2 + 130 - 260 * phi} width={66} height={260 * phi} rx={8} fill="#00d4ff" opacity={0.72} filter="url(#glow)" />
      <text
        x={W - 137}
        y={H / 2 - 150}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize={22}
        fontFamily="Georgia, serif"
        fontStyle="italic"
      >
        Phi
      </text>
      <text
        x={W - 137}
        y={H / 2 + 152}
        textAnchor="middle"
        fill="#475569"
        fontSize={13}
        fontFamily="Georgia, serif"
      >
        Flux
      </text>

      <text
        x={W / 2 + 110}
        y={132}
        textAnchor="middle"
        fill="#fbbf24"
        fontSize={20}
        fontFamily="Georgia, serif"
        opacity={0.88}
        filter="url(#glow)"
      >
        dB -&gt; dPhi -&gt; induced EMF
      </text>
    </g>
  );
}

function MagnetCoilScene({ frame }: { frame: number }) {
  const o = sceneFade(frame, S.magnetCoil);
  const lf = frame - S.magnetCoil.f;
  const dur = S.magnetCoil.t - S.magnetCoil.f;

  const coilX1 = 380;
  const coilX2 = 855;
  const coilCY = H / 2;
  const coilRY = 68;
  const magX = ci(lf, 45, dur - 45, 70, 1100);

  const glowI = cl(ci(magX, coilX1 - 70, coilX1 + 55, 0, 1)) * cl(ci(magX, coilX2 - 55, coilX2 + 70, 1, 0));

  const ccx = (coilX1 + coilX2) / 2;
  const ccy = coilCY;
  const ccr = coilRY + 24;
  const a1 = (-135 * Math.PI) / 180;
  const a2 = (105 * Math.PI) / 180;
  const arcD = `M ${ccx + ccr * Math.cos(a1)} ${ccy + ccr * Math.sin(a1)} A ${ccr} ${ccr} 0 1 1 ${ccx + ccr * Math.cos(a2)} ${ccy + ccr * Math.sin(a2)}`;

  return (
    <g opacity={o}>
      <Coil
        x1={coilX1}
        x2={coilX2}
        cy={coilCY}
        ry={coilRY}
        turns={9}
        color="#94a3b8"
        opacity={0.9}
        glowColor="#fbbf24"
        glowOpacity={glowI}
      />

      {[coilX1, coilX2].map((xp, idx) => (
        <line
          key={idx}
          x1={xp}
          y1={coilCY - coilRY}
          x2={xp + (idx === 0 ? -52 : 52)}
          y2={coilCY - coilRY}
          stroke="#94a3b8"
          strokeWidth={2}
          opacity={0.6}
        />
      ))}

      {glowI > 0.14
        ? Array.from({ length: 5 }, (_, i) => {
            const fx = coilX1 + 75 + i * ((coilX2 - coilX1 - 150) / 4);
            return (
              <line
                key={i}
                x1={fx}
                y1={coilCY - 18}
                x2={fx + 26}
                y2={coilCY - 18}
                stroke="#fbbf24"
                strokeWidth={2.5}
                opacity={glowI * 0.78}
                markerEnd="url(#arrowAmber)"
                filter="url(#glow)"
              />
            );
          })
        : null}

      {glowI > 0.22 ? (
        <path
          d={arcD}
          fill="none"
          stroke="#fbbf24"
          strokeWidth={2.6}
          markerEnd="url(#arrowAmber)"
          opacity={glowI}
          filter="url(#glow)"
        />
      ) : null}

      {glowI > 0.1 ? (
        <rect
          x={coilX1}
          y={coilCY - coilRY - 16}
          width={coilX2 - coilX1}
          height={coilRY * 2 + 32}
          fill="#fbbf24"
          opacity={glowI * 0.055}
          rx={12}
          filter="url(#softGlow)"
        />
      ) : null}

      <BarMagnet x={magX} y={coilCY} w={115} h={44} />

      <line
        x1={magX + 66}
        y1={coilCY - 58}
        x2={magX + 98}
        y2={coilCY - 58}
        stroke="#475569"
        strokeWidth={2}
        markerEnd="url(#arrowGray)"
        opacity={0.45}
      />

      <text
        x={W / 2}
        y={118}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize={20}
        fontFamily="Georgia, serif"
        opacity={0.82}
      >
        Moving magnet -&gt; Changing flux -&gt; Induced current
      </text>

      {glowI > 0.2 ? (
        <text
          x={ccx}
          y={coilCY + coilRY + 55}
          textAnchor="middle"
          fill="#fbbf24"
          fontSize={20}
          fontFamily="Georgia, serif"
          opacity={glowI}
          filter="url(#glow)"
        >
          Current induced!
        </text>
      ) : null}
    </g>
  );
}

function FaradayScene({ frame }: { frame: number }) {
  const o = sceneFade(frame, S.faraday);
  const lf = frame - S.faraday.f;
  const eqO = fadeIn(frame, S.faraday.f + 15, 42);
  const vizO = fadeIn(frame, S.faraday.f + 105, 38);
  const phi = 0.32 + 0.68 * Math.abs(Math.sin(lf * 0.024));

  const ccx = W / 2;
  const ccy = H / 2 + 90;

  return (
    <g opacity={o}>
      <g opacity={eqO}>
        <rect
          x={W / 2 - 295}
          y={H / 2 - 170}
          width={590}
          height={114}
          rx={14}
          fill="rgba(0,212,255,0.04)"
          stroke="#0ea5e9"
          strokeWidth={1.5}
          opacity={0.5}
        />
        <text
          x={W / 2}
          y={H / 2 - 102}
          textAnchor="middle"
          fill="#00d4ff"
          fontSize={50}
          fontFamily="Georgia, Times New Roman, serif"
          fontStyle="italic"
          filter="url(#glow)"
        >
          e = -dPhi / dt
        </text>
        <text
          x={W / 2}
          y={H / 2 - 62}
          textAnchor="middle"
          fill="#475569"
          fontSize={17}
          fontFamily="Georgia, serif"
        >
          EMF equals the rate of change of magnetic flux
        </text>
      </g>

      <g opacity={vizO}>
        <Coil
          x1={ccx - 158}
          x2={ccx + 158}
          cy={ccy}
          ry={54}
          turns={5}
          color="#94a3b8"
          opacity={0.88}
          glowColor="#fbbf24"
          glowOpacity={phi * 0.78}
        />

        <text
          x={ccx - 215}
          y={ccy + 6}
          textAnchor="middle"
          fill="#0ea5e9"
          fontSize={14}
          fontFamily="Georgia, serif"
          opacity={0.7}
        >
          Phi
        </text>
        <rect x={ccx - 200} y={ccy - 7} width={118} height={10} rx={5} fill="none" stroke="#0ea5e9" strokeWidth={1.5} opacity={0.38} />
        <rect
          x={ccx - 198}
          y={ccy - 5}
          width={114 * phi}
          height={6}
          rx={4}
          fill="#00d4ff"
          opacity={0.75}
          filter="url(#glow)"
        />

        {Array.from({ length: 5 }, (_, i) => {
          const ang = ((i * 72 + lf * 2.1) * Math.PI) / 180;
          const r = 85;
          const px = ccx + r * Math.cos(ang);
          const py = ccy + r * Math.sin(ang);
          const dx = -Math.sin(ang) * 23;
          const dy = Math.cos(ang) * 23;
          return (
            <line
              key={i}
              x1={px}
              y1={py}
              x2={px + dx}
              y2={py + dy}
              stroke="#fbbf24"
              strokeWidth={2.5}
              opacity={phi * 0.82}
              markerEnd="url(#arrowAmber)"
              filter="url(#glow)"
            />
          );
        })}

        <text
          x={ccx + 218}
          y={ccy + 8}
          textAnchor="middle"
          fill="#fbbf24"
          fontSize={22}
          fontFamily="Georgia, serif"
          filter="url(#glow)"
          opacity={0.9}
        >
          {`e ~ ${(phi * 4.8).toFixed(2)} V`}
        </text>
      </g>
    </g>
  );
}

function LenzScene({ frame }: { frame: number }) {
  const o = sceneFade(frame, S.lenz);
  const lf = frame - S.lenz.f;
  const dur = S.lenz.t - S.lenz.f;
  const arO = fadeIn(frame, S.lenz.f + 28, 32);

  const coilCX = W / 2;
  const coilCY = H / 2 + 12;
  const magX = ci(lf, 0, dur * 0.78, 88, 362);
  const pulse = 0.48 + 0.52 * Math.sin(lf * 0.1);

  const oppArrows = [-22, 0, 22] as const;

  return (
    <g opacity={o}>
      <text
        x={W / 2}
        y={128}
        textAnchor="middle"
        fill="#f472b6"
        fontSize={36}
        fontFamily="Georgia, Times New Roman, serif"
        fontWeight="bold"
        filter="url(#glow)"
        opacity={fadeIn(frame, S.lenz.f + 30, 32)}
      >
        Lenz's Law
      </text>
      <text
        x={W / 2}
        y={168}
        textAnchor="middle"
        fill="#64748b"
        fontSize={18}
        fontFamily="Georgia, serif"
        opacity={fadeIn(frame, S.lenz.f + 55, 32)}
      >
        The induced current opposes the change that created it
      </text>

      <Coil
        x1={coilCX - 142}
        x2={coilCX + 142}
        cy={coilCY}
        ry={66}
        turns={6}
        color="#94a3b8"
        opacity={0.9}
        glowColor="#f472b6"
        glowOpacity={0.44}
      />

      <BarMagnet x={magX} y={coilCY} w={110} h={40} />

      <g opacity={arO}>
        <line
          x1={magX + 60}
          y1={coilCY}
          x2={coilCX - 92}
          y2={coilCY}
          stroke="#00d4ff"
          strokeWidth={3}
          markerEnd="url(#arrowCyan)"
          filter="url(#glow)"
          opacity={0.82}
        />
        <text
          x={(magX + 60 + coilCX - 92) / 2}
          y={coilCY - 20}
          textAnchor="middle"
          fill="#00d4ff"
          fontSize={15}
          fontFamily="Georgia, serif"
          opacity={0.76}
        >
          B (incoming -&gt;)
        </text>
      </g>

      <g opacity={arO * pulse}>
        {oppArrows.map((dy) => (
          <line
            key={dy}
            x1={coilCX + 92}
            y1={coilCY + dy}
            x2={coilCX + 278}
            y2={coilCY + dy}
            stroke="#f472b6"
            strokeWidth={2.6}
            markerEnd="url(#arrowPink)"
            filter="url(#glow)"
            opacity={0.76}
          />
        ))}
        <text
          x={coilCX + 185}
          y={coilCY - 44}
          textAnchor="middle"
          fill="#f472b6"
          fontSize={15}
          fontFamily="Georgia, serif"
          opacity={0.88}
        >
          B_induced (opposing)
        </text>
      </g>

      <text
        x={magX}
        y={coilCY + 72}
        textAnchor="middle"
        fill="#fbbf24"
        fontSize={18}
        fontFamily="Georgia, serif"
        filter="url(#glow)"
        opacity={arO * pulse}
      >
        &lt;- repelled
      </text>
    </g>
  );
}

function GeneratorScene({ frame }: { frame: number }) {
  const o = sceneFade(frame, S.generator);
  const lf = frame - S.generator.f;
  const ang = (lf * 3.3 * Math.PI) / 180;

  const gcx = 355;
  const gcy = H / 2;
  const gr = 96;
  const nX = gcx + gr * Math.cos(ang);
  const nY = gcy + gr * Math.sin(ang);
  const sX = gcx - gr * Math.cos(ang);
  const sY = gcy - gr * Math.sin(ang);

  const wX0 = 576;
  const wW = 630;
  const wavePts = Array.from({ length: 220 }, (_, i) => {
    const px = wX0 + (i / 219) * wW;
    const phase = (i / 219) * 4 * Math.PI - ang * 2;
    const py = gcy + 76 * Math.sin(phase);
    return `${px},${py}`;
  }).join(" ");

  return (
    <g opacity={o}>
      <text
        x={gcx}
        y={gcy - 168}
        textAnchor="middle"
        fill="#fbbf24"
        fontSize={26}
        fontFamily="Georgia, Times New Roman, serif"
        fontWeight="bold"
        filter="url(#glow)"
        opacity={0.9}
      >
        AC Generator
      </text>

      <circle cx={gcx} cy={gcy} r={gr + 55} fill="none" stroke="#1e293b" strokeWidth={14} />
      <circle cx={gcx} cy={gcy} r={gr + 55} fill="none" stroke="#334155" strokeWidth={2} />

      {Array.from({ length: 18 }, (_, i) => {
        const a = (i / 18) * 2 * Math.PI;
        const r1 = gr + 48;
        const r2 = gr + 62;
        return (
          <line
            key={i}
            x1={gcx + r1 * Math.cos(a)}
            y1={gcy + r1 * Math.sin(a)}
            x2={gcx + r2 * Math.cos(a)}
            y2={gcy + r2 * Math.sin(a)}
            stroke="#94a3b8"
            strokeWidth={2}
            opacity={0.45}
          />
        );
      })}

      <line x1={sX} y1={sY} x2={nX} y2={nY} stroke="#1e3a5f" strokeWidth={10} strokeLinecap="round" />

      <circle cx={nX} cy={nY} r={21} fill="#dc2626" filter="url(#glow)" />
      <text x={nX} y={nY + 7} textAnchor="middle" fill="white" fontSize={16} fontWeight="bold" fontFamily="Georgia, serif">
        N
      </text>

      <circle cx={sX} cy={sY} r={21} fill="#2563eb" filter="url(#glow)" />
      <text x={sX} y={sY + 7} textAnchor="middle" fill="white" fontSize={16} fontWeight="bold" fontFamily="Georgia, serif">
        S
      </text>

      {Array.from({ length: 8 }, (_, i) => {
        const fa = ang + (i * Math.PI) / 4;
        const fx1 = gcx + (gr - 22) * Math.cos(fa);
        const fy1 = gcy + (gr - 22) * Math.sin(fa);
        const fx2 = gcx + (gr + 44) * Math.cos(fa);
        const fy2 = gcy + (gr + 44) * Math.sin(fa);
        return (
          <line
            key={i}
            x1={fx1}
            y1={fy1}
            x2={fx2}
            y2={fy2}
            stroke="#00d4ff"
            strokeWidth={1.5}
            opacity={0.2}
            markerEnd="url(#arrowCyan)"
          />
        );
      })}

      <line
        x1={gcx + gr + 56}
        y1={gcy}
        x2={wX0 - 14}
        y2={gcy}
        stroke="#334155"
        strokeWidth={2}
        markerEnd="url(#arrowGray)"
        opacity={0.48}
      />

      <text
        x={wX0 + wW / 2}
        y={gcy - 112}
        textAnchor="middle"
        fill="#fbbf24"
        fontSize={18}
        fontFamily="Georgia, serif"
        opacity={0.86}
      >
        Output: AC Voltage
      </text>
      <line x1={wX0} y1={gcy} x2={wX0 + wW} y2={gcy} stroke="#1e293b" strokeWidth={1} />
      <polyline points={wavePts} fill="none" stroke="#fbbf24" strokeWidth={2.5} filter="url(#glow)" opacity={0.9} />
    </g>
  );
}

function TransformerScene({ frame }: { frame: number }) {
  const o = sceneFade(frame, S.transformer);
  const lf = frame - S.transformer.f;

  const cX1 = 362;
  const cX2 = 714;
  const coreCY = H / 2;
  const coreH = 132;
  const pX1 = 148;
  const pX2 = cX1;
  const sX1 = cX2;
  const sX2 = 1112;

  const pulseT = (lf % 40) / 40;
  const pX = cX1 + pulseT * (cX2 - cX1);
  const sinT = Math.sin(lf * 0.088);
  const v1 = 2.2 * sinT;
  const v2 = v1 * 2;

  return (
    <g opacity={o}>
      <text
        x={W / 2}
        y={108}
        textAnchor="middle"
        fill="#fbbf24"
        fontSize={26}
        fontFamily="Georgia, Times New Roman, serif"
        fontWeight="bold"
        filter="url(#glow)"
        opacity={0.9}
      >
        Transformer: Energy Without Contact
      </text>

      <rect
        x={cX1}
        y={coreCY - coreH / 2}
        width={cX2 - cX1}
        height={coreH}
        rx={11}
        fill="rgba(30,41,59,0.85)"
        stroke="#334155"
        strokeWidth={2.5}
      />
      <text x={(cX1 + cX2) / 2} y={coreCY + 7} textAnchor="middle" fill="#475569" fontSize={15} fontFamily="Georgia, serif">
        Iron Core
      </text>

      <circle cx={pX} cy={coreCY} r={20} fill="#00d4ff" opacity={0.2} filter="url(#softGlow)" />
      <circle cx={pX} cy={coreCY} r={7} fill="#00d4ff" opacity={0.88} filter="url(#glow)" />

      <Coil
        x1={pX1}
        x2={pX2}
        cy={coreCY}
        ry={56}
        turns={5}
        color="#00d4ff"
        opacity={0.9}
        glowColor="#00d4ff"
        glowOpacity={Math.abs(v1) > 0.5 ? 0.36 : 0}
      />
      <text x={(pX1 + pX2) / 2} y={coreCY - 86} textAnchor="middle" fill="#00d4ff" fontSize={16} fontFamily="Georgia, serif">
        Primary (N1 = 5)
      </text>
      <text x={(pX1 + pX2) / 2} y={coreCY + 90} textAnchor="middle" fill="#00d4ff" fontSize={20} fontFamily="Georgia, serif" filter="url(#glow)">
        {`${v1.toFixed(1)} V`}
      </text>
      <line x1={pX1} y1={coreCY - 56} x2={pX1 - 38} y2={coreCY - 56} stroke="#00d4ff" strokeWidth={2} opacity={0.55} />
      <line x1={pX1} y1={coreCY + 56} x2={pX1 - 38} y2={coreCY + 56} stroke="#00d4ff" strokeWidth={2} opacity={0.55} />
      <text x={pX1 - 20} y={coreCY + 5} textAnchor="middle" fill="#0ea5e9" fontSize={24} fontFamily="Georgia, serif">
        ~
      </text>

      <Coil
        x1={sX1}
        x2={sX2}
        cy={coreCY}
        ry={56}
        turns={10}
        color="#fbbf24"
        opacity={0.9}
        glowColor="#fbbf24"
        glowOpacity={Math.abs(v2) > 0.5 ? 0.36 : 0}
      />
      <text x={(sX1 + sX2) / 2} y={coreCY - 86} textAnchor="middle" fill="#fbbf24" fontSize={16} fontFamily="Georgia, serif">
        Secondary (N2 = 10)
      </text>
      <text x={(sX1 + sX2) / 2} y={coreCY + 90} textAnchor="middle" fill="#fbbf24" fontSize={20} fontFamily="Georgia, serif" filter="url(#glow)">
        {`${v2.toFixed(1)} V`}
      </text>
      <line x1={sX2} y1={coreCY - 56} x2={sX2 + 38} y2={coreCY - 56} stroke="#fbbf24" strokeWidth={2} opacity={0.55} />
      <line x1={sX2} y1={coreCY + 56} x2={sX2 + 38} y2={coreCY + 56} stroke="#fbbf24" strokeWidth={2} opacity={0.55} />

      <text x={W / 2} y={coreCY + 152} textAnchor="middle" fill="#475569" fontSize={17} fontFamily="Georgia, serif" opacity={0.82}>
        N1 : N2 = 1 : 2  -&gt;  V2 = 2 x V1
      </text>
    </g>
  );
}

function EddyScene({ frame }: { frame: number }) {
  const o = sceneFade(frame, S.eddy);
  const lf = frame - S.eddy.f;

  const plateX = W / 2 - 162;
  const plateY = H / 2 + 52;
  const plateW = 324;
  const plateH = 158;

  const magY =
    lf <= 360 ? ci(lf, 0, 360, 80, plateY - 56) : plateY - 56 + 4.5 * Math.sin((lf - 360) * 0.017);

  const eddyO = cl(ci(lf, 90, 210, 0, 1));

  return (
    <g opacity={o}>
      <text x={W / 2} y={100} textAnchor="middle" fill="#fbbf24" fontSize={28} fontFamily="Georgia, Times New Roman, serif" fontWeight="bold" filter="url(#glow)" opacity={0.9}>
        Eddy Current Braking
      </text>

      <rect x={plateX} y={plateY} width={plateW} height={plateH} rx={10} fill="rgba(71,85,105,0.55)" stroke="#475569" strokeWidth={2.5} />
      <text x={W / 2} y={plateY + plateH / 2 + 6} textAnchor="middle" fill="#475569" fontSize={14} fontFamily="Georgia, serif">
        Conducting Metal Plate
      </text>

      {eddyO > 0.05
        ? Array.from({ length: 6 }, (_, i) => {
            const ecx = plateX + 32 + (i % 3) * 100;
            const ecy = plateY + 40 + Math.floor(i / 3) * 76;
            const ecr = 26 + 8 * Math.sin(lf * 0.07 + i * 1.3);
            const ecOp = eddyO * (0.36 + 0.36 * Math.sin(lf * 0.09 + i * 1.1));
            const col = i % 2 === 0 ? "#f472b6" : "#fbbf24";
            const mkId = i % 2 === 0 ? "arrowPink" : "arrowAmber";
            const a1 = ((-152 + i * 7) * Math.PI) / 180;
            const a2 = ((152 + i * 5) * Math.PI) / 180;
            const d = `M ${ecx + ecr * Math.cos(a1)} ${ecy + ecr * Math.sin(a1)} A ${ecr} ${ecr} 0 1 1 ${ecx + ecr * Math.cos(a2)} ${ecy + ecr * Math.sin(a2)}`;
            return (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={col}
                strokeWidth={2}
                markerEnd={`url(#${mkId})`}
                opacity={ecOp}
                filter="url(#glow)"
              />
            );
          })
        : null}

      <g transform={`translate(${W / 2},${magY})`} filter="url(#glow)">
        <rect x={-56} y={-22} width={56} height={44} rx={5} fill="#dc2626" />
        <rect x={0} y={-22} width={56} height={44} rx={5} fill="#2563eb" />
        <text x={-28} y={7} textAnchor="middle" fill="white" fontSize={18} fontWeight="bold" fontFamily="Georgia, serif">
          N
        </text>
        <text x={28} y={7} textAnchor="middle" fill="white" fontSize={18} fontWeight="bold" fontFamily="Georgia, serif">
          S
        </text>
      </g>

      {lf < 380 ? (
        <line x1={W / 2 + 66} y1={magY + 8} x2={W / 2 + 66} y2={magY + 44} stroke="#00d4ff" strokeWidth={2.5} markerEnd="url(#arrowCyan)" opacity={0.65} filter="url(#glow)" />
      ) : null}

      {lf > 325 ? (
        <text x={W / 2 + 88} y={magY + 6} textAnchor="start" fill="#f472b6" fontSize={18} fontFamily="Georgia, serif" filter="url(#glow)" opacity={cl(ci(lf, 325, 425, 0, 1))}>
          &lt;- Braked!
        </text>
      ) : null}

      {eddyO > 0.6 ? (
        <text x={W / 2} y={plateY + plateH + 44} textAnchor="middle" fill="#fbbf24" fontSize={17} fontFamily="Georgia, serif" opacity={eddyO * 0.85} filter="url(#glow)">
          Kinetic energy -&gt; Eddy losses -&gt; Heat (Joule heating)
        </text>
      ) : null}
    </g>
  );
}

function AppsScene({ frame }: { frame: number }) {
  const o = sceneFade(frame, S.apps);
  const lf = frame - S.apps.f;

  const apps = [
    {
      label: "Induction Cooktop",
      sub: "Eddy currents heat the pan",
      x: 198,
      delay: 0,
      color: "#f97316",
      icon: "C",
    },
    {
      label: "Wireless Charging",
      sub: "Coil-to-coil energy transfer",
      x: 640,
      delay: 55,
      color: "#fbbf24",
      icon: "W",
    },
    {
      label: "Maglev and MRI",
      sub: "Superconducting fields",
      x: 1082,
      delay: 110,
      color: "#00d4ff",
      icon: "T",
    },
  ];

  return (
    <g opacity={o}>
      <text x={W / 2} y={106} textAnchor="middle" fill="white" fontSize={28} fontFamily="Georgia, Times New Roman, serif" fontWeight="bold" filter="url(#glow)" opacity={0.9}>
        Electromagnetic Induction in Action
      </text>

      {apps.map((app, ai) => {
        const ao = fadeIn(frame, S.apps.f + app.delay, 32);
        const pulse = 1 + 0.042 * Math.sin(lf * 0.09 + ai * 1.8);
        return (
          <g key={app.label} opacity={ao}>
            <circle cx={app.x} cy={H / 2 - 14} r={90 * pulse} fill="none" stroke={app.color} strokeWidth={1.5} opacity={0.15} filter="url(#softGlow)" />
            <circle cx={app.x} cy={H / 2 - 14} r={72} fill="rgba(2,5,12,0.5)" stroke={app.color} strokeWidth={2.2} />

            {[28, 50, 72].map((r, ri) => (
              <circle
                key={ri}
                cx={app.x}
                cy={H / 2 - 14}
                r={r}
                fill="none"
                stroke={app.color}
                strokeWidth={1.4}
                opacity={(0.14 - ri * 0.03) * (1 + 0.32 * Math.sin(lf * 0.11 + ri + ai))}
                filter="url(#glow)"
              />
            ))}

            <text x={app.x} y={H / 2 + 12} textAnchor="middle" fontSize={44} fill={app.color} fontFamily="Georgia, serif" fontWeight="bold">
              {app.icon}
            </text>

            <text x={app.x} y={H / 2 + 100} textAnchor="middle" fill={app.color} fontSize={19} fontFamily="Georgia, serif" filter="url(#glow)" opacity={0.96}>
              {app.label}
            </text>
            <text x={app.x} y={H / 2 + 128} textAnchor="middle" fill="#475569" fontSize={14} fontFamily="Georgia, serif" opacity={0.78}>
              {app.sub}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function RecapScene({ frame }: { frame: number }) {
  const o = sceneFade(frame, S.recap, 32, 8);
  const lf = frame - S.recap.f;
  const l1O = fadeIn(frame, S.recap.f + 10, 38);
  const l2O = fadeIn(frame, S.recap.f + 68, 32);
  const l3O = fadeIn(frame, S.recap.f + 125, 32);
  const pulse = 1 + 0.036 * Math.sin(lf * 0.1);

  return (
    <g opacity={o}>
      <circle cx={W / 2} cy={H / 2} r={318 * pulse} fill="url(#recapGrad)" opacity={0.9} filter="url(#softGlow)" />

      <line x1={W / 2 - 375} y1={H / 2 - 92} x2={W / 2 + 375} y2={H / 2 - 92} stroke="#00d4ff" strokeWidth={1} opacity={l1O * 0.33} />
      <line x1={W / 2 - 375} y1={H / 2 + 72} x2={W / 2 + 375} y2={H / 2 + 72} stroke="#00d4ff" strokeWidth={1} opacity={l2O * 0.33} />

      <text x={W / 2} y={H / 2 - 30} textAnchor="middle" fill="white" fontSize={42} fontFamily="Georgia, Times New Roman, serif" fontWeight="bold" filter="url(#glow)" opacity={l1O}>
        Changing magnetic fields
      </text>
      <text x={W / 2} y={H / 2 + 30} textAnchor="middle" fill="#00d4ff" fontSize={42} fontFamily="Georgia, Times New Roman, serif" fontWeight="bold" filter="url(#glow)" opacity={l2O}>
        create electric current.
      </text>
      <text x={W / 2} y={H / 2 + 90} textAnchor="middle" fill="#fbbf24" fontSize={26} fontFamily="Georgia, Times New Roman, serif" filter="url(#glow)" opacity={l3O}>
        That is Electromagnetic Induction.
      </text>
    </g>
  );
}

export const InductionStory: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: "#04080f", overflow: "hidden" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <SVGDefs />

        <Particles frame={frame} count={27} />

        <IntroScene frame={frame} />
        <FluxScene frame={frame} />
        <MagnetCoilScene frame={frame} />
        <FaradayScene frame={frame} />
        <LenzScene frame={frame} />
        <GeneratorScene frame={frame} />
        <TransformerScene frame={frame} />
        <EddyScene frame={frame} />
        <AppsScene frame={frame} />
        <RecapScene frame={frame} />

        <Subtitle frame={frame} />
      </svg>
    </AbsoluteFill>
  );
};
