import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
};

const BOX_W = 90;
const BOX_H = 52;
const NODE_GAP = 12;

const palette = {
  bg: "#0d1328",
  box: "#f2c94c",
  mergeBox: "#6ee7b7",
  boxShadow: "rgba(12, 18, 34, 0.35)",
  text: "#0b1020",
  line: "#f5f7ff",
  accent: "#ff6b6b",
};

type Node = {
  id: string;
  values: number[];
  level: number;
  index: number;
};

const splitNodes: Node[] = [
  { id: "root", values: [38, 27, 43, 3, 9], level: 0, index: 0 },
  { id: "left", values: [38, 27], level: 1, index: 0 },
  { id: "right", values: [43, 3, 9], level: 1, index: 1 },
  { id: "left-left", values: [38], level: 2, index: 0 },
  { id: "left-right", values: [27], level: 2, index: 1 },
  { id: "right-left", values: [43], level: 2, index: 2 },
  { id: "right-right", values: [3, 9], level: 2, index: 3 },
  { id: "right-right-left", values: [3], level: 3, index: 6 },
  { id: "right-right-right", values: [9], level: 3, index: 7 },
];

const edges = [
  ["root", "left"],
  ["root", "right"],
  ["left", "left-left"],
  ["left", "left-right"],
  ["right", "right-left"],
  ["right", "right-right"],
  ["right-right", "right-right-left"],
  ["right-right", "right-right-right"],
];

type NodeLayout = {
  x: number;
  y: number;
};

const getNodeWidth = (values: number[]) => {
  return values.length * BOX_W + (values.length - 1) * NODE_GAP;
};

const getOpacity = (frame: number, start: number, end?: number) => {
  const fadeIn = interpolate(frame, [start, start + 10], [0, 1], clamp);
  if (end === undefined) {
    return fadeIn;
  }

  const fadeOut = interpolate(frame, [end, end + 10], [1, 0], clamp);
  return Math.min(fadeIn, fadeOut);
};

const layoutNodes = (
  width: number,
  height: number
): Record<string, NodeLayout> => {
  const levels = 4;
  const top = 120;
  const verticalGap = 110;

  const levelCounts = [1, 2, 4, 2];
  const levelOffsets: number[] = [];

  levelCounts.forEach((count) => {
    const totalWidth = count * BOX_W * 2 + (count - 1) * 60;
    levelOffsets.push(width / 2 - totalWidth / 2);
  });

  const positions: Record<string, NodeLayout> = {};
  splitNodes.forEach((node) => {
    const level = Math.min(node.level, levels - 1);
    const count = levelCounts[level];
    const gap = 60;
    const totalWidth = count * BOX_W * 2 + (count - 1) * gap;
    const startX = width / 2 - totalWidth / 2;
    const x = startX + node.index * (BOX_W * 2 + gap);
    const y = top + level * verticalGap;
    positions[node.id] = { x, y };
  });

  return positions;
};

