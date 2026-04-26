import { colorPalette, glow } from "./utils";

export interface NebulaTraits {
  shape?: 'cloud' | 'ring' | 'burst' | 'pillars';
  color1?: string;
  color2?: string;
}

export function drawNebula(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  lw: number,
  rand: () => number,
  traits: NebulaTraits
) {
  const shape = traits.shape || 'cloud';
  const c1 = traits.color1 || colorPalette.orange;
  const c2 = traits.color2 || colorPalette.gold;
  const palette = [c1, c2, colorPalette.cream];

  ctx.save();
  ctx.translate(cx, cy);

  if (shape === 'ring') {
    glow(ctx, 15, c1, () => {
      ctx.strokeStyle = c1;
      ctx.lineWidth = lw * 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.7, 0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = c2;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.8, r * 0.5, 0.3, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.fillStyle = colorPalette.cream;
    ctx.beginPath();
    ctx.arc(0, 0, lw, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'burst') {
    for (let i = 0; i < 40; i++) {
      const a = rand() * Math.PI * 2;
      const l = r * (0.3 + rand() * 0.7);
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = palette[Math.floor(rand() * palette.length)];
      ctx.lineWidth = lw * (0.2 + rand() * 0.5);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * l, Math.sin(a) * l);
      ctx.stroke();
    }
  } else if (shape === 'pillars') {
    ctx.strokeStyle = c1;
    ctx.lineWidth = lw * 1.5;
    ctx.fillStyle = "#020122";
    for(let i=-1; i<=1; i++) {
      const px = i * r * 0.4;
      const ph = r * (0.8 + rand() * 0.4);
      ctx.beginPath();
      ctx.moveTo(px - r*0.1, r);
      ctx.lineTo(px, r - ph);
      ctx.lineTo(px + r*0.1, r);
      ctx.fill();
      ctx.stroke();
    }
    glow(ctx, 10, c2, () => {
       ctx.globalAlpha = 0.5;
       ctx.fillStyle = c2;
       ctx.beginPath();
       ctx.arc(0, -r*0.2, r*0.5, 0, Math.PI*2);
       ctx.fill();
    });
  } else {
    // Cloud shape (default)
    const blobs = 5 + Math.floor(rand() * 4);
    for (let i = 0; i < blobs; i++) {
      const bx = (rand() - 0.5) * r * 0.7;
      const by = (rand() - 0.5) * r * 0.7;
      const br = r * (0.25 + rand() * 0.75);
      const color = palette[Math.floor(rand() * palette.length)];
      const alpha = 0.05 + rand() * 0.07;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = alpha * 2.5;
      ctx.strokeStyle = color;
      ctx.lineWidth = lw * 0.5;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
}
