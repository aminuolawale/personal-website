export function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const P = {
  orange: "#fc9e4f",
  gold: "#edd382",
  cream: "#f2f3ae",
  red: "#f4442e",
  oa: (a: number) => `rgba(252,158,79,${a.toFixed(3)})`,
  ga: (a: number) => `rgba(237,211,130,${a.toFixed(3)})`,
  ca: (a: number) => `rgba(242,243,174,${a.toFixed(3)})`,
  ra: (a: number) => `rgba(244,68,46,${a.toFixed(3)})`,
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
