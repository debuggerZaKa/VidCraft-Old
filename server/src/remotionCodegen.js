import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const GENERATED_DIR = path.resolve(
  __dirname,
  "..",
  "..",
  "client",
  "src",
  "remotion",
  "generated"
);

export const GENERATED_FILE = path.join(GENERATED_DIR, "GeneratedComposition.jsx");

export const CODEGEN_SYSTEM = `You are an expert Remotion engineer.
Write ONE self-contained Remotion composition as JSX (JavaScript + React), not TypeScript.

HARD RULES:
- Output ONLY a single JSX code block (or raw code). No markdown explanation.
- Import React from "react".
- Import ONLY from "remotion": AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence, Easing (as needed).
- Do NOT use CSS animations, transitions, @keyframes, or Tailwind animate classes.
- Animate ONLY with useCurrentFrame() + interpolate()/spring().
- Never use Math.random() during render (use deterministic values from frame/index).
- EVERY Sequence child MUST be AbsoluteFill (or a component that returns AbsoluteFill).
- SVG tags (<g>, <circle>, <path>, etc.) MUST be inside an <svg> element, never as Sequence/AbsoluteFill siblings alone.
- Export exactly:
  export const GENERATED_META = { title, durationInFrames, fps: 30, width: 1280, height: 720, scenes: [...] };
  export const GeneratedComposition = () => { ... };
- GENERATED_META.scenes MUST include startFrame, durationInFrames, narration[] for every scene used for subtitles.
- durationInFrames must match the story (prefer 2700–5400 for ~1.5–3 minutes at 30fps).
- Build multiple Sequence scenes covering the FULL script with original visuals (SVG, divs, shapes, figures).
- Invent NEW visuals for THIS script. Do not copy AtomTouch or reuse stock enum names.
- Keep code under ~400 lines if possible but cover all major beats.
- Use dark cinematic backgrounds and clear subtitles at the bottom.
- extrapolateLeft/Right: "clamp" on interpolations.`;

export const OUTLINE_SYSTEM = `You plan Remotion videos. Return ONLY JSON:
{
  "title": "string",
  "durationInFrames": number,
  "scenes": [
    { "id": "s1", "startFrame": 0, "durationInFrames": 240, "title": "string", "narration": ["line1","line2"], "visualIdea": "what to draw/animate" }
  ]
}
Rules:
- 30fps. For a 3-minute script aim durationInFrames near 5400 (min 1800, max 5400).
- 8–14 scenes covering the whole script.
- visualIdea must be concrete and unique to the script (not generic cards).`;

const stripMarkdownFences = (text) => {
  let code = String(text || "").trim();
  // Prefer fenced body when both opening + closing fences exist
  const fenced = code.match(/```(?:jsx|tsx|javascript|js)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    code = fenced[1].trim();
  }
  // Truncated LLM replies often leave an opening fence with no closer —
  // that breaks Vite because ``` starts a template literal.
  code = code.replace(/^```(?:jsx|tsx|javascript|js)?\s*/i, "");
  code = code.replace(/```\s*$/i, "");
  return code.trim();
};

export const extractCodeBlock = (text) => {
  if (!text) throw new Error("Empty model response.");
  let code = stripMarkdownFences(text);
  // Strip accidental typescript-only syntax lightly
  code = code.replace(/^import\s+type\s+.+$/gm, "");
  return code;
};

const assertWritableGeneratedCode = (code) => {
  const next = String(code || "").trim();
  if (!next) throw new Error("Generated code is empty.");
  if (/^```/.test(next) || /```$/.test(next)) {
    throw new Error("Generated code still contains markdown fences.");
  }
  if (!/\bGeneratedComposition\b/.test(next)) {
    throw new Error("Generated code missing GeneratedComposition export.");
  }
  if (!/\bGENERATED_META\b/.test(next)) {
    throw new Error("Generated code missing GENERATED_META export.");
  }
  // Truncated files often end mid-object (e.g. "width:") — reject those.
  if (!/\}\s*;?\s*$/.test(next)) {
    throw new Error("Generated code looks truncated (does not end cleanly).");
  }
  return next;
};

const buildMetaObject = (meta) => {
  const scenes = Array.isArray(meta?.scenes)
    ? meta.scenes.map((s, i) => ({
        startFrame: Number(s.startFrame) || i * 180,
        durationInFrames: Math.max(60, Number(s.durationInFrames) || 180),
        narration: Array.isArray(s.narration)
          ? s.narration.map((line) => String(line).slice(0, 160)).slice(0, 4)
          : [String(s.title || s.visualIdea || `Scene ${i + 1}`).slice(0, 160)],
      }))
    : [];

  return {
    title: meta?.title || "Generated Story",
    durationInFrames: Math.min(5400, Math.max(900, Number(meta?.durationInFrames) || 1800)),
    fps: 30,
    width: 1280,
    height: 720,
    scenes,
  };
};

