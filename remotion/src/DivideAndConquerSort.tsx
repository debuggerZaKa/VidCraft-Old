import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const BOX_W = 72;
const BOX_H = 46;
const GAP = 10;
const SIDE_PANEL_W = 360;
const MARGIN = 60;

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
};

type ArrayRowProps = {
  items: number[];
  y: number;
  stageStart: number;
  stageEnd?: number;
  label?: string;
  accent?: boolean;
  leftX: number;
  leftWidth: number;
};

const getOpacity = (frame: number, start: number, end?: number) => {
  const fadeIn = interpolate(frame, [start, start + 12], [0, 1], clamp);
  if (end === undefined) {
    return fadeIn;
  }

  const fadeOut = interpolate(frame, [end, end + 12], [1, 0], clamp);
  return Math.min(fadeIn, fadeOut);
};

const ArrayRow: React.FC<ArrayRowProps> = ({
  items,
  y,
  stageStart,
  stageEnd,
  label,
  accent,
  leftX,
  leftWidth,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = spring({
    frame: frame - stageStart,
    fps,
    config: { damping: 200, stiffness: 110 },
  });

  const opacity = getOpacity(frame, stageStart, stageEnd);
  const translateY = interpolate(pop, [0, 1], [18, 0], clamp);
  const scale = interpolate(pop, [0, 1], [0.96, 1], clamp);
  const rowWidth = items.length * BOX_W + (items.length - 1) * GAP;
  const x = Math.round(leftX + leftWidth / 2 - rowWidth / 2);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
      }}
    >
      {label ? (
        <div
          style={{
            position: "absolute",
            left: -110,
            top: 10,
            fontSize: 16,
            fontWeight: 600,
            color: "#3c4b5f",
            letterSpacing: 0.2,
          }}
        >
          {label}
        </div>
      ) : null}
      <div style={{ display: "flex", gap: GAP }}>
        {items.map((value, index) => (
          <div
            key={`${value}-${index}`}
            style={{
              width: BOX_W,
              height: BOX_H,
              borderRadius: 12,
              background: accent
                ? "linear-gradient(120deg, #ffb347, #ffcc80)"
                : "linear-gradient(120deg, #4f8cff, #75b6ff)",
              boxShadow: "0 10px 22px rgba(15, 23, 42, 0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 700,
              color: "#0b1b2b",
            }}
          >
            {value}
          </div>
        ))}
      </div>
    </div>
  );
};

type StepProps = {
  index: number;
  title: string;
  body: string;
  start: number;
};

const Step: React.FC<StepProps> = ({ index, title, body, start }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - start, fps, config: { damping: 200 } });
  const opacity = interpolate(pop, [0, 1], [0, 1], clamp);
  const translateY = interpolate(pop, [0, 1], [12, 0], clamp);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        marginBottom: 18,
      }}
    >
      <div style={{ fontSize: 14, color: "#556070", fontWeight: 700 }}>
        Step {index}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
        {title}
      </div>
      <div style={{ fontSize: 14, color: "#5c6b7a", marginTop: 4 }}>
        {body}
      </div>
    </div>
  );
};

export const DivideAndConquerSort: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const leftWidth = width - SIDE_PANEL_W - MARGIN * 2;
  const leftX = MARGIN;
  const panelX = leftX + leftWidth + 30;

  const titleOpacity = interpolate(frame, [0, 24], [0, 1], clamp);
  const titleY = interpolate(frame, [0, 24], [16, 0], clamp);

  const original = [19, 7, 5, 13, 2, 11, 3, 17];
  const leftHalf = [19, 7, 5, 13];
  const rightHalf = [2, 11, 3, 17];
  const quarters = [[19, 7], [5, 13], [2, 11], [3, 17]];
  const mergedHalves = [[5, 7, 13, 19], [2, 3, 11, 17]];
  const finalSorted = [2, 3, 5, 7, 11, 13, 17, 19];

  const stageOriginal = 0;
  const stageHalves = 60;
  const stageQuarters = 120;
  const stageMergePairs = 200;
  const stageMergeFinal = 280;

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 15% 10%, #fff6e7 0%, #f2f8ff 45%, #e7eef2 100%)",
        color: "#1f2a37",
        fontFamily: "Segoe UI, Arial, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: leftX,
          top: 40,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: 0.5 }}>
          Divide and Conquer Sort
        </div>
        <div style={{ fontSize: 18, color: "#516072", marginTop: 6 }}>
          Merge sort visual walkthrough
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: leftX - 20,
          top: 120,
          width: leftWidth + 40,
          height: height - 170,
          borderRadius: 26,
          border: "2px solid rgba(47, 60, 74, 0.2)",
          background: "rgba(255, 255, 255, 0.55)",
          boxShadow: "0 16px 32px rgba(31, 42, 55, 0.12)",
        }}
      />

      <ArrayRow
        items={original}
        y={160}
        stageStart={stageOriginal}
        stageEnd={stageHalves - 8}
        label="Original"
        accent
        leftX={leftX}
        leftWidth={leftWidth}
      />

      <ArrayRow
        items={leftHalf}
        y={260}
        stageStart={stageHalves}
        stageEnd={stageQuarters - 8}
        label="Left half"
        leftX={leftX}
        leftWidth={leftWidth}
      />
      <ArrayRow
        items={rightHalf}
        y={330}
        stageStart={stageHalves}
        stageEnd={stageQuarters - 8}
        label="Right half"
        leftX={leftX}
        leftWidth={leftWidth}
      />

      {quarters.map((pair, index) => (
        <ArrayRow
          key={`quarter-${index}`}
          items={pair}
          y={250 + index * 60}
          stageStart={stageQuarters}
          stageEnd={stageMergePairs - 8}
          label={index === 0 ? "Quarter" : undefined}
          leftX={leftX}
          leftWidth={leftWidth}
        />
      ))}

      {mergedHalves.map((half, index) => (
        <ArrayRow
          key={`merged-${index}`}
          items={half}
          y={260 + index * 80}
          stageStart={stageMergePairs}
          stageEnd={stageMergeFinal - 8}
          label={index === 0 ? "Merge" : undefined}
          accent
          leftX={leftX}
          leftWidth={leftWidth}
        />
      ))}

      <ArrayRow
        items={finalSorted}
        y={430}
        stageStart={stageMergeFinal}
        label="Sorted"
        accent
        leftX={leftX}
        leftWidth={leftWidth}
      />

      <div
        style={{
          position: "absolute",
          left: panelX,
          top: 120,
          width: SIDE_PANEL_W - 40,
          padding: "22px 24px",
          borderRadius: 20,
          background: "rgba(255, 255, 255, 0.8)",
          border: "2px solid rgba(84, 107, 130, 0.2)",
          boxShadow: "0 14px 28px rgba(15, 23, 42, 0.12)",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 18 }}>
          What is happening
        </div>
        <Step
          index={1}
          title="Divide"
          body="Split the array into halves until small chunks remain."
          start={stageOriginal}
        />
        <Step
          index={2}
          title="Conquer"
          body="Treat each chunk as sorted once it is one or two items."
          start={stageQuarters}
        />
        <Step
          index={3}
          title="Combine"
          body="Merge the sorted chunks back together, keeping order."
          start={stageMergePairs}
        />
      </div>
    </AbsoluteFill>
  );
};
