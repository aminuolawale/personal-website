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
  // Warm nebula colors — look good on dark and light backgrounds
  orange: "#fc9e4f",
  gold: "#edd382",
  cream: "#f2f3ae",
  red: "#f4442e",
  // Dark star colors — used on light backgrounds so stars remain visible
  navy: "#1a2744",
  slate: "#374151",

  orangeAlpha: (a: number) => `rgba(252,158,79,${a.toFixed(3)})`,
  goldAlpha:   (a: number) => `rgba(237,211,130,${a.toFixed(3)})`,
  creamAlpha:  (a: number) => `rgba(242,243,174,${a.toFixed(3)})`,
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