export const ensureGeneratedExports = (code, meta) => {
  let next = stripMarkdownFences(code);
  if (!next.includes('from "react"') && !next.includes("from 'react'")) {
    next = `import React from "react";\n${next}`;
  }
  if (!next.includes("GeneratedComposition")) {
    throw new Error("Generated code missing GeneratedComposition export.");
  }

  // Force named exports (LLM often uses bare const + export { } at end)
  next = next.replace(
    /\b(?:export\s+)?const\s+GeneratedComposition\b/,
    "export const GeneratedComposition"
  );
  next = next.replace(/\b(?:export\s+)?const\s+GENERATED_META\b/, "export const GENERATED_META");
  next = next.replace(/export\s*\{\s*GENERATED_META\s*,\s*GeneratedComposition\s*\}\s*;?/g, "");
  next = next.replace(/export\s*\{\s*GeneratedComposition\s*,\s*GENERATED_META\s*\}\s*;?/g, "");
  // LLM sometimes adds a redundant self-reexport after export const GeneratedComposition = () => {}
  next = next.replace(
    /^export\s+const\s+GeneratedComposition\s*=\s*GeneratedComposition\s*;\s*$/gm,
    ""
  );
  next = next.replace(/^export\s*\{\s*GeneratedComposition\s*\}\s*;\s*$/gm, "");

  // Remotion Easing has no easeOutCubic / easeInOutCubic props — map common LLM mistakes
  next = next.replace(/Easing\.easeOutCubic/g, "Easing.out(Easing.cubic)");
  next = next.replace(/Easing\.easeInCubic/g, "Easing.in(Easing.cubic)");
  next = next.replace(/Easing\.easeInOutCubic/g, "Easing.inOut(Easing.cubic)");
  next = next.replace(/Easing\.easeOutQuad/g, "Easing.out(Easing.quad)");
  next = next.replace(/Easing\.easeInOutQuad/g, "Easing.inOut(Easing.quad)");

  const metaObject = buildMetaObject(meta);
  const metaLiteral = JSON.stringify(metaObject, null, 2);
  const metaComplete =
    /export\s+const\s+GENERATED_META\s*=\s*\{[\s\S]*?\n\};/.test(next) ||
    /export\s+const\s+GENERATED_META\s*=\s*\{[\s\S]*?\};/.test(next);

  if (!next.includes("GENERATED_META") || !metaComplete) {
    // Drop truncated / missing meta and append a complete outline-backed one
    next = next.replace(/export\s+const\s+GENERATED_META\s*=\s*\{[\s\S]*$/m, "").trimEnd();
    next = `${next}\n\nexport const GENERATED_META = ${metaLiteral};\n`;
  } else if (!/GENERATED_META[\s\S]{0,400}scenes\s*:/.test(next)) {
    // Replace broken/incomplete meta with outline-backed meta that includes scenes
    next = next.replace(
      /export\s+const\s+GENERATED_META\s*=\s*\{[\s\S]*?\n\};/,
      `export const GENERATED_META = ${metaLiteral};`
    );
  }

  // Guard common crash: Math.random in render
  if (next.includes("Math.random(")) {
    next = next.replace(/Math\.random\(\)\s*\*\s*([0-9.]+)/g, "(($1) * 0.5)");
    next = next.replace(/Math\.random\(\)/g, "0.5");
  }

  return `${assertWritableGeneratedCode(next)}\n`;
};

export const writeGeneratedComposition = (code) => {
  const safe = assertWritableGeneratedCode(code);
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  fs.writeFileSync(GENERATED_FILE, `${safe}\n`, "utf8");
  return GENERATED_FILE;
};

export const buildEmergencyComposition = (prompt, outline) => {
  const title = outline?.title || "Generated Story";
  const scenes = Array.isArray(outline?.scenes) && outline.scenes.length
    ? outline.scenes
    : [
        {
          startFrame: 0,
          durationInFrames: 300,
          title: "Opening",
          narration: [String(prompt).slice(0, 100)],
          visualIdea: "title card",
        },
      ];

  const durationInFrames = Math.min(
    5400,
    Math.max(
      1800,
      Number(outline?.durationInFrames) ||
        scenes.reduce((sum, s) => sum + (Number(s.durationInFrames) || 180), 0)
    )
  );

  const sceneJson = JSON.stringify(
    scenes.map((s, i) => ({
      start: Number(s.startFrame) || i * 180,
      dur: Math.max(90, Number(s.durationInFrames) || 180),
      title: String(s.title || `Scene ${i + 1}`).slice(0, 80),
      lines: Array.isArray(s.narration)
        ? s.narration.map((l) => String(l).slice(0, 120)).slice(0, 3)
        : [String(s.visualIdea || "").slice(0, 120)],
      idea: String(s.visualIdea || "").slice(0, 160),
    }))
  );

  return `import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export const GENERATED_META = {
  title: ${JSON.stringify(title)},
  durationInFrames: ${durationInFrames},
  fps: 30,
  width: 1280,
  height: 720,
};

const SCENES = ${sceneJson};

const Scene = ({ title, lines, idea, local }) => {
  const { width, height } = useVideoConfig();
  const opacity = interpolate(local, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(local, [0, 15], [24, 0], { extrapolateRight: "clamp" });
  const pulse = 0.5 + 0.5 * Math.sin(local / 12);
  return (
    <AbsoluteFill style={{ background: "#070b18", color: "#f5f7fb", fontFamily: "Segoe UI, sans-serif", opacity }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 20%, rgba(102,170,255,0.18), transparent 45%)" }} />
      <div style={{ position: "absolute", left: width/2 - 90, top: height/2 - 90, width: 180, height: 180, borderRadius: "50%", border: "2px solid rgba(245,158,11,0.55)", transform: \`scale(\${0.85 + pulse * 0.2})\`, boxShadow: "0 0 40px rgba(245,158,11,0.25)" }} />
      <div style={{ position: "absolute", left: 70, top: 70, transform: \`translateY(\${y}px)\` }}>
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
`;
};
