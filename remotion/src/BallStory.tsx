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

const groundOffset = 120;

const StepTag: React.FC<{ text: string; start: number }> = ({
  text,
  start,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [start, start + 12], [0, 1], clamp);
  const translateY = interpolate(frame, [start, start + 12], [8, 0], clamp);

  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        bottom: 44,
        padding: "10px 16px",
        borderRadius: 14,
        background: "rgba(15, 23, 42, 0.55)",
        border: "1px solid rgba(255, 255, 255, 0.18)",
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

type Pose = "bounce" | "steal" | "throw" | "idle";

const Character: React.FC<{
  x: number;
  y: number;
  shirt: string;
  highlight?: boolean;
  pose?: Pose;
  lift?: number;
}> = ({ x, y, shirt, highlight, pose = "idle", lift = 0 }) => {
  const poseAngles: Record<
    Pose,
    { armLeft: number; armRight: number; legLeft: number; legRight: number }
  > = {
    bounce: { armLeft: -15, armRight: 10, legLeft: -6, legRight: 6 },
    steal: { armLeft: -10, armRight: -45, legLeft: -4, legRight: 4 },
    throw: { armLeft: 20, armRight: -100, legLeft: -8, legRight: 8 },
    idle: { armLeft: -6, armRight: 6, legLeft: -2, legRight: 2 },
  };

  const { armLeft, armRight, legLeft, legRight } = poseAngles[pose];

  const skin = "#f8fafc";
  const stroke = "#1f2937";
  const headSize = 56;
  const bodyW = 90;
  const bodyH = 110;
  const armW = 16;
  const armH = 78;
  const legW = 18;
  const legH = 72;
  const footW = 30;
  const footH = 14;
  const width = 150;
  const bodyX = Math.round(width / 2 - bodyW / 2);
  const headX = Math.round(width / 2 - headSize / 2);
  const bodyY = headSize + 10;
  const shoulderY = bodyY + 12;
  const legY = bodyY + bodyH - 8;

  return (
    <div style={{ position: "absolute", left: x, top: y - lift }}>
      <div style={{ position: "relative", width, height: 230 }}>
        <div
          style={{
            position: "absolute",
            left: headX,
            top: 0,
            width: headSize,
            height: headSize,
            borderRadius: 999,
            background: skin,
            border: `4px solid ${stroke}`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 12,
              top: 18,
              width: 10,
              height: 10,
              borderRadius: 999,
              background: stroke,
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 12,
              top: 18,
              width: 10,
              height: 10,
              borderRadius: 999,
              background: stroke,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 18,
              right: 18,
              bottom: 14,
              height: 6,
              borderRadius: 999,
              background: stroke,
              opacity: 0.7,
            }}
          />
        </div>

        <div
          style={{
            position: "absolute",
            left: bodyX,
            top: bodyY,
            width: bodyW,
            height: bodyH,
            borderRadius: 18,
            background: shirt,
            border: highlight ? "4px solid #f97316" : `4px solid ${stroke}`,
            boxShadow: "0 12px 20px rgba(15, 23, 42, 0.3)",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: bodyX - 8,
            top: shoulderY,
            width: armW,
            height: armH,
            borderRadius: 999,
            background: skin,
            border: `3px solid ${stroke}`,
            transformOrigin: "top center",
            transform: `rotate(${armLeft}deg)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -6,
              bottom: -12,
              width: 28,
              height: 28,
              borderRadius: 999,
              background: skin,
              border: `3px solid ${stroke}`,
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: bodyX + bodyW - armW + 8,
            top: shoulderY,
            width: armW,
            height: armH,
            borderRadius: 999,
            background: skin,
            border: `3px solid ${stroke}`,
            transformOrigin: "top center",
            transform: `rotate(${armRight}deg)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -6,
              bottom: -12,
              width: 28,
              height: 28,
              borderRadius: 999,
              background: skin,
              border: `3px solid ${stroke}`,
            }}
          />
        </div>

        <div
          style={{
            position: "absolute",
            left: bodyX + 12,
            top: legY,
            width: legW,
            height: legH,
            borderRadius: 999,
            background: "#374151",
            transformOrigin: "top center",
            transform: `rotate(${legLeft}deg)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -6,
              bottom: -8,
              width: footW,
              height: footH,
              borderRadius: 999,
              background: "#111827",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: bodyX + bodyW - legW - 12,
            top: legY,
            width: legW,
            height: legH,
            borderRadius: 999,
            background: "#374151",
            transformOrigin: "top center",
            transform: `rotate(${legRight}deg)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -6,
              bottom: -8,
              width: footW,
              height: footH,
              borderRadius: 999,
              background: "#111827",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const BallStory: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const groundY = height - groundOffset;
  const bounceEnd = 10 * fps;
  const enterEnd = 16 * fps;
  const throwEnd = 21 * fps;
  const vanishEnd = 27 * fps;
  const endHold = 30 * fps;

  const char1X = 180;
  const char2TargetX = width - 320;
  const char2Enter = spring({
    frame: frame - bounceEnd,
    fps,
    config: { damping: 200, stiffness: 120 },
  });
  const char2X = interpolate(
    char2Enter,
    [0, 1],
    [width + 120, char2TargetX],
    clamp
  );

  const ballBaseY = groundY - 120;
  const ballRadius = 26;

  let ballX = char1X + 90;
  let ballY = ballBaseY;
  let ballOpacity = 1;
  let ballScale = 1;

  if (frame < bounceEnd) {
    const phase = frame / 8;
    const bounce = Math.abs(Math.sin(phase));
    ballY = ballBaseY - bounce * 130;
    ballX = char1X + 90 + Math.sin(frame / 18) * 22;
  } else if (frame < enterEnd) {
    const progress = interpolate(frame, [bounceEnd, enterEnd], [0, 1], clamp);
    ballX = interpolate(
      progress,
      [0, 1],
      [char1X + 90, char2TargetX - 20],
      clamp
    );
    ballY = interpolate(
      progress,
      [0, 1],
      [ballBaseY - 40, ballBaseY - 10],
      clamp
    );
  } else if (frame < throwEnd) {
    const progress = interpolate(frame, [enterEnd, throwEnd], [0, 1], clamp);
    ballX = interpolate(
      progress,
      [0, 1],
      [char2TargetX - 20, char2TargetX + 10],
      clamp
    );
    ballY = interpolate(progress, [0, 1], [ballBaseY - 10, -80], clamp);
  } else if (frame < vanishEnd) {
    const progress = interpolate(frame, [throwEnd, vanishEnd], [0, 1], clamp);
    ballX = interpolate(
      progress,
      [0, 1],
      [char2TargetX + 10, char2TargetX + 30],
      clamp
    );
    ballY = interpolate(progress, [0, 1], [-80, -360], clamp);
    ballOpacity = interpolate(progress, [0, 1], [1, 0.15], clamp);
    ballScale = interpolate(progress, [0, 1], [1, 0.4], clamp);
  } else if (frame < endHold) {
    ballOpacity = 0;
  } else {
    ballOpacity = 0;
  }

  const stepText =
    frame < bounceEnd
      ? "Step 1: Character A bounces the ball"
      : frame < enterEnd
        ? "Step 2: Character B walks in and takes it"
        : frame < throwEnd
          ? "Step 3: Character B throws the ball high"
          : frame < vanishEnd
            ? "Step 4: Ball disappears into the sky"
            : "Step 5: The ball never comes back";

  const char1Pose: Pose = frame < bounceEnd ? "bounce" : "idle";
  const char2Pose: Pose =
    frame < enterEnd ? "steal" : frame < throwEnd ? "throw" : "idle";
  const char1Lift = frame < bounceEnd ? Math.abs(Math.sin(frame / 6)) * 6 : 0;
  const char2Lift = frame >= bounceEnd ? Math.abs(Math.sin(frame / 12)) * 2 : 0;
  const char1Highlight = frame < enterEnd;
  const char2Highlight = frame >= enterEnd && frame < vanishEnd;

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], clamp);

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 25% 15%, #1b2a4a 0%, #0b1020 55%, #090e1a 100%)",
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
          opacity: titleOpacity,
        }}
      >
        The Ball That Never Returned
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: groundY,
          height: 4,
          background: "rgba(255, 255, 255, 0.2)",
        }}
      />

      <Character
        x={char1X}
        y={groundY - 210}
        shirt="#60a5fa"
        highlight={char1Highlight}
        pose={char1Pose}
        lift={char1Lift}
      />
      <Character
        x={char2X}
        y={groundY - 210}
        shirt="#fca5a5"
        highlight={char2Highlight}
        pose={char2Pose}
        lift={char2Lift}
      />

      <div
        style={{
          position: "absolute",
          left: ballX,
          top: ballY,
          width: ballRadius * 2,
          height: ballRadius * 2,
          borderRadius: 999,
          background: "linear-gradient(140deg, #f97316, #f59e0b)",
          boxShadow: "0 14px 24px rgba(15, 23, 42, 0.45)",
          opacity: ballOpacity,
          transform: `scale(${ballScale})`,
        }}
      />

      <StepTag text={stepText} start={0} />
    </AbsoluteFill>
  );
};
