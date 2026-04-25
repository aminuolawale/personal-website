"use client";

import { useEffect, useRef } from "react";

import { CelestialData, CELESTIAL_CATALOG } from "./celestial/catalog";
import { mulberry32 } from "./celestial/utils";
import { drawNebula } from "./celestial/nebula";
import { drawStarField } from "./celestial/starfield";

interface LayerCfg {
  speed: number;
  blur: number;
  scale: number;
  lw: number;
  objects: number;
  stars: number;
  seed: number;
}

const LAYERS: LayerCfg[] = [
  { speed: 0.05, blur: 4.5, scale: 0.5,  lw: 0.7, objects: 0, stars: 100, seed: 1337 },
  { speed: 0.15, blur: 1.8, scale: 0.72, lw: 1.0, objects: 0, stars: 50,  seed: 2674 },
  { speed: 0.27, blur: 0,   scale: 1.0,  lw: 1.3, objects: 1, stars: 22,  seed: 4001 },
];

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

  // Blur baked into pixels at draw time — cheaper than CSS filter during scroll.
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
      const radius = (50 + rand() * 45) * layer.scale;

      drawNebula(ctx, cx, cy, radius, layer.lw, rand, data.traits);
    }
  }

  if (layer.blur > 0) ctx.filter = "none";
}

export default function CelestialBackground({
  showObjects = true,
  forceBright = false,
}: {
  showObjects?: boolean;
  forceBright?: boolean;
}) {
  const refs = useRef<(HTMLCanvasElement | null)[]>([null, null, null, null]);

  useEffect(() => {
    const isMobile = window.matchMedia("(hover: none)").matches;
    const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);

    const VW = window.innerWidth;
    const VH = window.innerHeight;

    const allObjects: CelestialData[] = CELESTIAL_CATALOG.nebula.filter(n => n.id === "ngc3372");
    const shuffledCatalog = [...allObjects];

    if (isMobile) {
      [0, 1, 2].forEach(li => {
        const c = refs.current[li];
        if (c) { c.width = 0; c.height = 0; }
      });

      const canvas = refs.current[3];
      if (!canvas) return;

      setTimeout(() => {
        drawLayer(canvas, MOBILE_CFG, VW, VH, VH, 0, dpr, true, shuffledCatalog, allObjects);
      }, 0);

      return;
    }

    // ── Desktop ───────────────────────────────────────────────────────────
    const maxScroll = Math.max(VH, document.documentElement.scrollHeight - VH);

    const mc = refs.current[3];
    if (mc) { mc.width = 0; mc.height = 0; }

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

    const drawNext = (li: number) => {
      if (li >= LAYERS.length) return;
      setTimeout(() => {
        const canvas = refs.current[li];
        if (canvas) {
          const layer = LAYERS[li];
          const layerH = Math.round(VH + maxScroll * layer.speed + VH * 0.2);
          drawLayer(canvas, layer, VW, layerH, VH, maxScroll, dpr, true, shuffledCatalog, allObjects);
        }
        drawNext(li + 1);
      }, 0);
    };
    drawNext(0);

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: -1, opacity: forceBright ? 1 : 0.4 }}
    >
      {LAYERS.map((_, li) => (
        <canvas
          key={li}
          ref={(el) => { refs.current[li] = el; }}
          className="absolute"
          style={{
            willChange: "transform",
            transform: "translate3d(0,0,0)",
            ...(li === 2 ? { opacity: showObjects ? 1 : 0, transition: "opacity 0.4s ease" } : {}),
          }}
        />
      ))}

      <canvas
        ref={(el) => { refs.current[3] = el; }}
        className="absolute"
        style={{ opacity: showObjects ? 1 : 0, transition: "opacity 0.4s ease" }}
      />
    </div>
  );
}
