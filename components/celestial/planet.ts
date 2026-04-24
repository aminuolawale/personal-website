import { colorPalette, glow } from "./utils";

export function drawPlanet(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  lw: number,
  traits: any
) {
  const color = traits.color || colorPalette.orange;
  const hasRing = traits.hasRing || false;
  const bands = traits.bands || false;

  ctx.save();
  ctx.translate(cx, cy);

  ctx.globalAlpha = 0.55;
  ctx.fillStyle = "#020122";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, 2 * Math.PI);
  ctx.fill();

  if (bands) {
    ctx.save();
    ctx.clip(); 
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = color;
    ctx.lineWidth = lw * 2;
    for(let y = -r; y < r; y += lw * 4) {
      ctx.beginPath();
      ctx.moveTo(-r, y);
      ctx.lineTo(r, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  glow(ctx, 14, color, () => {
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, 2 * Math.PI);
    ctx.stroke();
  });

  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = colorPalette.cream;
  ctx.lineWidth = lw * 0.8;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.85, Math.PI * 1.1, Math.PI * 1.75);
  ctx.stroke();
  ctx.restore();

  if (hasRing) {
    const rx = r * 1.85;
    const ry = r * 0.38;

    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = colorPalette.gold;
    ctx.lineWidth = lw * 0.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI); 
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "#020122";
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(0, 0, r - 0.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    glow(ctx, 10, color, () => {
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, 2 * Math.PI);
      ctx.stroke();
    });

    glow(ctx, 8, colorPalette.gold, () => {
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = colorPalette.gold;
      ctx.lineWidth = lw * 0.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, Math.PI, 2 * Math.PI); 
      ctx.stroke();
    });
  }

  ctx.restore();
}
