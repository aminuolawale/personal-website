"use client";

import { useEffect, useRef } from "react";

// ── Seeded PRNG (Mulberry32) so layout is deterministic ───────────────────
function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Colour helpers ────────────────────────────────────────────────────────
const C = {
  orange: "#fc9e4f",
  gold: "#edd382",
  cream: "#f2f3ae",
  red: "#f4442e",
  oa: (a: number) => `rgba(252,158,79,${a})`,
  ga: (a: number) => `rgba(237,211,130,${a})`,
  ca: (a: number) => `rgba(242,243,174,${a})`,
  ra: (a: number) => `rgba(244,68,46,${a})`,
};

// ── Core "fat pixel" primitive ────────────────────────────────────────────
function px(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  ps: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.fillRect(gx * ps, gy * ps, ps - 1, ps - 1);
}

// ── Celestial drawers ─────────────────────────────────────────────────────

function drawGalaxy(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  ps: number
) {
  const gx = Math.floor(cx / ps);
  const gy = Math.floor(cy / ps);
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      if (dist < 1.2) {
        px(ctx, gx + dx, gy + dy, ps, C.cream);
      } else if (dist < r * 0.35) {
        if (Math.sin(angle * 2 + dist * 0.6) > -0.1)
          px(ctx, gx + dx, gy + dy, ps, C.gold);
      } else if (dist < r * 0.65) {
        if (Math.sin(angle * 2 + dist * 0.9) > 0.2)
          px(ctx, gx + dx, gy + dy, ps, C.orange);
      } else if (dist < r) {
        if (Math.sin(angle * 2 + dist * 1.1) > 0.45)
          px(ctx, gx + dx, gy + dy, ps, C.oa(0.55));
      }
    }
  }
}

function drawNebula(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  ps: number,
  rand: () => number
) {
  const gx = Math.floor(cx / ps);
  const gy = Math.floor(cy / ps);
  const palette = [C.oa(0.55), C.ga(0.5), C.ra(0.45), C.ca(0.4)];
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy) / r;
      const noise = rand();
      if (noise > dist * 0.55 + 0.15 && noise > 0.32) {
        px(ctx, gx + dx, gy + dy, ps, palette[Math.floor(rand() * palette.length)]);
      }
    }
  }
}

function drawPlanet(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  ps: number,
  color: string,
  hasRing: boolean
) {
  const gx = Math.floor(cx / ps);
  const gy = Math.floor(cy / ps);
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) {
        px(ctx, gx + dx, gy + dy, ps, color);
      }
    }
  }
  if (hasRing) {
    const rx = r + 3,
      ry = Math.max(1, Math.round(r * 0.38) + 1);
    for (let dy = -ry; dy <= ry; dy++) {
      for (let dx = -rx; dx <= rx; dx++) {
        const t = (dx / rx) ** 2 + (dy / ry) ** 2;
        if (t >= 0.65 && t <= 1.35 && dx * dx + dy * dy > r * r) {
          px(ctx, gx + dx, gy + dy, ps, C.ga(0.6));
        }
      }
    }
  }
}

function drawComet(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
  tailLen: number,
  ps: number,
  rand: () => number
) {
  const gx = Math.floor(cx / ps);
  const gy = Math.floor(cy / ps);
  const tx = -Math.cos(angle);
  const ty = -Math.sin(angle);
  px(ctx, gx, gy, ps, C.cream);
  px(ctx, gx - 1, gy, ps, C.ga(0.75));
  for (let i = 1; i <= tailLen; i++) {
    const a = 1 - i / tailLen;
    const bx = Math.round(tx * i);
    const by = Math.round(ty * i);
    px(ctx, gx + bx, gy + by, ps, C.ga(a * 0.8));
    if (i > 1 && rand() > 0.45) {
      const side = rand() > 0.5 ? 1 : -1;
      px(ctx, gx + bx + Math.round(-ty * side), gy + by + Math.round(tx * side), ps, C.oa(a * 0.4));
    }
  }
}

