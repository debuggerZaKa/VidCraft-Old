import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const S = {
  intro: { f: 0, t: 300 },
  pressure: { f: 300, t: 900 },
  stress: { f: 900, t: 1500 },
  talk: { f: 1500, t: 1950 },
  support: { f: 1950, t: 2400 },
  close: { f: 2400, t: 2700 },
};

const SUBS = [
  {
    f: 0,
    t: 300,
    lines: ["In many homes, the first question comes quickly.", "Any good news?"],
  },
  {
    f: 300,
    t: 900,
    lines: [
      "The pressure can feel heavy, even with love behind it.",
      "A couple is still learning to be a team.",
    ],
  },
  {
    f: 900,
    t: 1500,
    lines: [
      "Family planning is not rejection.",
      "It is timing, health, and stability.",
    ],
  },
  {
    f: 1500,
    t: 1950,
    lines: [
      "Spacing protects the mother and the child.",
      "A calm home builds a strong future.",
    ],
  },
  {
    f: 1950,
    t: 2400,
    lines: [
      "Support starts with respect and privacy.",
      "Let the couple decide together.",
    ],
  },
  {
    f: 2400,
    t: 2700,
    lines: [
      "Ask gently. Listen kindly.",
      "Family planning is care.",
    ],
  },
];

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

