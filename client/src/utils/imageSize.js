const RESOLUTION_BASE = {
  "1K": 1024,
  "2K": 1536,
  "4K": 2048,
};

const snap = (value) => Math.max(256, Math.round(value / 16) * 16);

export const resolveImageSize = (resolution = "2K", aspectRatio = "1:1") => {
  const base = RESOLUTION_BASE[resolution] || 1024;
  const [rawW, rawH] = String(aspectRatio).split(":").map(Number);
  const wRatio = Number.isFinite(rawW) && rawW > 0 ? rawW : 1;
  const hRatio = Number.isFinite(rawH) && rawH > 0 ? rawH : 1;

  let width;
  let height;

  if (wRatio >= hRatio) {
    width = base;
    height = (base * hRatio) / wRatio;
  } else {
    height = base;
    width = (base * wRatio) / hRatio;
  }

  return {
    width: snap(width),
    height: snap(height),
  };
};
