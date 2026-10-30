import { COLORS } from "../config/vidcraft";

export const CircleGauge = ({ score, color, size = 90 }) => {
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const dash = score != null ? (circ * score) / 100 : 0;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={COLORS.dim}
          strokeWidth={7}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{
            transition: "stroke-dasharray 1s cubic-bezier(.4,0,.2,1)",
            filter: `drop-shadow(0 0 5px ${color})`,
          }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        <span
          style={{
            fontSize: size > 80 ? 20 : 13,
            fontWeight: 800,
            color,
            fontFamily: "'Syne',sans-serif",
          }}
        >
          {score ?? "—"}
        </span>
        <span
          style={{
            fontSize: 8,
            color: COLORS.muted,
            letterSpacing: 1,
            fontFamily: "'JetBrains Mono',monospace",
          }}
        >
          SCORE
        </span>
      </div>
    </div>
  );
};
