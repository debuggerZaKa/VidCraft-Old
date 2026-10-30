import { useMemo, useState } from "react";
import { Player } from "@remotion/player";
import { COLORS } from "../config/vidcraft";
import { PREVIEW_COMPOSITIONS } from "../remotion/previewRegistry";

export const RemotionPreview = () => {
  const [selectedId, setSelectedId] = useState(PREVIEW_COMPOSITIONS[0]?.id);
  const composition = useMemo(
    () => PREVIEW_COMPOSITIONS.find((item) => item.id === selectedId),
    [selectedId]
  );

  if (!composition) {
    return null;
  }

  return (
    <div className="vc-card" style={{ marginBottom: 18 }}>
      <div className="vc-lbl">REMOTION PREVIEW</div>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <select
          className="vc-inp"
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          style={{ maxWidth: 240 }}
        >
          {PREVIEW_COMPOSITIONS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </div>
      <div
        style={{
          width: "100%",
          aspectRatio: "16 / 9",
          borderRadius: 12,
          overflow: "hidden",
          border: `1px solid ${COLORS.border}`,
          background: "#000",
        }}
      >
        <Player
          component={composition.component}
          durationInFrames={composition.durationInFrames}
          fps={composition.fps}
          compositionWidth={composition.width}
          compositionHeight={composition.height}
          controls
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
};
