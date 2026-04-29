import { colorPalette, glow } from "./utils";

export interface NebulaTraits {
  shape?: 'cloud' | 'ring' | 'burst' | 'pillars';
  color1?: string;
  color2?: string;
}

export function drawNebula(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  nebulaRadius: number,
  lineWidth: number,
  rand: () => number,
  traits: NebulaTraits,
  isDark: boolean = true
) {
  const shape = traits.shape || 'cloud';
  const primaryColor   = traits.color1 || colorPalette.orange;
  const secondaryColor = traits.color2 || colorPalette.gold;
  const palette = [primaryColor, secondaryColor, colorPalette.cream];

  ctx.save();
  ctx.translate(centerX, centerY);

  if (shape === 'ring') {
    glow(ctx, 15, primaryColor, () => {
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = lineWidth * 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, nebulaRadius, nebulaRadius * 0.7, 0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = secondaryColor;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.ellipse(0, 0, nebulaRadius * 0.8, nebulaRadius * 0.5, 0.3, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.fillStyle = colorPalette.cream;
    ctx.beginPath();
    ctx.arc(0, 0, lineWidth, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'burst') {
    for (let i = 0; i < 40; i++) {
      const burstAngle  = rand() * Math.PI * 2;
      const burstLength = nebulaRadius * (0.3 + rand() * 0.7);
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = palette[Math.floor(rand() * palette.length)];
      ctx.lineWidth = lineWidth * (0.2 + rand() * 0.5);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(burstAngle) * burstLength, Math.sin(burstAngle) * burstLength);
      ctx.stroke();
    }
  } else if (shape === 'pillars') {
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = lineWidth * 1.5;
    ctx.fillStyle = "#020122";
    for (let i = -1; i <= 1; i++) {
      const pillarCenterX = i * nebulaRadius * 0.4;
      const pillarHeight  = nebulaRadius * (0.8 + rand() * 0.4);
      ctx.beginPath();
      ctx.moveTo(pillarCenterX - nebulaRadius * 0.1, nebulaRadius);
      ctx.lineTo(pillarCenterX, nebulaRadius - pillarHeight);
      ctx.lineTo(pillarCenterX + nebulaRadius * 0.1, nebulaRadius);
      ctx.fill();
      ctx.stroke();
    }
    glow(ctx, 10, secondaryColor, () => {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = secondaryColor;
      ctx.beginPath();
      ctx.arc(0, -nebulaRadius * 0.2, nebulaRadius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    });
  } else {
    // Cloud shape (default).
    // Light mode uses higher alpha so warm colors read against the white background.
    const baseAlpha  = isDark ? 0.05 : 0.10;
    const alphaRange = isDark ? 0.07 : 0.12;
    const blobCount  = 5 + Math.floor(rand() * 4);
    for (let i = 0; i < blobCount; i++) {
      const blobCenterX = (rand() - 0.5) * nebulaRadius * 0.7;
      const blobCenterY = (rand() - 0.5) * nebulaRadius * 0.7;
      const blobRadius  = nebulaRadius * (0.25 + rand() * 0.75);
      const color = palette[Math.floor(rand() * palette.length)];
      const alpha = baseAlpha + rand() * alphaRange;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(blobCenterX, blobCenterY, blobRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = alpha * 2.5;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth * 0.5;
      ctx.beginPath();
      ctx.arc(blobCenterX, blobCenterY, blobRadius, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
}
