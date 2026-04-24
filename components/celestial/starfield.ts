import { colorPalette, glow } from "./utils";

export function drawStarField(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  count: number,
  rand: () => number
) {
  for (let i = 0; i < count; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const b = rand();

    if (b > 0.96) {
      const r = 1.2 + rand() * 0.8;
      const spikeLen = 5 + rand() * 6;
      glow(ctx, 7, colorPalette.cream, () => {
        ctx.fillStyle = colorPalette.cream;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = colorPalette.creamAlpha(0.6);
        ctx.lineWidth = 0.7;
        for (let d = 0; d < 4; d++) {
          const dx = Math.cos((d * Math.PI) / 2);
          const dy = Math.sin((d * Math.PI) / 2);
          ctx.beginPath();
          ctx.moveTo(x + dx * r, y + dy * r);
          ctx.lineTo(x + dx * (r + spikeLen), y + dy * (r + spikeLen));
          ctx.stroke();
        }
      });
    } else if (b > 0.82) {
      ctx.fillStyle = colorPalette.creamAlpha(0.55 + rand() * 0.3);
      ctx.beginPath();
      ctx.arc(x, y, 0.9, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      ctx.fillStyle = colorPalette.goldAlpha(0.18 + rand() * 0.2);
      ctx.fillRect(x, y, 1, 1);
    }
  }
}
