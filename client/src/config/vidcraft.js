export const COLORS = {
  bg: "#0A0E1B",
  surface: "#0F1424",
  card: "#12182A",
  border: "#1E2740",
  dim: "#182033",
  cyan: "#FBBF24",
  lime: "#22C55E",
  orange: "#F59E0B",
  magenta: "#FB923C",
  purple: "#2D3250",
  indigo: "#2D3250",
  teal: "#22C55E",
  pink: "#FBBF24",
  blue: "#818CF8",
  red: "#FF7A7A",
  text: "#F5F7FB",
  muted: "#8B93A7",
  success: "#22C55E",
};

export const PLACEHOLDER = {
  contest:
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
  seedream:
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
  appBuilder:
    "https://images.unsplash.com/photo-1618005198919-d3d224b85b61?auto=format&fit=crop&w=1200&q=80",
  discount:
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80",
  forest:
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80",
  denim:
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=600&q=80",
  grid:
    "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80",
  marble:
    "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=600&q=80",
  neon:
    "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=800&q=80",
  cinema:
    "https://images.unsplash.com/photo-1485846234645-a62644f84781?auto=format&fit=crop&w=800&q=80",
  product:
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
  abstract:
    "https://images.unsplash.com/photo-1634017839464-5c339bbe3c8b?auto=format&fit=crop&w=800&q=80",
  videoPoster:
    "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=800&q=80",
};

export const FEATURED = [
  {
    id: "contest",
    title: "$100K APP CONTEST",
    subtitle: "Build with VidCraft APIs and win cash prizes for the best creative apps.",
    image: PLACEHOLDER.contest,
    overlay: "$100,000\nAPP CONTEST",
    tone: "dark",
    action: "home",
  },
  {
    id: "seedream",
    title: "FLUX PRO",
    subtitle: "Top-tier reasoning image model for photoreal and concept work.",
    image: PLACEHOLDER.seedream,
    overlay: "FLUX PRO",
    tone: "dark",
    action: "image",
  },
  {
    id: "builder",
    title: "STUDIO BUILDER",
    subtitle: "Describe a scene and jump straight into image or video generation.",
    image: PLACEHOLDER.appBuilder,
    overlay: null,
    tone: "light",
    promptPreview: "Build a portfolio site for a furniture design studio.",
    action: "studio",
  },
];

export const TOOL_CARDS = [
  {
    id: "nano-banana",
    title: "Nano Banana Pro",
    description: "Fast drafts with punchy color and crisp detail.",
    badge: "Image",
    badgeTone: "muted",
    icon: "banana",
    mediaType: "image",
  },
  {
    id: "vidcraft-ref",
    title: "VidCraft Ref",
    description: "Upload a reference image and generate with your prompt.",
    badge: "NEW",
    badgeTone: "lime",
    icon: "imagePlus",
    mediaType: "ref",
  },
  {
    id: "seedance",
    title: "Seedance 2.0",
    description: "Cinematic motion clips with camera-aware prompting.",
    badge: "Video",
    badgeTone: "muted",
    icon: "film",
    mediaType: "video",
  },
  {
    id: "gemini-omni",
    title: "Gemini Omni Flash",
    description: "Multimodal prompts that blend style, mood, and subject.",
    badge: "NEW",
    badgeTone: "lime",
    icon: "sparkles",
    mediaType: "image",
  },
  {
    id: "cinema-studio",
    title: "Cinema Studio",
    description: "Storyboard-ready shots with lighting and lens control.",
    badge: "TRENDING",
    badgeTone: "magenta",
    icon: "clapper",
    mediaType: "video",
  },
  {
    id: "shorts",
    title: "Shorts Studio",
    description: "Vertical-first clips tuned for social formats.",
    badge: "Video",
    badgeTone: "muted",
    icon: "smartphone",
    mediaType: "video",
  },
  {
    id: "explainer",
    title: "Explainer",
    description: "Clean Remotion explainers with step-by-step motion.",
    badge: "NEW",
    badgeTone: "lime",
    icon: "layers",
    mediaType: "video",
  },
];

export const STUDIO_PREVIEWS = {
  image: [
    { src: PLACEHOLDER.forest, rotate: -8 },
    { src: PLACEHOLDER.denim, rotate: -2 },
    { src: PLACEHOLDER.grid, rotate: 4 },
    { src: PLACEHOLDER.marble, rotate: 10 },
  ],
  video: [
    { src: PLACEHOLDER.cinema, rotate: -8 },
    { src: PLACEHOLDER.videoPoster, rotate: -2 },
    { src: PLACEHOLDER.neon, rotate: 4 },
    { src: PLACEHOLDER.abstract, rotate: 10 },
  ],
};

export const RESOLUTIONS = ["1K", "2K", "4K"];
export const ASPECT_RATIOS = ["1:1", "3:4", "16:9", "9:16"];

