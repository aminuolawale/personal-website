export function createSeededRandom(seed: number) {
  let rngState = seed;
  return () => {
    rngState = (rngState + 0x6d2b79f5) | 0;
    let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const colorPalette = {
  // Soft nebula colors — tuned for legibility on dark and light backgrounds
  orange: "#38bdf8",
  gold: "#cbd5e1",
  cream: "#f8fafc",
  red: "#f4442e",
  // Dark star colors — used on light backgrounds so stars remain visible
  navy: "#1a2744",
  slate: "#374151",

  orangeAlpha: (a: number) => `rgba(56,189,248,${a.toFixed(3)})`,
  goldAlpha:   (a: number) => `rgba(203,213,225,${a.toFixed(3)})`,
  creamAlpha:  (a: number) => `rgba(248,250,252,${a.toFixed(3)})`,
  redAlpha:    (a: number) => `rgba(244,68,46,${a.toFixed(3)})`,
  navyAlpha:   (a: number) => `rgba(26,39,68,${a.toFixed(3)})`,
  slateAlpha:  (a: number) => `rgba(55,65,81,${a.toFixed(3)})`,
};

export function glow(
  ctx: CanvasRenderingContext2D,
  blur: number,
  color: string,
  fn: () => void
) {
  ctx.save();
  ctx.shadowBlur = blur;
  ctx.shadowColor = color;
  fn();
  ctx.restore();
}
