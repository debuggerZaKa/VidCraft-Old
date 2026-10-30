import { useMemo, useState } from "react";
import { Player } from "@remotion/player";
import {
  GeneratedComposition,
  GENERATED_META,
} from "../remotion/generated/GeneratedComposition.jsx";

export const RemotionScriptPlayer = ({ generationId, meta }) => {
  const [retryTick, setRetryTick] = useState(0);

  const durationInFrames = useMemo(() => {
    const raw =
      GENERATED_META?.durationInFrames ||
      meta?.durationInFrames ||
      1800;
    return Math.min(5400, Math.max(900, Number(raw) || 1800));
  }, [meta, retryTick, generationId]);

  if (!GeneratedComposition) {
    return (
      <div className="vc-error">
        Generated file has no GeneratedComposition export.
      </div>
    );
  }

  return (
    <div className="vc-remotion-player">
      <Player
        key={`${generationId}-${retryTick}`}
        component={GeneratedComposition}
        durationInFrames={durationInFrames}
        fps={30}
        compositionWidth={1280}
        compositionHeight={720}
        controls
        loop
        autoPlay
        style={{ width: "100%", height: "100%" }}
        errorFallback={({ error }) => (
          <div
            style={{
              color: "#fecaca",
              background: "#111827",
              width: "100%",
              height: "100%",
              display: "grid",
              placeItems: "center",
              gap: 12,
              padding: 24,
              textAlign: "center",
              fontFamily: "Segoe UI, sans-serif",
            }}
          >
            <div>{error?.message || "Remotion render error"}</div>
            <button
              type="button"
              onClick={() => setRetryTick((n) => n + 1)}
              style={{
                background: "#F59E0B",
                color: "#0A0E1B",
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}
      />
    </div>
  );
};