const fadeScene = (frame: number, from: number, to: number, d = 24) =>
  interpolate(frame, [from, from + d, to - d, to], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

type Expression = "happy" | "worried" | "sad" | "calm" | "supportive";

const Face: React.FC<{ expression: Expression }> = ({ expression }) => {
  const eyeY = 21;
  const browY = 14;
  const mouthY = 34;
  const browTilt =
    expression === "worried"
      ? 4
      : expression === "sad"
        ? 6
        : expression === "supportive"
          ? -4
          : -2;
  const mouthCurve =
    expression === "happy"
      ? 8
      : expression === "supportive"
        ? 6
        : expression === "sad"
          ? -6
          : expression === "worried"
            ? -2
            : 0;
  const mouthPath = `M 18 ${mouthY} Q 30 ${mouthY + mouthCurve} 42 ${mouthY}`;

  return (
    <svg width={60} height={60} viewBox="0 0 60 60">
      <circle cx={30} cy={30} r={26} fill="#f5c89a" stroke="#1f2937" strokeWidth={2} />
      <circle cx={22} cy={eyeY} r={3} fill="#1f2937" />
      <circle cx={38} cy={eyeY} r={3} fill="#1f2937" />
      <line x1={16} y1={browY} x2={26} y2={browY + browTilt} stroke="#1f2937" strokeWidth={2} />
      <line x1={34} y1={browY + browTilt} x2={44} y2={browY} stroke="#1f2937" strokeWidth={2} />
      <path d={mouthPath} stroke="#1f2937" strokeWidth={2} fill="none" />
    </svg>
  );
};

const Character: React.FC<{
  x: number;
  y: number;
  scale?: number;
  shirt: string;
  pants?: string;
  expression: Expression;
  hair?: string;
  variant?: "bride" | "groom" | "elder" | "doctor" | "casual";
  accent?: string;
}> = ({
  x,
  y,
  scale = 1,
  shirt,
  pants = "#1f2937",
  expression,
  hair = "#1f2937",
  variant = "casual",
  accent = "#f472b6",
}) => {
  const isBride = variant === "bride";
  const isGroom = variant === "groom";
  const isElder = variant === "elder";
  const isDoctor = variant === "doctor";
  const showLegs = !isBride;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      <div style={{ position: "relative", width: 120, height: 200 }}>
        <div
          style={{
            position: "absolute",
            left: 30,
            top: 0,
            width: 60,
            height: 60,
            borderRadius: 999,
            background: hair,
            opacity: 0.8,
          }}
        />
        {isGroom ? (
          <div
            style={{
              position: "absolute",
              left: 22,
              top: -6,
              width: 76,
              height: 34,
              borderRadius: 12,
              background: accent,
              border: "2px solid #1f2937",
            }}
          />
        ) : null}
        {isBride ? (
          <div
            style={{
              position: "absolute",
              left: 20,
              top: 4,
              width: 82,
              height: 92,
              borderRadius: 18,
              background: "rgba(255,255,255,0.35)",
              border: "1px solid rgba(255,255,255,0.6)",
              transform: "rotate(-6deg)",
            }}
          />
        ) : null}
        <div style={{ position: "absolute", left: 30, top: 8 }}>
          <Face expression={expression} />
        </div>
        {isBride ? (
          <div
            style={{
              position: "absolute",
              left: 54,
              top: 26,
              width: 8,
              height: 8,
              borderRadius: 999,
              background: accent,
            }}
          />
        ) : null}

        <div
          style={{
            position: "absolute",
            left: 30,
            top: 70,
            width: 60,
            height: isGroom ? 92 : 80,
            borderRadius: 12,
            background: shirt,
            border: "2px solid #1f2937",
            boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
          }}
        />
        {isGroom ? (
          <div
            style={{
              position: "absolute",
              left: 32,
              top: 72,
              width: 56,
              height: 86,
              borderRadius: 10,
              border: "2px solid rgba(255,255,255,0.6)",
            }}
          />
        ) : null}
        {isGroom ? (
          <div
            style={{
              position: "absolute",
              left: 26,
              top: 92,
              width: 70,
              height: 18,
              borderRadius: 10,
              background: accent,
              opacity: 0.8,
            }}
          />
        ) : null}
        {isBride ? (
          <div
            style={{
              position: "absolute",
              left: 18,
              top: 122,
              width: 84,
              height: 76,
              borderRadius: "0 0 40px 40px",
              background: accent,
              border: "2px solid #1f2937",
              boxShadow: "0 12px 20px rgba(0,0,0,0.2)",
            }}
          />
        ) : null}
        {isElder ? (
          <div
            style={{
              position: "absolute",
              left: 22,
              top: 64,
              width: 76,
              height: 28,
              borderRadius: 14,
              background: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(31,41,55,0.3)",
            }}
          />
        ) : null}
        {isDoctor ? (
          <div
            style={{
              position: "absolute",
              left: 24,
              top: 72,
              width: 72,
              height: 88,
              borderRadius: 10,
              background: "rgba(255,255,255,0.9)",
              border: "2px solid #cbd5f5",
            }}
          />
        ) : null}
        {isDoctor ? (
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 74,
              width: 40,
              height: 24,
              borderRadius: 10,
              background: "#93c5fd",
              opacity: 0.7,
            }}
          />
        ) : null}

        <div
          style={{
            position: "absolute",
            left: 18,
            top: 86,
            width: 14,
            height: 60,
            borderRadius: 999,
            background: "#f5c89a",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 18,
            top: 86,
            width: 14,
            height: 60,
            borderRadius: 999,
            background: "#f5c89a",
          }}
        />

        {showLegs ? (
          <>
            <div
              style={{
                position: "absolute",
                left: 34,
                top: 146,
                width: 22,
                height: 50,
                borderRadius: 999,
                background: pants,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 64,
                top: 146,
                width: 22,
                height: 50,
                borderRadius: 999,
                background: pants,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 30,
                top: 190,
                width: 30,
                height: 10,
                borderRadius: 999,
                background: "#0f172a",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 60,
                top: 190,
                width: 30,
                height: 10,
                borderRadius: 999,
                background: "#0f172a",
              }}
            />
          </>
        ) : null}
      </div>
    </div>
  );
};

const SpeechBubble: React.FC<{
  x: number;
  y: number;
  lines: string[];
  width?: number;
  opacity?: number;
}> = ({ x, y, lines, width = 260, opacity = 1 }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        padding: "12px 16px",
        background: "rgba(255,255,255,0.95)",
        borderRadius: 14,
        boxShadow: "0 12px 24px rgba(0,0,0,0.25)",
        opacity,
      }}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#1f2937",
            lineHeight: 1.4,
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
};

