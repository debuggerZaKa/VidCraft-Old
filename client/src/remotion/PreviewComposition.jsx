import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const BOX_W = 220;
const BOX_H = 64;
const GAP = 10;

export const PreviewComposition = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 18], [18, 0], {
    extrapolateRight: "clamp",
  });

  const stackItems = ["A", "B", "C"];
  const stackHeight = stackItems.length * (BOX_H + GAP) + 40;
  const stackX = Math.round(width / 2 - BOX_W / 2);
  const stackY = Math.round(height / 2 - stackHeight / 2 + 40);

  return (
    <div
      style={{
        flex: 1,
        background:
          "radial-gradient(circle at 20% 10%, #fff6e7 0%, #f0f7ee 40%, #e7eef2 100%)",
        color: "#1f2a37",
        fontFamily: "Segoe UI, Arial, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 70,
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: 0.5,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          Stack Push
        </div>
        <div style={{ fontSize: 22, opacity: 0.7, marginTop: 8 }}>
          Each box drops in by frame
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: stackX - 28,
          top: stackY - 28,
          width: BOX_W + 56,
          height: stackHeight + 28,
          borderRadius: 22,
          border: "3px solid #2f3c4a",
          boxShadow: "0 16px 40px rgba(31, 42, 55, 0.18)",
          background: "rgba(255, 255, 255, 0.4)",
        }}
      />

      {stackItems.map((label, index) => {
        const enterDelay = index * 12;
        const pop = spring({
          frame: frame - enterDelay,
          fps,
          config: { damping: 200, stiffness: 120 },
        });
        const settleY =
          stackY + stackHeight - (index + 1) * (BOX_H + GAP) - 10;
        const y = interpolate(pop, [0, 1], [height + 120, settleY], {
          extrapolateRight: "clamp",
        });
        const scale = interpolate(pop, [0, 1], [0.94, 1], {
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: stackX,
              top: y,
              width: BOX_W,
              height: BOX_H,
              borderRadius: 16,
              background:
                index === stackItems.length - 1
                  ? "linear-gradient(120deg, #ff8c42, #ffb347)"
                  : "linear-gradient(120deg, #4f8cff, #75b6ff)",
              color: "#0c1b2a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              boxShadow: "0 14px 30px rgba(15, 23, 42, 0.25)",
              transform: `scale(${scale})`,
            }}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
};
