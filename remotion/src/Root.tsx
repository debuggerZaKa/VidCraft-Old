import "./index.css";
import { Composition } from "remotion";
import { AtomTouch } from "./AtomTouch";
import { BallStoryClaude } from "./BallStoryClaude";
import { BallStory } from "./BallStory";
import { DivideConquerTree } from "./DivideConquerTree";
import { DivideAndConquerSort } from "./DivideAndConquerSort";
import { MyComposition } from "./Composition";
import { InductionStory } from "./InductionStory";
import { FamilyPlanningStory } from "./FamilyPlanningStory";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyComp"
        component={MyComposition}
        durationInFrames={150}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="DivideConquer"
        component={DivideAndConquerSort}
        durationInFrames={360}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="DivideConquerTree"
        component={DivideConquerTree}
        durationInFrames={900}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="BallStory"
        component={BallStory}
        durationInFrames={900}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="BallStoryClaude"
        component={BallStoryClaude}
        durationInFrames={900}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="AtomTouch"
        component={AtomTouch}
        durationInFrames={5400}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="InductionStory"
        component={InductionStory}
        durationInFrames={5400}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="FP"
        component={FamilyPlanningStory}
        durationInFrames={2700}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  );
};
