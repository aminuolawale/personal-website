"use client";

import { useEffect, useRef, useState } from "react";

import { CelestialData, CELESTIAL_CATALOG } from "./celestial/catalog";
import { colorPalette, mulberry32 } from "./celestial/utils";
import { drawNebula } from "./celestial/nebula";
import { drawStarField } from "./celestial/starfield";

// ── Layer config ──────────────────────────────────────────────────────────
interface LayerCfg {
  speed: number;
  blur: number;   // baked into canvas pixels, not applied as CSS filter
  scale: number;
  lw: number;
  objects: number;
  stars: number;
  seed: number;
}

interface Hitbox {
  x: number;
  y: number;
  r: number;
  layerSpeed: number;
  data: CelestialData;
}

const LAYERS: LayerCfg[] = [
  { speed: 0.05, blur: 4.5, scale: 0.5,  lw: 0.7, objects: 0, stars: 100, seed: 1337 },
  { speed: 0.15, blur: 1.8, scale: 0.72, lw: 1.0, objects: 0, stars: 50,  seed: 2674 },
  { speed: 0.27, blur: 0,   scale: 1.0,  lw: 1.3, objects: 1, stars: 22,  seed: 4001 },
];

// Simplified single layer used on touch/mobile devices
const MOBILE_CFG: LayerCfg = {
  speed: 0, blur: 0, scale: 0.75, lw: 1.0, objects: 1, stars: 100, seed: 7777,
};

function drawLayer(
  canvas: HTMLCanvasElement,
  layer: LayerCfg,
  VW: number,
  H: number,
  VH: number,
  maxScroll: number,
  dpr: number,
  showObjects: boolean,
  shuffledCatalog: CelestialData[],
  allObjects: CelestialData[],
  hitboxes: Hitbox[],
) {
  canvas.width  = Math.round(VW * dpr);
  canvas.height = Math.round(H  * dpr);
  canvas.style.width  = `${VW}px`;
  canvas.style.height = `${H}px`;
  canvas.style.top    = "0px";
  canvas.style.left   = "0";

  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, VW, H);

  const rand = mulberry32(layer.seed);

  // Bake blur into canvas pixels during the one-time draw.
  // This is far cheaper than CSS filter during scroll because the browser
  // can then animate the canvas via compositor-only transform with no repaint.
  if (layer.blur > 0) ctx.filter = `blur(${layer.blur}px)`;

  drawStarField(ctx, VW, H, layer.stars, rand);

  if (showObjects) {
    const min_cy  = VH * 0.2;
    const max_cy  = VH * 0.9 + maxScroll * layer.speed;
    const binSize = (max_cy - min_cy) / Math.max(layer.objects, 1);

    for (let i = 0; i < layer.objects; i++) {
      const cy = min_cy + i * binSize + (rand() * 0.6 + 0.2) * binSize;
      const cx = (i % 2 === 0)
        ? VW / 2 + rand() * (VW / 2 - 100)
        : 50      + rand() * (VW / 2 - 100);

      const data   = shuffledCatalog.pop() || allObjects[0];
      const s      = layer.scale;
      const radius = (50 + rand() * 45) * s;

      drawNebula(ctx, cx, cy, radius, layer.lw, rand, data.traits);
      hitboxes.push({ x: cx, y: cy, r: radius * 1.5, layerSpeed: layer.speed, data });
    }
  }

  if (layer.blur > 0) ctx.filter = "none";
}

