import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export const GENERATED_META = {
  title: "FIFO Explained: First In, First Out",
  durationInFrames: 3600,
  fps: 30,
  width: 1280,
  height: 720,
};

const SCENES = [{"start":0,"dur":300,"title":"Opening Hook: The Grocery Line","lines":["Ever stood in a grocery checkout line?","People enter at the back—and leave at the front."],"idea":"Animated top-down view of a winding queue of stylized shoppers entering a store entrance and moving forward toward a single cashier; arrows show flow direction,"},{"start":300,"dur":300,"title":"Real-World Analogy: Printer Queue","lines":["Imagine sending three documents to a printer:","Report.pdf, Notes.txt, then Summary.pptx."],"idea":"Side-scrolling animation of a desktop screen showing a print queue window with three files appearing sequentially—each file slides in from right to left, stacki"},{"start":600,"dur":300,"title":"What FIFO Means","lines":["FIFO stands for First In, First Out.","It’s a rule: the earliest item added is the first one removed."],"idea":"Clean whiteboard-style animation: hand-drawn text 'FIFO' expands into 'First In, First Out', then transforms into two parallel timelines—one labeled 'Add Order'"},{"start":900,"dur":360,"title":"Queue Data Structure Visualized","lines":["In programming, FIFO is how a queue works.","Think of it like a tube: you drop items in one end—and they pop out the other—in order."],"idea":"3D isometric transparent tube (like a clear plastic chute) with colored balls labeled A, B, C dropping in top-left one by one; balls roll down and exit bottom-r"},{"start":1260,"dur":360,"title":"Code Snippet: JavaScript Queue","lines":["In JavaScript, arrays can model FIFO using push() and shift().","Push adds to the end. Shift removes from the front—preserving order."],"idea":"Animated terminal window showing live code execution: array [] → push('A') → ['A'] → push('B') → ['A','B'] → shift() → returns 'A', leaving ['B']; highlight 'sh"},{"start":1620,"dur":360,"title":"Contrast with LIFO (Stack)","lines":["FIFO is not the only way.","Compare it to LIFO—Last In, First Out—like a stack of plates."],"idea":"Split-screen: left shows FIFO tube (A→B→C in, A→B→C out); right shows vertical stack of plates—C placed last on top, then removed first; labels 'FIFO ≠ LIFO' pu"},{"start":1980,"dur":360,"title":"Where FIFO Is Used","lines":["Operating systems use FIFO for task scheduling.","Network routers use it to manage data packets.","Supermarkets use it for perishable inventory."],"idea":"Three rotating icons: a CPU chip with tasks labeled T1→T2→T3 entering a 'Scheduler' box and exiting in order; a router icon with packet envelopes flowing in/out"},{"start":2340,"dur":360,"title":"Why FIFO Matters","lines":["FIFO ensures fairness and predictability.","No item gets starved—everyone waits their turn.","It prevents spoilage, backlog chaos, and priority inversion."],"idea":"Animated balance scale: left side shows chaotic pile-up of unlabeled items with red 'X's; right side shows orderly FIFO line with green checkmarks and smooth mo"},{"start":2700,"dur":300,"title":"Quick Recap","lines":["FIFO = First In, First Out.","It’s intuitive, fair, and everywhere—from lines to code to logistics."],"idea":"Rapid-fire collage: grocery line → printer queue → code snippet → tube animation → router icon → fridge shelf—all shrinking into a central glowing 'FIFO' badge "},{"start":3000,"dur":300,"title":"Call to Action","lines":["Now you know FIFO—not just the acronym, but the idea.","Try spotting it in your day. And next time you're in line? You're living an algorithm."],"idea":"Camera pulls back from a real-world coffee shop line (animated but realistic), revealing subtle floating 'FIFO' glyphs above each person’s head; final frame zoo"},{"start":3300,"dur":300,"title":"Closing Frame","lines":["Thanks for watching. Stay curious."],"idea":"Minimalist black background with centered white 'FIFO' in bold monospace font; letters subtly animate in sequence—F, then I, then F, then O—with soft light bloo"}];

const Scene = ({ title, lines, idea, local }) => {
  const { width, height } = useVideoConfig();
  const opacity = interpolate(local, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(local, [0, 15], [24, 0], { extrapolateRight: "clamp" });
  const pulse = 0.5 + 0.5 * Math.sin(local / 12);
  return (
    <AbsoluteFill style={{ background: "#070b18", color: "#f5f7fb", fontFamily: "Segoe UI, sans-serif", opacity }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 20%, rgba(102,170,255,0.18), transparent 45%)" }} />
      <div style={{ position: "absolute", left: width/2 - 90, top: height/2 - 90, width: 180, height: 180, borderRadius: "50%", border: "2px solid rgba(245,158,11,0.55)", transform: `scale(${0.85 + pulse * 0.2})`, boxShadow: "0 0 40px rgba(245,158,11,0.25)" }} />
      <div style={{ position: "absolute", left: 70, top: 70, transform: `translateY(${y}px)` }}>
        <div style={{ fontSize: 44, fontWeight: 800 }}>{title}</div>
        <div style={{ marginTop: 10, fontSize: 18, color: "#9aa3b5", maxWidth: 760 }}>{idea}</div>
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, bottom: 54, textAlign: "center" }}>
        {lines.map((line, i) => (
          <div key={i} style={{ fontSize: i ? 22 : 26, fontWeight: i ? 500 : 700, textShadow: "0 2px 16px rgba(0,0,0,0.8)", marginTop: i ? 6 : 0 }}>{line}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const GeneratedComposition = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#070b18" }}>
      {SCENES.map((scene, index) => (
        <Sequence key={index} from={scene.start} durationInFrames={scene.dur}>
          <Scene title={scene.title} lines={scene.lines} idea={scene.idea} local={frame - scene.start} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