const NodeBox: React.FC<{
  values: number[];
  x: number;
  y: number;
  start: number;
  end?: number;
  highlight?: boolean;
  tone?: "split" | "merge";
}> = ({ values, x, y, start, end, highlight, tone = "split" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({
    frame: frame - start,
    fps,
    config: { damping: 200, stiffness: 120 },
  });
  const opacity = getOpacity(frame, start, end);
  const translateY = interpolate(pop, [0, 1], [18, 0], clamp);
  const scale = interpolate(pop, [0, 1], [0.96, 1], clamp);
  const background = tone === "merge" ? palette.mergeBox : palette.box;

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
      <div style={{ display: "flex", gap: NODE_GAP }}>
        {values.map((value, index) => (
          <div
            key={`${value}-${index}`}
            style={{
              width: BOX_W,
              height: BOX_H,
              borderRadius: 10,
              background,
              boxShadow: `0 10px 18px ${palette.boxShadow}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 700,
              color: palette.text,
              border: highlight ? `3px solid ${palette.accent}` : "none",
            }}
          >
            {value}
          </div>
        ))}
      </div>
    </div>
  );
};

const StepLabel: React.FC<{ text: string; start: number }> = ({
  text,
  start,
}) => {
  const frame = useCurrentFrame();
  const opacity = getOpacity(frame, start);
  const translateY = interpolate(frame, [start, start + 12], [6, 0], clamp);

  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        bottom: 36,
        padding: "10px 16px",
        borderRadius: 12,
        background: "rgba(255, 255, 255, 0.1)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        color: "#f8fafc",
        fontSize: 18,
        fontWeight: 600,
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {text}
    </div>
  );
};

export const DivideConquerTree: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const positions = layoutNodes(width, height);

  const stages = {
    root: 0,
    halves: 90,
    splitLeft: 180,
    splitRight: 270,
    splitRightChild: 360,
    splitDone: 450,
    mergeLeft: 480,
    mergeRightRight: 570,
    mergeRight: 660,
    mergeRoot: 750,
    finalHold: 840,
    end: 900,
  };

  const splitFadeOut = stages.mergeLeft - 12;

  const mergeNodes = [
    { id: "merge-left", posKey: "left", values: [27, 38], start: stages.mergeLeft },
    {
      id: "merge-right-right",
      posKey: "right-right",
      values: [3, 9],
      start: stages.mergeRightRight,
    },
    {
      id: "merge-right",
      posKey: "right",
      values: [3, 9, 43],
      start: stages.mergeRight,
    },
    {
      id: "merge-root",
      posKey: "root",
      values: [3, 9, 27, 38, 43],
      start: stages.mergeRoot,
    },
  ];

  const mergeEdges = [
    { from: "left-left", to: "left", start: stages.mergeLeft },
    { from: "left-right", to: "left", start: stages.mergeLeft },
    {
      from: "right-right-left",
      to: "right-right",
      start: stages.mergeRightRight,
    },
    {
      from: "right-right-right",
      to: "right-right",
      start: stages.mergeRightRight,
    },
    { from: "right-left", to: "right", start: stages.mergeRight },
    { from: "right-right", to: "right", start: stages.mergeRight },
    { from: "left", to: "root", start: stages.mergeRoot },
    { from: "right", to: "root", start: stages.mergeRoot },
  ];

  const stepText =
    frame < stages.halves
      ? "Step 1: Start with the full array"
      : frame < stages.splitLeft
        ? "Step 2: Divide into left and right halves"
        : frame < stages.splitRight
          ? "Step 3: Split the left half"
          : frame < stages.splitRightChild
            ? "Step 4: Split the right half"
            : frame < stages.splitDone
              ? "Step 5: Split the right-right pair"
              : frame < stages.mergeLeft
                ? "Step 6: Base case reached (single items)"
                : frame < stages.mergeRightRight
                  ? "Step 7: Merge the left pair"
                  : frame < stages.mergeRight
                    ? "Step 8: Merge the right-right pair"
                    : frame < stages.mergeRoot
                      ? "Step 9: Merge the right side"
                      : frame < stages.finalHold
                        ? "Step 10: Final merge"
                        : "Done: Sorted array";

  const activeId =
    frame < stages.halves
      ? "root"
      : frame < stages.splitLeft
        ? "root"
        : frame < stages.splitRight
          ? "left"
          : frame < stages.splitRightChild
            ? "right"
            : frame < stages.splitDone
              ? "right-right"
              : frame < stages.mergeLeft
                ? "right-right"
                : frame < stages.mergeRightRight
                  ? "merge-left"
                  : frame < stages.mergeRight
                    ? "merge-right-right"
                    : frame < stages.mergeRoot
                      ? "merge-right"
                      : "merge-root";

  return (
    <AbsoluteFill style={{ background: palette.bg, color: "#f8fafc" }}>
      <div
        style={{
          position: "absolute",
          top: 32,
          left: 60,
          fontSize: 36,
          fontWeight: 800,
          letterSpacing: 0.5,
        }}
      >
        Divide and Conquer (Merge Sort)
      </div>

      <svg
        width={width}
        height={height}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        {edges.map(([from, to]) => {
          const fromPos = positions[from];
          const toPos = positions[to];
          const fromWidth = getNodeWidth(
            splitNodes.find((node) => node.id === from)?.values ?? []
          );
          const toWidth = getNodeWidth(
            splitNodes.find((node) => node.id === to)?.values ?? []
          );
          if (!fromPos || !toPos) {
            return null;
          }

          const x1 = fromPos.x + fromWidth / 2;
          const y1 = fromPos.y + BOX_H + 4;
          const x2 = toPos.x + toWidth / 2;
          const y2 = toPos.y - 8;

          const lineStart =
            from === "root"
              ? stages.halves
              : from === "left"
                ? stages.splitLeft
                : from === "right"
                  ? stages.splitRight
                  : stages.splitRightChild;

          const opacity = getOpacity(frame, lineStart, splitFadeOut);

          return (
            <line
              key={`${from}-${to}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={palette.line}
              strokeWidth={2}
              opacity={opacity}
            />
          );
        })}
        {mergeEdges.map(({ from, to, start }) => {
          const fromPos = positions[from];
          const toPos = positions[to];
          const fromWidth = getNodeWidth(
            splitNodes.find((node) => node.id === from)?.values ?? []
          );
          const toWidth = getNodeWidth(
            splitNodes.find((node) => node.id === to)?.values ?? []
          );
          if (!fromPos || !toPos) {
            return null;
          }

          const x1 = fromPos.x + fromWidth / 2;
          const y1 = fromPos.y + BOX_H + 4;
          const x2 = toPos.x + toWidth / 2;
          const y2 = toPos.y - 8;
          const opacity = getOpacity(frame, start);

          return (
            <line
              key={`merge-${from}-${to}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={palette.accent}
              strokeWidth={2.5}
              strokeDasharray="6 6"
              opacity={opacity}
            />
          );
        })}
      </svg>

      {splitNodes.map((node) => {
        const pos = positions[node.id];
        const start =
          node.id === "root"
            ? stages.root
            : node.id === "left" || node.id === "right"
              ? stages.halves
              : node.id.startsWith("left-")
                ? stages.splitLeft
                : node.id === "right-left" || node.id === "right-right"
                  ? stages.splitRight
                  : stages.splitRightChild;

        return (
          <NodeBox
            key={node.id}
            values={node.values}
            x={pos.x}
            y={pos.y}
            start={start}
            end={splitFadeOut}
            highlight={activeId === node.id}
            tone="split"
          />
        );
      })}

      {mergeNodes.map((node) => {
        const pos = positions[node.posKey];
        return (
          <NodeBox
            key={node.id}
            values={node.values}
            x={pos.x}
            y={pos.y}
            start={node.start}
            highlight={activeId === node.id}
            tone="merge"
          />
        );
      })}

      <StepLabel text={stepText} start={0} />
    </AbsoluteFill>
  );
};
