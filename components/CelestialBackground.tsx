"use client";

import { useEffect, useRef, useState } from "react";

import { CelestialData, CELESTIAL_CATALOG } from "./celestial/catalog";
import { P, mulberry32 } from "./celestial/utils";
import { drawGalaxy } from "./celestial/galaxy";
import { drawPlanet } from "./celestial/planet";
import { drawNebula } from "./celestial/nebula";
import { drawComet } from "./celestial/comet";
import { drawBlackHole } from "./celestial/blackhole";
import { drawStarField } from "./celestial/starfield";
import { drawRocket, drawStarship } from "./celestial/spaceships";

// ── Layer config ──────────────────────────────────────────────────────────
interface LayerCfg {
  speed: number;
  blur: number;
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
  { speed: 0.05, blur: 4.5, scale: 0.5,  lw: 0.7, objects: 9,  stars: 220, seed: 1337 },
  { speed: 0.15, blur: 1.8, scale: 0.72, lw: 1.0, objects: 6,  stars: 70,  seed: 2674 },
  { speed: 0.27, blur: 0,   scale: 1.0,  lw: 1.3, objects: 5,  stars: 22,  seed: 4001 },
];

// ── Component ─────────────────────────────────────────────────────────────
export default function CelestialBackground() {
  const refs = useRef<(HTMLCanvasElement | null)[]>([null, null, null]);
  const hitboxesRef = useRef<Hitbox[]>([]);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [hoveredData, setHoveredData] = useState<CelestialData | null>(null);

  useEffect(() => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    hitboxesRef.current = [];
    const VW = window.innerWidth;
    const VH = window.innerHeight;
    
    // We extend the canvas height to ensure it covers the maximum visible parallax shift.
    const maxScroll = Math.max(VH, document.documentElement.scrollHeight - VH);
    const maxSpeed = Math.max(...LAYERS.map(l => l.speed));
    const H = Math.round(VH + maxScroll * maxSpeed + VH * 0.5); 
    
    // Shuffle catalog deterministically for uniqueness
    const globalRand = mulberry32(101010);
    const allObjects: CelestialData[] = [];
    Object.values(CELESTIAL_CATALOG).forEach(list => allObjects.push(...list));
    const shuffledCatalog = [...allObjects].sort(() => globalRand() - 0.5);

    LAYERS.forEach((layer, li) => {
      const canvas = refs.current[li];
      if (!canvas) return;

      canvas.width = Math.round(VW * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = VW + "px";
      canvas.style.height = H + "px";
      canvas.style.top = "0px";
      canvas.style.left = "0";

      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);

      const rand = mulberry32(layer.seed);

      drawStarField(ctx, VW, H, layer.stars, rand);

      // The visible canvas height for a given layer is from 0 to VH + maxScroll * layer.speed
      // To ensure objects are distributed everywhere (top to bottom) but keep the very top of the hero clear,
      // we distribute cy from VH * 0.2 to VH * 0.9 + maxScroll * layer.speed
      const min_cy = VH * 0.2;
      const max_cy = VH * 0.9 + maxScroll * layer.speed;
      const cy_range = max_cy - min_cy;
      const binSize = cy_range / layer.objects;

      for (let i = 0; i < layer.objects; i++) {
        // Place object in its vertical bin
        const cy = min_cy + i * binSize + (rand() * 0.6 + 0.2) * binSize;
        
        // Horizontal distribution: alternate left and right halves of the screen
        const isRight = i % 2 === 0;
        const cx = isRight
          ? (VW / 2) + rand() * (VW / 2 - 100)
          : 50 + rand() * (VW / 2 - 100); 
        
        const data = shuffledCatalog.pop() || allObjects[0];
        const s = layer.scale;

        let radius = 0;

        switch (data.category) {
          case "galaxy":
            radius = (50 + rand() * 45) * s;
            drawGalaxy(ctx, cx, cy, radius, layer.lw, data.traits, rand);
            break;
          case "nebula":
            radius = (50 + rand() * 45) * s;
            drawNebula(ctx, cx, cy, radius, layer.lw, rand, data.traits);
            break;
          case "planet":
            radius = (22 + rand() * 22) * s;
            drawPlanet(ctx, cx, cy, radius, layer.lw, data.traits);
            break;
          case "comet":
            radius = (55 + rand() * 45) * s;
            drawComet(ctx, cx, cy, rand() * Math.PI * 2, radius, layer.lw, data.traits);
            radius = radius * 0.4; 
            break;
          case "blackhole":
            radius = (18 + rand() * 20) * s;
            drawBlackHole(ctx, cx, cy, radius, layer.lw, data.traits);
            break;
        }

        hitboxesRef.current.push({
          x: cx,
          y: cy,
          r: radius * 1.5,
          layerSpeed: layer.speed,
          data
        });
      }

      if (layer.blur === 0) {
        const rocketCy = VH * 0.85 + maxScroll * layer.speed;
        drawRocket(ctx, VW * 0.75, rocketCy, layer.scale * 1.5, layer.lw);
      }

      if (layer.blur === 1.8) {
        const shipCy = VH * 0.98 + maxScroll * layer.speed;
        drawStarship(ctx, VW * 0.25, shipCy, layer.scale * 2.0, layer.lw);
      }
    });

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

    let currentHover: CelestialData | null = null;
    const onMouseMove = (e: ReactMouseEvent | globalThis.MouseEvent) => {
      const sy = window.scrollY;
      const offsetTop = 0; // we set top to 0px
      const mx = (e as any).clientX;
      const my = (e as any).clientY;

      let found: CelestialData | null = null;
      for (const box of hitboxesRef.current) {
        const screenX = box.x;
        const screenY = box.y + offsetTop - (sy * box.layerSpeed);
        
        const dx = mx - screenX;
        const dy = my - screenY;
        if (Math.sqrt(dx * dx + dy * dy) < box.r) {
          found = box.data;
          break;
        }
      }

      if (found !== currentHover) {
        currentHover = found;
        setHoveredData(found);
      }

      if (tooltipRef.current) {
        tooltipRef.current.style.transform = `translate(${mx + 15}px, ${my + 15}px)`;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden transition-opacity duration-700 ease-in-out"
        style={{ 
          zIndex: -1,
          opacity: hoveredData ? 1 : 0.4
        }}
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

      {hoveredData && (
        <div
          ref={tooltipRef}
          className="fixed top-0 left-0 z-50 p-4 rounded-xl backdrop-blur-md border transition-opacity duration-200"
          style={{
            backgroundColor: "rgba(2, 1, 34, 0.8)",
            borderColor: P.orange,
            color: P.cream,
            width: "300px",
            boxShadow: `0 0 20px ${P.oa(0.3)}`,
            willChange: "transform",
            pointerEvents: "none",
            zIndex: 100
          }}
        >
          <img 
            src={hoveredData.imageUrl} 
            alt={hoveredData.name} 
            className="w-full h-32 object-cover rounded-lg mb-3 border border-gray-700" 
          />
          <h3 className="text-lg font-bold mb-1" style={{ color: P.gold }}>{hoveredData.name}</h3>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: P.orange }}>{hoveredData.type}</p>
          <p className="text-sm leading-relaxed">{hoveredData.summary}</p>
        </div>
      )}
    </>
  );
}