const Subtitle: React.FC<{ frame: number; width: number; height: number }> = ({
  frame,
  width,
  height,
}) => {
  const sub = SUBS.find((s) => frame >= s.f && frame < s.t);
  if (!sub) return null;
  const op = fadeScene(frame, sub.f, sub.t, 12);
  return (
    <div
      style={{
        position: "absolute",
        bottom: 30,
        left: 0,
        right: 0,
        textAlign: "center",
        opacity: op,
      }}
    >
      <div
        style={{
          display: "inline-block",
          background: "rgba(0,0,0,0.6)",
          padding: "10px 24px",
          borderRadius: 10,
          maxWidth: width - 120,
        }}
      >
        {sub.lines.map((line, i) => (
          <div
            key={i}
            style={{
              color: "#f8fafc",
              fontSize: 24,
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};

const WeddingRoomBackground: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, #2b1b2a 0%, #1a1020 60%, #120a16 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width * 0.1,
          top: height * 0.18,
          width: width * 0.35,
          height: height * 0.26,
          borderRadius: 18,
          background: "linear-gradient(180deg, #f5d0fe 0%, #a855f7 100%)",
          opacity: 0.18,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width * 0.2,
          top: height * 0.62,
          width: width * 0.6,
          height: height * 0.2,
          borderRadius: 22,
          background: "#3b1f3a",
          border: "2px solid rgba(255,255,255,0.2)",
          boxShadow: "0 16px 30px rgba(0,0,0,0.35)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width * 0.25,
          top: height * 0.58,
          width: 140,
          height: 60,
          borderRadius: 16,
          background: "#fbcfe8",
          opacity: 0.9,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: width * 0.25,
          top: height * 0.58,
          width: 140,
          height: 60,
          borderRadius: 16,
          background: "#fbcfe8",
          opacity: 0.9,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width * 0.15,
          top: height * 0.1,
          width: width * 0.7,
          height: 40,
          borderRadius: 20,
          background: "linear-gradient(90deg, #fbbf24, #f472b6, #60a5fa)",
          opacity: 0.5,
        }}
      />
    </div>
  );
};

const LivingRoomBackground: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, #142036 0%, #111827 60%, #0f172a 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width * 0.15,
          top: height * 0.62,
          width: width * 0.7,
          height: height * 0.16,
          borderRadius: 26,
          background: "#1f2937",
          boxShadow: "0 18px 30px rgba(0,0,0,0.35)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width * 0.18,
          top: height * 0.58,
          width: 120,
          height: 50,
          borderRadius: 14,
          background: "#334155",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: width * 0.22,
          top: height * 0.58,
          width: 120,
          height: 50,
          borderRadius: 14,
          background: "#334155",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width * 0.68,
          top: height * 0.4,
          width: 70,
          height: 120,
          borderRadius: 16,
          background: "#0f172a",
          border: "2px solid #334155",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width * 0.1,
          top: height * 0.24,
          width: 140,
          height: 90,
          borderRadius: 12,
          background: "#1f2937",
          border: "2px solid #334155",
        }}
      />
    </div>
  );
};

const GardenBackground: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, #0ea5e9 0%, #38bdf8 50%, #1e293b 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: height * 0.65,
          height: height * 0.35,
          background: "linear-gradient(180deg, #166534 0%, #0f172a 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width * 0.08,
          top: height * 0.5,
          width: 120,
          height: 120,
          borderRadius: 999,
          background: "#166534",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width * 0.8,
          top: height * 0.48,
          width: 150,
          height: 150,
          borderRadius: 999,
          background: "#15803d",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width * 0.2,
          top: height * 0.62,
          width: width * 0.6,
          height: 18,
          background: "#854d0e",
          opacity: 0.5,
        }}
      />
    </div>
  );
};

