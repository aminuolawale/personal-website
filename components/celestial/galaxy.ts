import { P, glow } from "./utils";

export function drawGalaxy(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  lw: number,
  traits: any,
  rand: () => number
) {
  const tilt = traits.tilt || 1.0;
  const coreColor = traits.core || P.cream;
  const armColor = traits.arm || P.orange;
  const dustLane = traits.dustLane || false;

  const turns = 1.6;
  const a = R / (turns * 2 * Math.PI);
  const steps = 300;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, tilt);
  ctx.rotate(rand() * Math.PI * 2);

  // Two spiral arms
  for (let arm = 0; arm < 2; arm++) {
    const offset = arm * Math.PI;

    // Faint outer trail
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = armColor;
    ctx.lineWidth = lw * 0.7;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * turns * 2 * Math.PI;
      const r = a * theta;
      const x = r * Math.cos(theta + offset);
      const y = r * Math.sin(theta + offset);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // Bright inner core of the arm
    glow(ctx, lw * 10, armColor, () => {
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = armColor;
      ctx.lineWidth = lw;
      ctx.beginPath();
      const innerSteps = Math.floor(steps * 0.6);
      for (let i = 0; i <= innerSteps; i++) {
        const theta = (i / steps) * turns * 2 * Math.PI;
        const r = a * theta;
        const x = r * Math.cos(theta + offset);
        const y = r * Math.sin(theta + offset);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
  }

  // Outer halo circle
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = armColor;
  ctx.lineWidth = lw * 0.5;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.9, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.restore();

  // Dust lane
  if (dustLane) {
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = "#020122";
    ctx.lineWidth = lw * 6;
    ctx.beginPath();
    ctx.moveTo(-R, 0);
    ctx.lineTo(R, 0);
    ctx.stroke();
    ctx.restore();
  }

  // Bright nucleus
  glow(ctx, 22, coreColor, () => {
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.arc(0, 0, lw * (dustLane ? 4 : 2), 0, 2 * Math.PI);
    ctx.fill();
  });

  glow(ctx, 14, coreColor, () => {
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = lw * 0.7;
    ctx.beginPath();
    ctx.arc(0, 0, lw * (dustLane ? 8 : 4), 0, 2 * Math.PI);
    ctx.stroke();
  });

  ctx.restore();
}
