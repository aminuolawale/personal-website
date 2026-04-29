"use client";

import { useEffect, useRef } from "react";

import { CelestialData, CELESTIAL_CATALOG } from "./celestial/catalog";
import { createSeededRandom } from "./celestial/utils";
import { drawNebula } from "./celestial/nebula";
import { drawStarField } from "./celestial/starfield";
import { useTheme } from "@/components/ThemeProvider";

interface ParallaxLayerConfig {
  speed: number;
  blur: number;
  scale: number;
  lineWidth: number;
  objects: number;
  stars: number;
  seed: number;
}

const LAYERS: ParallaxLayerConfig[] = [
  { speed: 0.05, blur: 4.5, scale: 0.5,  lineWidth: 0.7, objects: 0, stars: 100, seed: 1337 },
  { speed: 0.15, blur: 1.8, scale: 0.72, lineWidth: 1.0, objects: 0, stars: 50,  seed: 2674 },
  { speed: 0.27, blur: 0,   scale: 1.0,  lineWidth: 1.3, objects: 1, stars: 22,  seed: 4001 },
];

const MOBILE_LAYER_CONFIG: ParallaxLayerConfig = {
  speed: 0, blur: 0, scale: 0.75, lineWidth: 1.0, objects: 1, stars: 100, seed: 7777,
};

function drawLayer(
  canvas: HTMLCanvasElement,
  layer: ParallaxLayerConfig,
  viewportWidth: number,
  layerCanvasHeight: number,
  viewportHeight: number,
  maxScroll: number,
  devicePixelRatio: number,
  showObjects: boolean,
  shuffledCatalog: CelestialData[],
  allObjects: CelestialData[],
  isDark: boolean,
) {
  canvas.width  = Math.round(viewportWidth    * devicePixelRatio);
  canvas.height = Math.round(layerCanvasHeight * devicePixelRatio);
  canvas.style.width  = `${viewportWidth}px`;
  canvas.style.height = `${layerCanvasHeight}px`;
  canvas.style.top    = "0px";
  canvas.style.left   = "0";

  const ctx = canvas.getContext("2d")!;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  ctx.clearRect(0, 0, viewportWidth, layerCanvasHeight);

  const rand = createSeededRandom(layer.seed);

  // Blur baked into pixels at draw time — cheaper than CSS filter during scroll.
  if (layer.blur > 0) ctx.filter = `blur(${layer.blur}px)`;

  drawStarField(ctx, viewportWidth, layerCanvasHeight, layer.stars, rand, isDark);

  if (showObjects) {
    const minObjectCenterY = viewportHeight * 0.2;
    const maxObjectCenterY = viewportHeight * 0.9 + maxScroll * layer.speed;
    const objectBinHeight  = (maxObjectCenterY - minObjectCenterY) / Math.max(layer.objects, 1);

    for (let i = 0; i < layer.objects; i++) {
      const objectCenterY = minObjectCenterY + i * objectBinHeight + (rand() * 0.6 + 0.2) * objectBinHeight;
      const objectCenterX = (i % 2 === 0)
        ? viewportWidth / 2 + rand() * (viewportWidth / 2 - 100)
        : 50                + rand() * (viewportWidth / 2 - 100);

      const celestialObject = shuffledCatalog.pop() || allObjects[0];
      const radius = (50 + rand() * 45) * layer.scale;

      drawNebula(ctx, objectCenterX, objectCenterY, radius, layer.lineWidth, rand, celestialObject.traits, isDark);
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
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const refs = useRef<(HTMLCanvasElement | null)[]>([null, null, null, null]);

  useEffect(() => {
    const isMobile = window.matchMedia("(hover: none)").matches;
    const devicePixelRatio = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);

    const viewportWidth  = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const allObjects: CelestialData[] = CELESTIAL_CATALOG.nebula.filter(n => n.id === "ngc3372");
    const shuffledCatalog = [...allObjects];

    if (isMobile) {
      [0, 1, 2].forEach(layerIndex => {
        const canvas = refs.current[layerIndex];
        if (canvas) { canvas.width = 0; canvas.height = 0; }
      });

      const mobileCanvas = refs.current[3];
      if (!mobileCanvas) return;

      setTimeout(() => {
        drawLayer(mobileCanvas, MOBILE_LAYER_CONFIG, viewportWidth, viewportHeight, viewportHeight, 0, devicePixelRatio, true, shuffledCatalog, allObjects, isDark);
      }, 0);

      return;
    }

    // ── Desktop ───────────────────────────────────────────────────────────
    const maxScroll = Math.max(viewportHeight, document.documentElement.scrollHeight - viewportHeight);

    const mobileCanvas = refs.current[3];
    if (mobileCanvas) { mobileCanvas.width = 0; mobileCanvas.height = 0; }

    let scrollAnimFrameId = 0;
    const onScroll = () => {
      cancelAnimationFrame(scrollAnimFrameId);
      scrollAnimFrameId = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        LAYERS.forEach((layer, layerIndex) => {
          const el = refs.current[layerIndex];
          if (el) el.style.transform = `translate3d(0,${-(scrollY * layer.speed).toFixed(2)}px,0)`;
        });
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const drawNextLayer = (layerIndex: number) => {
      if (layerIndex >= LAYERS.length) return;
      setTimeout(() => {
        const canvas = refs.current[layerIndex];
        if (canvas) {
          const layer = LAYERS[layerIndex];
          const layerCanvasHeight = Math.round(viewportHeight + maxScroll * layer.speed + viewportHeight * 0.2);
          drawLayer(canvas, layer, viewportWidth, layerCanvasHeight, viewportHeight, maxScroll, devicePixelRatio, true, shuffledCatalog, allObjects, isDark);
        }
        drawNextLayer(layerIndex + 1);
      }, 0);
    };
    drawNextLayer(0);

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(scrollAnimFrameId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]);

  const opacity = forceBright ? 1 : (isDark ? 0.4 : 0.65);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: -1, opacity }}
    >
      {LAYERS.map((_, layerIndex) => (
        <canvas
          key={layerIndex}
          ref={(el) => { refs.current[layerIndex] = el; }}
          className="absolute"
          style={{
            willChange: "transform",
            transform: "translate3d(0,0,0)",
            ...(layerIndex === 2 ? { opacity: showObjects ? 1 : 0, transition: "opacity 0.4s ease" } : {}),
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
