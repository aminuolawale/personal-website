"use client";

import { useEffect, useRef } from "react";

// ── Seeded PRNG ───────────────────────────────────────────────────────────
function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Colour palette ────────────────────────────────────────────────────────
const P = {
  orange: "#fc9e4f",
  gold: "#edd382",
  cream: "#f2f3ae",
  red: "#f4442e",
  oa: (a: number) => `rgba(252,158,79,${a.toFixed(3)})`,
  ga: (a: number) => `rgba(237,211,130,${a.toFixed(3)})`,
  ca: (a: number) => `rgba(242,243,174,${a.toFixed(3)})`,
  ra: (a: number) => `rgba(244,68,46,${a.toFixed(3)})`,
};

// ── Helpers ───────────────────────────────────────────────────────────────
function glow(
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

// ── Galaxy: Archimedean spiral ────────────────────────────────────────────
function drawGalaxy(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  lw: number
) {
  const turns = 1.6;
  const a = R / (turns * 2 * Math.PI);
  const steps = 300;

  // Two spiral arms
  for (let arm = 0; arm < 2; arm++) {
    const offset = arm * Math.PI;

    // Faint outer trail
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = P.oa(1);
    ctx.lineWidth = lw * 0.7;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * turns * 2 * Math.PI;
      const r = a * theta;
      const x = cx + r * Math.cos(theta + offset);
      const y = cy + r * Math.sin(theta + offset);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // Bright inner core of the arm (inner 60%)
    glow(ctx, lw * 10, P.orange, () => {
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = P.gold;
      ctx.lineWidth = lw;
      ctx.beginPath();
      const innerSteps = Math.floor(steps * 0.6);
      for (let i = 0; i <= innerSteps; i++) {
        const theta = (i / steps) * turns * 2 * Math.PI;
        const r = a * theta;
        const x = cx + r * Math.cos(theta + offset);
        const y = cy + r * Math.sin(theta + offset);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
  }

  // Outer halo circle
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = P.orange;
  ctx.lineWidth = lw * 0.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.9, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.restore();

  // Bright nucleus
  glow(ctx, 22, P.cream, () => {
    ctx.fillStyle = P.cream;
    ctx.beginPath();
    ctx.arc(cx, cy, lw * 2, 0, 2 * Math.PI);
    ctx.fill();
  });

  glow(ctx, 14, P.gold, () => {
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = P.gold;
    ctx.lineWidth = lw * 0.7;
    ctx.beginPath();
    ctx.arc(cx, cy, lw * 4, 0, 2 * Math.PI);
    ctx.stroke();
  });
}

// ── Planet with ring ──────────────────────────────────────────────────────
function drawPlanet(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  lw: number,
  color: string,
  hasRing: boolean
) {
  // Subtle interior fill (dark so it reads as a solid body)
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = "#020122";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();

  // Outline with glow
  glow(ctx, 14, color, () => {
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.stroke();
  });

  // Lit crescent on upper-left
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = P.cream;
  ctx.lineWidth = lw * 0.8;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.85, Math.PI * 1.1, Math.PI * 1.75);
  ctx.stroke();
  ctx.restore();

  if (hasRing) {
    const rx = r * 1.85;
    const ry = r * 0.38;

    // Back half (behind planet — drawn first, partially occluded)
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = P.gold;
    ctx.lineWidth = lw * 0.8;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI); // bottom half = "back"
    ctx.stroke();
    ctx.restore();

    // Redraw planet fill to occlude back ring
    ctx.save();
    ctx.fillStyle = "#020122";
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 0.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    // Redraw planet outline on top
    glow(ctx, 10, color, () => {
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.stroke();
    });

    // Front half of ring (in front of planet)
    glow(ctx, 8, P.gold, () => {
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = P.gold;
      ctx.lineWidth = lw * 0.8;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, 2 * Math.PI); // top half = "front"
      ctx.stroke();
    });
  }
}

// ── Black hole with lensing rings ─────────────────────────────────────────
function drawBlackHole(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  lw: number
) {
  // Gravitational lensing rings (concentric, fading out)
  for (let i = 4; i >= 1; i--) {
    ctx.save();
    ctx.globalAlpha = 0.07 * i;
    ctx.strokeStyle = P.orange;
    ctx.lineWidth = lw * 0.6;
    ctx.beginPath();
    ctx.arc(cx, cy, r + i * (r * 0.35), 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  // Accretion disk — bright ring
  glow(ctx, 18, P.orange, () => {
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = P.orange;
    ctx.lineWidth = lw * 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.stroke();
  });

  // Inner bright edge
  glow(ctx, 8, P.cream, () => {
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = P.cream;
    ctx.lineWidth = lw * 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.75, 0, 2 * Math.PI);
    ctx.stroke();
  });

  // Relativistic jets
  glow(ctx, 6, P.cream, () => {
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = P.ca(1);
    ctx.lineWidth = lw * 0.7;
    [[cx, cy - r - 4, cx, cy - r - r * 1.8] as const,
     [cx, cy + r + 4, cx, cy + r + r * 1.8] as const
    ].forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
  });
}

// ── Nebula: overlapping rings/arcs (contour-map style) ────────────────────
function drawNebula(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  lw: number,
  rand: () => number
) {
  const blobs = 5 + Math.floor(rand() * 4);
  const palette = [P.orange, P.gold, P.red, P.cream];

  for (let i = 0; i < blobs; i++) {
    const bx = cx + (rand() - 0.5) * r * 0.7;
    const by = cy + (rand() - 0.5) * r * 0.7;
    const br = r * (0.25 + rand() * 0.75);
    const color = palette[Math.floor(rand() * palette.length)];
    const alpha = 0.05 + rand() * 0.07;

    // Soft fill
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    // Sharp outline
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

// ── Comet ─────────────────────────────────────────────────────────────────
function drawComet(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
  tailLen: number,
  lw: number
) {
  const spread = 0.28; // half-cone angle in radians
  const fanCount = 5;

  // Tail rays
  ctx.save();
  ctx.lineCap = "round";
  for (let s = -(fanCount - 1) / 2; s <= (fanCount - 1) / 2; s++) {
    const fanAngle = angle + (s / ((fanCount - 1) / 2)) * spread;
    const t = 1 - Math.abs(s) / ((fanCount - 1) / 2 + 1);
    ctx.globalAlpha = 0.6 * t;
    ctx.strokeStyle = s === 0 ? P.gold : P.orange;
    ctx.lineWidth = lw * t * 0.9;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx - Math.cos(fanAngle) * tailLen * (0.7 + t * 0.3),
      cy - Math.sin(fanAngle) * tailLen * (0.7 + t * 0.3)
    );
    ctx.stroke();
  }
  ctx.restore();

  // Head nucleus
  glow(ctx, 16, P.cream, () => {
    ctx.fillStyle = P.cream;
    ctx.beginPath();
    ctx.arc(cx, cy, lw * 1.8, 0, 2 * Math.PI);
    ctx.fill();
  });
}

// ── Star field ────────────────────────────────────────────────────────────
function drawStarField(
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
      // Bright star with 4-spike cross
      const r = 1.2 + rand() * 0.8;
      const spikeLen = 5 + rand() * 6;
      glow(ctx, 7, P.cream, () => {
        ctx.fillStyle = P.cream;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = P.ca(0.6);
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
      ctx.fillStyle = P.ca(0.55 + rand() * 0.3);
      ctx.beginPath();
      ctx.arc(x, y, 0.9, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      ctx.fillStyle = P.ga(0.18 + rand() * 0.2);
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

// ── Layer config ──────────────────────────────────────────────────────────
interface LayerCfg {
  speed: number;
  blur: number;
  scale: number;  // size multiplier for objects
  lw: number;     // base line width
  objects: number;
  stars: number;
  seed: number;
}

const LAYERS: LayerCfg[] = [
  { speed: 0.05, blur: 4.5, scale: 0.5,  lw: 0.7, objects: 9,  stars: 220, seed: 1337 },
  { speed: 0.15, blur: 1.8, scale: 0.72, lw: 1.0, objects: 6,  stars: 70,  seed: 2674 },
  { speed: 0.27, blur: 0,   scale: 1.0,  lw: 1.3, objects: 5,  stars: 22,  seed: 4001 },
];

type ObjType = "galaxy" | "nebula" | "planet" | "comet" | "blackhole";
const OBJ_TYPES: ObjType[] = ["galaxy", "nebula", "planet", "comet", "blackhole"];
const PLANET_COLORS = [P.orange, P.gold, P.red, P.cream];

// ── Component ─────────────────────────────────────────────────────────────
export default function CelestialBackground() {
  const refs = useRef<(HTMLCanvasElement | null)[]>([null, null, null]);

  useEffect(() => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const VW = window.innerWidth;
    const VH = window.innerHeight;
    const H = VH * 1.8;
    const offsetTop = -(VH * 0.4);

    LAYERS.forEach((layer, li) => {
      const canvas = refs.current[li];
      if (!canvas) return;

      canvas.width = Math.round(VW * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = VW + "px";
      canvas.style.height = H + "px";
      canvas.style.top = offsetTop + "px";
      canvas.style.left = "0";

      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);

      const rand = mulberry32(layer.seed);

      drawStarField(ctx, VW, H, layer.stars, rand);

      for (let i = 0; i < layer.objects; i++) {
        const cx = rand() * VW;
        const cy = rand() * H;
        const type: ObjType = OBJ_TYPES[Math.floor(rand() * OBJ_TYPES.length)];
        const s = layer.scale;

        switch (type) {
          case "galaxy":
            drawGalaxy(ctx, cx, cy, (50 + rand() * 45) * s, layer.lw);
            break;
          case "nebula":
            drawNebula(ctx, cx, cy, (50 + rand() * 45) * s, layer.lw, rand);
            break;
          case "planet":
            drawPlanet(
              ctx, cx, cy,
              (22 + rand() * 22) * s,
              layer.lw,
              PLANET_COLORS[Math.floor(rand() * PLANET_COLORS.length)],
              rand() > 0.4
            );
            break;
          case "comet":
            drawComet(ctx, cx, cy, rand() * Math.PI * 2, (55 + rand() * 45) * s, layer.lw);
            break;
          case "blackhole":
            drawBlackHole(ctx, cx, cy, (18 + rand() * 20) * s, layer.lw);
            break;
        }
      }
    });

    // Scroll → compositor-only transform, no repaint
    let rafId = 0;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const sy = window.scrollY;
        LAYERS.forEach((layer, li) => {
          const el = refs.current[li];
          if (el) el.style.transform = `translateY(${-(sy * layer.speed).toFixed(2)}px)`;
        });
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: -1 }}
    >
      {LAYERS.map((layer, li) => (
        <canvas
          key={li}
          ref={(el) => { refs.current[li] = el; }}
          className="absolute"
          style={{
            filter: layer.blur > 0 ? `blur(${layer.blur}px)` : undefined,
            willChange: "transform",
          }}
        />
      ))}
    </div>
  );
}
