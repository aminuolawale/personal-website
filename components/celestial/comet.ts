import { colorPalette, glow } from "./utils";

export function drawComet(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
  tailLen: number,
  lw: number,
  traits: any
) {
  const color = traits.color || colorPalette.orange;
  const spread = 0.28; 
  const fanCount = traits.twinTail ? 8 : 5;
  const tMult = traits.tailLen || 1.0;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineCap = "round";

  for (let s = -(fanCount - 1) / 2; s <= (fanCount - 1) / 2; s++) {
    const fanAngle = angle + (s / ((fanCount - 1) / 2)) * spread;
    const t = 1 - Math.abs(s) / ((fanCount - 1) / 2 + 1);
    ctx.globalAlpha = 0.6 * t;
    if (traits.twinTail && Math.abs(s) < 1.5) ctx.globalAlpha *= 0.2;
    
    ctx.strokeStyle = s === 0 ? colorPalette.cream : color;
    ctx.lineWidth = lw * t * 0.9;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(
      -Math.cos(fanAngle) * tailLen * tMult * (0.7 + t * 0.3),
      -Math.sin(fanAngle) * tailLen * tMult * (0.7 + t * 0.3)
    );
    ctx.stroke();
  }

  glow(ctx, 16, colorPalette.cream, () => {
    ctx.fillStyle = colorPalette.cream;
    ctx.beginPath();
    ctx.arc(0, 0, lw * 1.8, 0, 2 * Math.PI);
    ctx.fill();
  });

  ctx.restore();
}