function drawBlackHole(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  ps: number
) {
  const gx = Math.floor(cx / ps);
  const gy = Math.floor(cy / ps);
  const ri = r - 1,
    ro = r + 1;
  for (let dy = -(ro + 2); dy <= ro + 2; dy++) {
    for (let dx = -(ro + 2); dx <= ro + 2; dx++) {
      const d2 = dx * dx + dy * dy;
      if (d2 >= ri * ri && d2 <= ro * ro) {
        px(ctx, gx + dx, gy + dy, ps, C.orange);
      } else if (d2 > ro * ro && d2 <= (ro + 2) * (ro + 2)) {
        px(ctx, gx + dx, gy + dy, ps, C.oa(0.28));
      }
    }
  }
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  count: number,
  rand: () => number
) {
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rand() * w);
    const y = Math.floor(rand() * h);
    const b = rand();
    ctx.fillStyle =
      b > 0.88 ? C.cream : b > 0.6 ? C.ga(0.55) : C.ga(0.22);
    ctx.fillRect(x, y, 1, 1);
  }
}

// ── Layer config ──────────────────────────────────────────────────────────
interface LayerCfg {
  speed: number;
  blur: number;
  ps: number;
  objects: number;
  stars: number;
  seed: number;
}

const LAYERS: LayerCfg[] = [
  { speed: 0.06, blur: 3.5, ps: 3, objects: 6,  stars: 50, seed: 1337 },
  { speed: 0.16, blur: 1.5, ps: 4, objects: 5,  stars: 25, seed: 2674 },
  { speed: 0.28, blur: 0,   ps: 5, objects: 4,  stars: 10, seed: 3999 },
];

type ObjType = "galaxy" | "nebula" | "planet" | "comet" | "blackhole";
const OBJ_TYPES: ObjType[] = ["galaxy", "nebula", "planet", "comet", "blackhole"];

// ── Component ─────────────────────────────────────────────────────────────
export default function CelestialBackground() {
  const refs = useRef<(HTMLCanvasElement | null)[]>([null, null, null]);

  useEffect(() => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2× for perf
    const VW = window.innerWidth;
    const VH = window.innerHeight;
    // Canvas is 170vh tall, starting 35vh above viewport top.
    // This provides parallax headroom without gaps on typical page lengths.
    const H = VH * 1.7;
    const offsetTop = -(VH * 0.35);

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

      // Stars first (background)
      drawStars(ctx, VW, H, layer.stars, rand);

      // Celestial objects
      const planetColors = [C.orange, C.gold, C.red, C.cream];
      for (let i = 0; i < layer.objects; i++) {
        const x = rand() * VW;
        const y = rand() * H;
        const type: ObjType = OBJ_TYPES[Math.floor(rand() * OBJ_TYPES.length)];

        switch (type) {
          case "galaxy":
            drawGalaxy(ctx, x, y, 4 + Math.floor(rand() * 4), layer.ps);
            break;
          case "nebula":
            drawNebula(ctx, x, y, 3 + Math.floor(rand() * 4), layer.ps, rand);
            break;
          case "planet":
            drawPlanet(
              ctx, x, y,
              2 + Math.floor(rand() * 3),
              layer.ps,
              planetColors[Math.floor(rand() * planetColors.length)],
              rand() > 0.5
            );
            break;
          case "comet":
            drawComet(ctx, x, y, rand() * Math.PI * 2, 4 + Math.floor(rand() * 5), layer.ps, rand);
            break;
          case "blackhole":
            drawBlackHole(ctx, x, y, 2 + Math.floor(rand() * 3), layer.ps);
            break;
        }
      }
    });

    // Passive scroll → compositor-only transform on each canvas layer
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
          ref={(el) => {
            refs.current[li] = el;
          }}
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
