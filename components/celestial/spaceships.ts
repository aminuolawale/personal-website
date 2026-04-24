import { P, glow } from "./utils";

export function drawRocket(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  lw: number
) {
  const w = 18 * scale;
  const h = 100 * scale;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.15); 

  ctx.fillStyle = "#020122";
  ctx.globalAlpha = 0.85;

  glow(ctx, 10, P.orange, () => {
    ctx.strokeStyle = P.orange;
    ctx.lineWidth = lw * 0.6;
    ctx.beginPath();
    ctx.rect(-w * 0.6, -h * 0.3, w * 1.2, h * 0.8);
    ctx.fill();
    ctx.stroke();
  });

  const bw = w * 0.35;
  const bh = h * 0.65;
  glow(ctx, 8, P.cream, () => {
    ctx.strokeStyle = P.cream;
    ctx.lineWidth = lw * 0.5;
    for (const sign of [-1, 1]) {
      const bx = sign * w * 0.85;
      ctx.beginPath();
      ctx.moveTo(bx - bw, -bh * 0.4);
      ctx.lineTo(bx - bw, bh * 0.5);
      ctx.lineTo(bx + bw, bh * 0.5);
      ctx.lineTo(bx + bw, -bh * 0.4);
      ctx.lineTo(bx, -bh * 0.6); 
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  });

  glow(ctx, 8, P.cream, () => {
    ctx.strokeStyle = P.cream;
    ctx.lineWidth = lw * 0.5;
    ctx.beginPath();
    ctx.moveTo(-w * 0.6, -h * 0.3);
    ctx.lineTo(-w * 0.4, -h * 0.45);
    ctx.lineTo(-w * 0.4, -h * 0.6); 
    ctx.lineTo(-w * 0.25, -h * 0.7); 
    ctx.lineTo(0, -h * 0.9); 
    ctx.lineTo(w * 0.25, -h * 0.7);
    ctx.lineTo(w * 0.4, -h * 0.6);
    ctx.lineTo(w * 0.4, -h * 0.45);
    ctx.lineTo(w * 0.6, -h * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  ctx.globalAlpha = 1.0;
  glow(ctx, 15, P.orange, () => {
    ctx.strokeStyle = P.gold;
    ctx.lineWidth = lw * 0.8;
    ctx.beginPath();
    ctx.moveTo(-w * 0.3, h * 0.5);
    ctx.lineTo(0, h * 0.85);
    ctx.lineTo(w * 0.3, h * 0.5);
    ctx.stroke();
    for (const sign of [-1, 1]) {
      const bx = sign * w * 0.85;
      ctx.beginPath();
      ctx.moveTo(bx - bw * 0.5, bh * 0.5);
      ctx.lineTo(bx, bh * 0.5 + h * 0.25);
      ctx.lineTo(bx + bw * 0.5, bh * 0.5);
      ctx.stroke();
    }
  });

  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = P.gold;
  ctx.lineWidth = lw * 0.3;
  ctx.beginPath();
  ctx.moveTo(-w * 0.6, 0);
  ctx.lineTo(w * 0.6, 0);
  ctx.moveTo(-w * 0.6, h * 0.25);
  ctx.lineTo(w * 0.6, h * 0.25);
  ctx.stroke();

  ctx.restore();
}

export function drawStarship(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  lw: number
) {
  const w = 14 * scale;
  const h = 180 * scale; 
  const tw = 25 * scale; 
  const th = 220 * scale; 

  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = "#020122";
  ctx.globalAlpha = 0.85;

  const tx = -w * 2.5; 
  glow(ctx, 3, P.gold, () => {
    ctx.strokeStyle = P.gold;
    ctx.lineWidth = lw * 0.2;
    ctx.beginPath();
    ctx.moveTo(tx - tw * 0.5, h * 0.5);
    ctx.lineTo(tx - tw * 0.5, h * 0.5 - th);
    ctx.moveTo(tx + tw * 0.5, h * 0.5);
    ctx.lineTo(tx + tw * 0.5, h * 0.5 - th);
    ctx.stroke();

    const segments = 20;
    const segH = th / segments;
    ctx.beginPath();
    for (let i = 0; i < segments; i++) {
      const y1 = h * 0.5 - i * segH;
      const y2 = h * 0.5 - (i + 1) * segH;
      ctx.moveTo(tx - tw * 0.5, y1);
      ctx.lineTo(tx + tw * 0.5, y2);
      ctx.moveTo(tx + tw * 0.5, y1);
      ctx.lineTo(tx - tw * 0.5, y2);
      ctx.moveTo(tx - tw * 0.5, y1);
      ctx.lineTo(tx + tw * 0.5, y1);
    }
    ctx.stroke();

    const armsY = h * 0.5 - th * 0.65;
    ctx.lineWidth = lw * 0.3;
    ctx.beginPath();
    ctx.moveTo(tx + tw * 0.5, armsY);
    ctx.lineTo(tx + tw * 0.5 + w * 2.2, armsY - h * 0.02);
    ctx.moveTo(tx + tw * 0.5, armsY + h * 0.05);
    ctx.lineTo(tx + tw * 0.5 + w * 2.4, armsY + h * 0.03);
    ctx.stroke();
  });

  const shH = h * 0.55;
  const shipH = h * 0.45;
  const baseY = h * 0.5;
  
  glow(ctx, 4, P.cream, () => {
    ctx.strokeStyle = P.cream;
    ctx.lineWidth = lw * 0.25;
    ctx.beginPath();
    ctx.rect(-w * 0.5, baseY - shH, w, shH);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-w * 0.5, baseY - shH + h * 0.05);
    ctx.lineTo(-w * 1.2, baseY - shH + h * 0.05);
    ctx.lineTo(-w * 1.2, baseY - shH + h * 0.08);
    ctx.lineTo(-w * 0.5, baseY - shH + h * 0.08);
    ctx.moveTo(w * 0.5, baseY - shH + h * 0.05);
    ctx.lineTo(w * 1.2, baseY - shH + h * 0.05);
    ctx.lineTo(w * 1.2, baseY - shH + h * 0.08);
    ctx.lineTo(w * 0.5, baseY - shH + h * 0.08);
    ctx.stroke();
  });

  glow(ctx, 4, P.cream, () => {
    ctx.strokeStyle = P.cream;
    ctx.lineWidth = lw * 0.25;
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, baseY - shH);
    ctx.lineTo(-w * 0.5, baseY - shH - shipH * 0.6);
    ctx.bezierCurveTo(
      -w * 0.5, baseY - shH - shipH * 0.9,
      -w * 0.1, baseY - shH - shipH,
      0, baseY - shH - shipH
    );
    ctx.bezierCurveTo(
      w * 0.1, baseY - shH - shipH,
      w * 0.5, baseY - shH - shipH * 0.9,
      w * 0.5, baseY - shH - shipH * 0.6
    );
    ctx.lineTo(w * 0.5, baseY - shH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    const noseY = baseY - shH - shipH * 0.7;
    ctx.moveTo(-w * 0.45, noseY);
    ctx.lineTo(-w * 1.1, noseY);
    ctx.lineTo(-w * 1.1, noseY + h * 0.08);
    ctx.lineTo(-w * 0.5, noseY + h * 0.05);
    ctx.moveTo(w * 0.45, noseY);
    ctx.lineTo(w * 1.1, noseY);
    ctx.lineTo(w * 1.1, noseY + h * 0.08);
    ctx.lineTo(w * 0.5, noseY + h * 0.05);
    ctx.stroke();

    ctx.beginPath();
    const aftY = baseY - shH - shipH * 0.1;
    ctx.moveTo(-w * 0.5, aftY);
    ctx.lineTo(-w * 1.2, aftY + h * 0.05);
    ctx.lineTo(-w * 1.2, aftY + h * 0.15);
    ctx.lineTo(-w * 0.5, aftY + h * 0.12);
    ctx.moveTo(w * 0.5, aftY);
    ctx.lineTo(w * 1.2, aftY + h * 0.05);
    ctx.lineTo(w * 1.2, aftY + h * 0.15);
    ctx.lineTo(w * 0.5, aftY + h * 0.12);
    ctx.stroke();
  });

  glow(ctx, 10, P.cream, () => {
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = P.cream;
    ctx.lineWidth = lw * 0.15;
    for(let i=0; i<8; i++) {
      ctx.beginPath();
      ctx.moveTo(-w * 1.5 + Math.random() * w * 3, baseY);
      ctx.lineTo(-w * 2.5 + Math.random() * w * 5, baseY + h * 0.08 + Math.random() * h * 0.05);
      ctx.stroke();
    }
  });

  ctx.restore();
}