const ClinicBackground: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, #e2e8f0 0%, #cbd5f5 60%, #94a3b8 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width * 0.15,
          top: height * 0.62,
          width: width * 0.7,
          height: height * 0.16,
          borderRadius: 18,
          background: "#e5e7eb",
          border: "2px solid #94a3b8",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width * 0.08,
          top: height * 0.2,
          width: 120,
          height: 60,
          borderRadius: 12,
          background: "#60a5fa",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width * 0.12,
          top: height * 0.22,
          width: 40,
          height: 40,
          borderRadius: 8,
          background: "#f8fafc",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width * 0.22,
          top: height * 0.22,
          width: 40,
          height: 40,
          borderRadius: 8,
          background: "#f8fafc",
        }}
      />
    </div>
  );
};

export const FamilyPlanningStory: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const introOp = fadeScene(frame, S.intro.f, S.intro.t);
  const pressureOp = fadeScene(frame, S.pressure.f, S.pressure.t);
  const stressOp = fadeScene(frame, S.stress.f, S.stress.t);
  const talkOp = fadeScene(frame, S.talk.f, S.talk.t);
  const supportOp = fadeScene(frame, S.support.f, S.support.t);
  const closeOp = fadeScene(frame, S.close.f, S.close.t);

  const couplePop = spring({
    frame: frame - S.intro.f,
    fps,
    config: { damping: 200, stiffness: 120 },
  });

  const elderEnter = interpolate(
    frame,
    [S.pressure.f + 40, S.pressure.f + 160],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const elderXLeft = interpolate(elderEnter, [0, 1], [-120, 80]);
  const elderXRight = interpolate(elderEnter, [0, 1], [width + 40, width - 220]);

  const stressShake =
    frame >= S.stress.f && frame < S.stress.t
      ? Math.sin(frame * 0.3) * 2
      : 0;

  const docEnter = interpolate(frame, [S.support.f + 20, S.support.f + 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const docX = interpolate(docEnter, [0, 1], [width + 40, width - 260]);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0b1220 0%, #0f172a 60%, #111827 100%)",
        color: "#f8fafc",
        fontFamily: "Segoe UI, Arial, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 40,
          fontSize: 36,
          fontWeight: 800,
          opacity: interpolate(frame, [0, 20], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        After Marriage: A Gentle Conversation
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: height - 160,
          height: 160,
          background: "linear-gradient(180deg, rgba(20,30,50,0) 0%, rgba(10,14,24,0.9) 100%)",
        }}
      />

      <div style={{ position: "absolute", inset: 0, opacity: introOp }}>
        <WeddingRoomBackground width={width} height={height} />
        <Character
          x={width / 2 - 160}
          y={height / 2 - 120}
          scale={1.1 * couplePop}
          shirt="#1f2937"
          pants="#0f172a"
          expression="happy"
          variant="groom"
          accent="#fbbf24"
        />
        <Character
          x={width / 2 - 20}
          y={height / 2 - 120}
          scale={1.1 * couplePop}
          shirt="#f472b6"
          pants="#1f2937"
          expression="happy"
          hair="#6b7280"
          variant="bride"
          accent="#f43f5e"
        />
        <div
          style={{
            position: "absolute",
            left: width / 2 - 60,
            top: height / 2 - 200,
            fontSize: 24,
            color: "#fbbf24",
            opacity: 0.9,
          }}
        >
          Newly married
        </div>
      </div>

      <div style={{ position: "absolute", inset: 0, opacity: pressureOp }}>
        <LivingRoomBackground width={width} height={height} />
        <Character
          x={width / 2 - 160}
          y={height / 2 - 110}
          shirt="#60a5fa"
          expression="worried"
          variant="casual"
        />
        <Character
          x={width / 2 - 20}
          y={height / 2 - 110}
          shirt="#fca5a5"
          expression="worried"
          hair="#6b7280"
          variant="casual"
        />
        <Character
          x={elderXLeft}
          y={height / 2 - 140}
          scale={1.05}
          shirt="#a78bfa"
          expression="supportive"
          hair="#9ca3af"
          variant="elder"
        />
        <Character
          x={elderXRight}
          y={height / 2 - 140}
          scale={1.05}
          shirt="#fbbf24"
          expression="supportive"
          hair="#9ca3af"
          variant="elder"
        />
        <SpeechBubble
          x={120}
          y={height / 2 - 260}
          lines={["Any good news?", "We are all waiting."]}
          opacity={elderEnter}
        />
        <SpeechBubble
          x={width - 380}
          y={height / 2 - 260}
          lines={["It is time, beta.", "Everyone is asking."]}
          opacity={elderEnter}
        />
      </div>

      <div style={{ position: "absolute", inset: 0, opacity: stressOp }}>
        <LivingRoomBackground width={width} height={height} />
        <Character
          x={width / 2 - 180 + stressShake}
          y={height / 2 - 100}
          shirt="#60a5fa"
          expression="sad"
          variant="casual"
        />
        <Character
          x={width / 2 - 10 - stressShake}
          y={height / 2 - 100}
          shirt="#fca5a5"
          expression="sad"
          hair="#6b7280"
          variant="casual"
        />
        <SpeechBubble
          x={width / 2 - 150}
          y={height / 2 - 260}
          lines={["We need time.", "We need stability."]}
        />
      </div>

      <div style={{ position: "absolute", inset: 0, opacity: talkOp }}>
        <GardenBackground width={width} height={height} />
        <Character
          x={width / 2 - 210}
          y={height / 2 - 100}
          shirt="#60a5fa"
          expression="calm"
          variant="casual"
        />
        <Character
          x={width / 2 + 40}
          y={height / 2 - 100}
          shirt="#fca5a5"
          expression="calm"
          hair="#6b7280"
          variant="casual"
        />
        <SpeechBubble
          x={width / 2 - 220}
          y={height / 2 - 260}
          lines={["We will decide together.", "We will plan with care."]}
          width={280}
        />
      </div>

      <div style={{ position: "absolute", inset: 0, opacity: supportOp }}>
        <ClinicBackground width={width} height={height} />
        <Character
          x={width / 2 - 240}
          y={height / 2 - 100}
          shirt="#60a5fa"
          expression="calm"
          variant="casual"
        />
        <Character
          x={width / 2 - 30}
          y={height / 2 - 100}
          shirt="#fca5a5"
          expression="calm"
          hair="#6b7280"
          variant="casual"
        />
        <Character
          x={docX}
          y={height / 2 - 110}
          shirt="#e5e7eb"
          pants="#9ca3af"
          expression="supportive"
          hair="#374151"
          variant="doctor"
        />
        <SpeechBubble
          x={width / 2 + 80}
          y={height / 2 - 260}
          lines={["Spacing supports health.", "Ask a doctor you trust."]}
          width={270}
        />
      </div>

      <div style={{ position: "absolute", inset: 0, opacity: closeOp }}>
        <GardenBackground width={width} height={height} />
        <Character
          x={width / 2 - 160}
          y={height / 2 - 110}
          shirt="#60a5fa"
          expression="happy"
          variant="casual"
        />
        <Character
          x={width / 2 - 10}
          y={height / 2 - 110}
          shirt="#fca5a5"
          expression="happy"
          hair="#6b7280"
          variant="casual"
        />
        <div
          style={{
            position: "absolute",
            left: width / 2 - 320,
            top: height / 2 - 240,
            width: 640,
            textAlign: "center",
            fontSize: 34,
            fontWeight: 800,
            color: "#fbbf24",
            textShadow: "0 8px 20px rgba(0,0,0,0.4)",
          }}
        >
          Family planning is care, choice, and timing.
        </div>
        <div
          style={{
            position: "absolute",
            left: width / 2 - 260,
            top: height / 2 - 180,
            width: 520,
            textAlign: "center",
            fontSize: 22,
            color: "#e5e7eb",
          }}
        >
          Respect the couple. Support their decision.
        </div>
      </div>

      <Subtitle frame={frame} width={width} height={height} />
    </AbsoluteFill>
  );
};