// ── Component ─────────────────────────────────────────────────────────────
export default function CelestialBackground({
  showObjects = true,
  forceBright = false,
}: {
  showObjects?: boolean;
  forceBright?: boolean;
}) {
  // 3 desktop layers + 1 mobile layer slot
  const refs        = useRef<(HTMLCanvasElement | null)[]>([null, null, null, null]);
  const hitboxesRef = useRef<Hitbox[]>([]);
  const tooltipRef  = useRef<HTMLDivElement>(null);
  const [hoveredData, setHoveredData] = useState<CelestialData | null>(null);

  useEffect(() => {
    const isMobile = window.matchMedia("(hover: none)").matches;
    // Mobile: 1× DPR reduces texture memory 4× compared with a 2× display
    const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);

    hitboxesRef.current = [];

    const VW = window.innerWidth;
    const VH = window.innerHeight;

    // Only the Carina Nebula
    const allObjects: CelestialData[] = CELESTIAL_CATALOG.nebula.filter(n => n.id === "ngc3372");
    const shuffledCatalog = [...allObjects];

    if (isMobile) {
      // ── Mobile path ──────────────────────────────────────────────────
      // Single static canvas, no parallax, no blur.
      // Zero out unused desktop canvases so they consume no GPU memory.
      [0, 1, 2].forEach(li => {
        const c = refs.current[li];
        if (c) { c.width = 0; c.height = 0; }
      });

      const canvas = refs.current[3];
      if (!canvas) return;

      // Defer so React finishes hydrating before the canvas blocks the thread
      setTimeout(() => {
        drawLayer(
          canvas, MOBILE_CFG,
          VW, VH, VH, 0,
          dpr, true,
          shuffledCatalog, allObjects, hitboxesRef.current,
        );
      }, 0);

      // No scroll or mousemove listeners on mobile
      return;
    }

    // ── Desktop path ─────────────────────────────────────────────────
    const maxScroll = Math.max(VH, document.documentElement.scrollHeight - VH);

    // Zero out mobile canvas slot
    const mc = refs.current[3];
    if (mc) { mc.width = 0; mc.height = 0; }

    // Parallax scroll — wire up immediately so it works even while canvases are drawing
    let rafId = 0;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const sy = window.scrollY;
        LAYERS.forEach((layer, li) => {
          const el = refs.current[li];
          if (el) el.style.transform = `translate3d(0,${-(sy * layer.speed).toFixed(2)}px,0)`;
        });
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Draw one layer per event-loop turn so the browser can process clicks between paints.
    // Each layer only needs a canvas tall enough for its own parallax travel, not the max.
    const drawNext = (li: number) => {
      if (li >= LAYERS.length) return;
      setTimeout(() => {
        const canvas = refs.current[li];
        if (canvas) {
          const layer = LAYERS[li];
          const layerH = Math.round(VH + maxScroll * layer.speed + VH * 0.2);
          drawLayer(
            canvas, layer,
            VW, layerH, VH, maxScroll,
            dpr, true,
            shuffledCatalog, allObjects, hitboxesRef.current,
          );
        }
        drawNext(li + 1);
      }, 0);
    };
    drawNext(0);

    // Hover detection — desktop only
    let currentHover: CelestialData | null = null;
    const onMouseMove = (e: MouseEvent) => {
      const sy = window.scrollY;
      const mx = e.clientX;
      const my = e.clientY;

      let found: CelestialData | null = null;
      for (const box of hitboxesRef.current) {
        const dx = mx - box.x;
        const dy = my - (box.y - sy * box.layerSpeed);
        if (dx * dx + dy * dy < box.r * box.r) { found = box.data; break; }
      }

      if (found !== currentHover) {
        currentHover = found;
        setHoveredData(found);
      }
      if (tooltipRef.current) {
        tooltipRef.current.style.transform = `translate(${mx + 15}px,${my + 15}px)`;
      }
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: -1, opacity: forceBright ? 1 : 0.4 }}
      >
        {/* Desktop layers — no CSS filter (blur is baked into pixels at draw time) */}
        {LAYERS.map((_, li) => (
          <canvas
            key={li}
            ref={(el) => { refs.current[li] = el; }}
            className="absolute"
            style={{
              willChange: "transform",
              transform: "translate3d(0,0,0)",
              // Layer 2 holds the nebula — fade it instead of redrawing on toggle
              ...(li === 2 ? {
                opacity: showObjects ? 1 : 0,
                transition: "opacity 0.4s ease",
              } : {}),
            }}
          />
        ))}

        {/* Mobile layer — static, no will-change */}
        <canvas
          ref={(el) => { refs.current[3] = el; }}
          className="absolute"
          style={{
            opacity: showObjects ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}
        />
      </div>

      {hoveredData && (
        <div
          ref={tooltipRef}
          className="fixed top-0 left-0 z-50 p-4 rounded-xl backdrop-blur-md border pointer-events-none"
          style={{
            backgroundColor: "rgba(2,1,34,0.8)",
            borderColor: colorPalette.orange,
            color: colorPalette.cream,
            width: "300px",
            boxShadow: `0 0 20px ${colorPalette.orangeAlpha(0.3)}`,
            willChange: "transform",
            zIndex: 100,
          }}
        >
          <img
            src={hoveredData.imageUrl}
            alt={hoveredData.name}
            className="w-full h-32 object-cover rounded-lg mb-3 border border-gray-700"
          />
          <h3 className="text-lg font-bold mb-1" style={{ color: colorPalette.gold }}>
            {hoveredData.name}
          </h3>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: colorPalette.orange }}>
            {hoveredData.type}
          </p>
          <p className="text-sm leading-relaxed">{hoveredData.summary}</p>
        </div>
      )}
    </>
  );
}