export const DIMS = [
  { key: "subject", label: "Subject Clarity", color: COLORS.cyan },
  { key: "action", label: "Action Specificity", color: COLORS.lime },
  { key: "environment", label: "Environment Detail", color: COLORS.blue },
  { key: "visual", label: "Visual Richness", color: COLORS.pink },
  { key: "temporal", label: "Temporal Coherence", color: COLORS.purple },
];

export const MEDIA_TYPES = [
  {
    key: "video",
    label: "Video",
    hint: "Unlocks Remotion renders and time-based controls.",
  },
  {
    key: "image",
    label: "Image",
    hint: "Still-image generation via API models.",
  },
];

export const TEMPLATES = [
  {
    id: "animated-explainer",
    label: "Animated Explainer",
    mediaType: "video",
    contentType: "animated",
    recommendedPath: "remotion",
    image: PLACEHOLDER.abstract,
    prompt:
      "Explain the concept of [topic] using clean vector shapes, simple icons, and step-by-step motion. Use a clear title card, then show 3 key steps with labels. Keep the tone educational and calm.",
  },
  {
    id: "narrative-scene",
    label: "Narrative Scene",
    mediaType: "video",
    contentType: "narrative",
    recommendedPath: "api",
    image: PLACEHOLDER.cinema,
    prompt:
      "A cinematic scene of [character] doing [action] in [location], during [time of day]. Include camera movement, lighting mood, and a brief progression from wide shot to close-up.",
  },
  {
    id: "product-demo",
    label: "Product Demo",
    mediaType: "video",
    contentType: "animated",
    recommendedPath: "remotion",
    image: PLACEHOLDER.product,
    prompt:
      "Show a clean product demo for [product]. Start with a hero shot, then highlight 3 features with callout text and simple motion. End with a logo and tagline.",
  },
  {
    id: "photo-real",
    label: "Photoreal Still",
    mediaType: "image",
    contentType: "photorealistic",
    recommendedPath: "api",
    image: PLACEHOLDER.denim,
    prompt:
      "A high-resolution photorealistic image of [subject] in [environment]. Use natural lighting, realistic textures, and shallow depth of field. 4k detail.",
  },
  {
    id: "concept-art",
    label: "Concept Art",
    mediaType: "image",
    contentType: "illustration",
    recommendedPath: "api",
    image: PLACEHOLDER.seedream,
    prompt:
      "Concept art of [subject] in a [setting] with [style]. Emphasize mood, color palette, and dramatic composition. Painterly brushwork.",
  },
  {
    id: "thumbnail",
    label: "YouTube Thumbnail",
    mediaType: "image",
    contentType: "product",
    recommendedPath: "api",
    image: PLACEHOLDER.neon,
    prompt:
      "Bold YouTube thumbnail featuring [subject] with oversized text, high contrast colors, and a clean background. Make it eye-catching and readable at small sizes.",
  },
];

export const GEN_MODELS = [
  {
    id: "wan-2.1",
    label: "VidCraft",
    mediaType: "video",
    tier: "wavespeed",
    unit: "sec",
    costPerUnit: 0,
    note: "Hugging Face Wan2.1-T2V-1.3B · fixed 2s clips.",
    selectable: true,
  },
  {
    id: "wavespeed-v1",
    label: "WaveSpeed V1",
    mediaType: "video",
    tier: "wavespeed",
    unit: "sec",
    costPerUnit: 27.9,
    note: "Cost-optimized video generation.",
    selectable: false,
  },
  {
    id: "premium-sora",
    label: "Sora Mini",
    mediaType: "video",
    tier: "premium",
    unit: "sec",
    costPerUnit: 55,
    note: "High-fidelity cinematic clips.",
    selectable: false,
  },
  {
    id: "premium-veo",
    label: "Veo 2",
    mediaType: "video",
    tier: "premium",
    unit: "sec",
    costPerUnit: 55,
    note: "Large-scene video synthesis.",
    selectable: false,
  },
  {
    id: "vidcraft",
    label: "VidCraft",
    mediaType: "image",
    tier: "free",
    unit: "image",
    costPerUnit: 0,
    note: "Generate with VidCraft.",
    selectable: true,
  },
  {
    id: "sdxl-turbo",
    label: "SDXL Turbo",
    mediaType: "image",
    tier: "free",
    unit: "image",
    costPerUnit: 0,
    note: "Coming soon.",
    selectable: false,
  },
  {
    id: "kandinsky-3",
    label: "Kandinsky 3",
    mediaType: "image",
    tier: "wavespeed",
    unit: "image",
    costPerUnit: 8,
    note: "Coming soon.",
    selectable: false,
  },
  {
    id: "flux-pro",
    label: "FLUX Pro",
    mediaType: "image",
    tier: "premium",
    unit: "image",
    costPerUnit: 20,
    note: "Coming soon.",
    selectable: false,
  },
];

export const INITIAL_HISTORY = [];
