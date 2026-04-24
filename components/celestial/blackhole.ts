import { colorPalette, glow } from "./utils";

export function drawBlackHole(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  lw: number,
  traits: any
) {
  const color = traits.color || colorPalette.orange;
  const jets = traits.jets !== false;
  const asymmetry = traits.asymmetry !== false;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(0.2);

  for (let i = 4; i >= 1; i--) {
    ctx.save();
    ctx.globalAlpha = 0.07 * i;
    ctx.strokeStyle = color;
    ctx.lineWidth = lw * 0.6;
    ctx.beginPath();
    ctx.arc(0, 0, r + i * (r * 0.35), 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  glow(ctx, 18, color, () => {
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = color;
    ctx.lineWidth = lw * 1.2;
    ctx.beginPath();
    if (asymmetry) {
      ctx.arc(0, 0, r, 0, Math.PI);
      ctx.stroke();
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(0, 0, r, Math.PI, 2 * Math.PI);
      ctx.stroke();
    } else {
      ctx.arc(0, 0, r, 0, 2 * Math.PI);
      ctx.stroke();
    }
  });

  glow(ctx, 8, colorPalette.cream, () => {
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = colorPalette.cream;
    ctx.lineWidth = lw * 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.75, 0, 2 * Math.PI);
    ctx.stroke();
  });

  if (jets) {
    glow(ctx, 6, colorPalette.cream, () => {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = colorPalette.creamAlpha(1);
      ctx.lineWidth = lw * 0.7;
      [[0, -r - 4, 0, -r - r * 1.8], [0, r + 4, 0, r + r * 1.8]].forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
    });
  }

  ctx.restore();
}
