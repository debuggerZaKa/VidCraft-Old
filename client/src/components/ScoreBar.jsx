import { useEffect, useState } from "react";
import { COLORS } from "../config/vidcraft";

export const ScoreBar = ({ label, color, score }) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(score ?? 0), 80);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: "#94A3B8" }}>{label}</span>
        <span
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 11,
            fontWeight: 600,
            color,
          }}
        >
          {score ?? "—"}
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: COLORS.dim, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            borderRadius: 3,
            background: `linear-gradient(90deg,${color}55,${color})`,
            width: `${width}%`,
            transition: "width .9s cubic-bezier(.4,0,.2,1)",
            boxShadow: `0 0 6px ${color}55`,
          }}
        />
      </div>
    </div>
  );
};
