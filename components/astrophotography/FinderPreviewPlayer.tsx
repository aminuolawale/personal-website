"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Minimize2, Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { DEG_TO_RAD, compute, midnightTonight, type Computed, type SkyPos } from "@/lib/sky-engine";
import { clampPan, draw } from "@/lib/sky-draw";
import { getSkyTargetById, resolveComputedTargetPosition } from "@/lib/sky-targets";
import type { FinderPreviewStep } from "@/lib/finder-previews";

interface FinderPreview {
  id: number;
  name: string;
  description: string;
  targetId: string;
  stepDelaySeconds: number;
  loop: boolean;
  steps: FinderPreviewStep[];
}

interface FinderPreviewPlayerProps {
  preview?: FinderPreview;
  previewId?: number;
  compact?: boolean;
}

const LOCATIONS = [
  { name: "North Pole", label: "N. Pole", lat: 89.99, lon: 0 },
  { name: "Zurich, Switzerland", label: "Zurich", lat: 47.37, lon: 8.54 },
  { name: "Lagos, Nigeria", label: "Lagos", lat: 6.52, lon: 3.38 },
  { name: "Kyiv, Ukraine", label: "Kyiv", lat: 50.45, lon: 30.52 },
  { name: "South Pole", label: "S. Pole", lat: -89.99, lon: 0 },
] as const;

const MIN_ZOOM = 0.65;
const MAX_ZOOM = 8;
const TARGET_ZOOM = 2.2;
const FRAME_ANIMATION_MS = 800;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function getSkyRadius(width: number, height: number, fullBleed: boolean) {
  return fullBleed && height > width ? height / 2 : Math.min(width, height) / 2 - 24;
}

function targetPan(pos: SkyPos, width: number, height: number, skyRadius: number, zoom: number) {
  const radialDistance = (1 - pos.alt / 90) * skyRadius;
  const azimuthRad = pos.az * DEG_TO_RAD;
  return clampPan(
    zoom,
    -(radialDistance * Math.sin(azimuthRad)) * zoom,
    (radialDistance * Math.cos(azimuthRad)) * zoom,
    skyRadius
  );
}

export default function FinderPreviewPlayer({ preview: initialPreview, previewId, compact = false }: FinderPreviewPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(MIN_ZOOM);
  const frameTransitionRef = useRef<{
    fromX: number;
    fromY: number;
    fromZoom: number;
    toX: number;
    toY: number;
    toZoom: number;
    startTick: number;
  } | null>(null);
  const [preview, setPreview] = useState<FinderPreview | null>(initialPreview ?? null);
  const [locationIdx, setLocationIdx] = useState(1);
  const [computed, setComputed] = useState<Computed>(() => compute(midnightTonight(), LOCATIONS[1].lat, LOCATIONS[1].lon));
  const [zoomLevel, setZoomLevel] = useState(MIN_ZOOM);
  const [activeStep, setActiveStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(initialPreview?.loop ?? false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (initialPreview || !previewId) return;
    let cancelled = false;
    fetch(`/api/finder-previews/${previewId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setPreview(data);
          setLoop(Boolean(data.loop));
        }
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [initialPreview, previewId]);

  const steps = useMemo(() => preview?.steps ?? [], [preview?.steps]);
  const currentStep = steps[activeStep] ?? null;
  const currentTarget = currentStep ? getSkyTargetById(currentStep.targetId) : null;
  const highlightedConstellations = useMemo(() => {
    return currentTarget?.type === "constellation" ? [currentTarget.name] : [];
  }, [currentTarget]);

  useEffect(() => {
    document.body.style.overflow = isFullscreen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isFullscreen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const frameStep = useCallback((index: number, requestedZoom?: number, immediate = false) => {
    if (!computed || !steps[index]) return;
    const pos = resolveComputedTargetPosition(computed, steps[index].targetId);
    const canvas = canvasRef.current;
    if (!pos || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    const skyRadius = getSkyRadius(width, height, isFullscreen);
    const stepZoom = steps[index].zoomLevel ?? TARGET_ZOOM;
    const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, requestedZoom ?? stepZoom));
    setZoomLevel(zoom);
    const nextPan = targetPan(pos, width, height, skyRadius, zoom);

    if (immediate) {
      zoomRef.current = zoom;
      panRef.current = nextPan;
      frameTransitionRef.current = null;
      return;
    }

    frameTransitionRef.current = {
      fromX: panRef.current.x,
      fromY: panRef.current.y,
      fromZoom: zoomRef.current,
      toX: nextPan.x,
      toY: nextPan.y,
      toZoom: zoom,
      startTick: 0,
    };
  }, [computed, isFullscreen, steps]);

  function applyZoom(nextZoom: number) {
    const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
    setZoomLevel(zoom);
    frameStep(activeStep, zoom);
  }

  function changeLocation(index: number) {
    setLocationIdx(index);
    setComputed(compute(midnightTonight(), LOCATIONS[index].lat, LOCATIONS[index].lon));
  }

  const goToStep = useCallback((index: number) => {
    const next = Math.max(0, Math.min(index, steps.length - 1));
    setActiveStep(next);
    frameStep(next);
  }, [frameStep, steps.length]);

  useEffect(() => {
    frameStep(activeStep);
  }, [activeStep, frameStep]);

  useEffect(() => {
    const timer = window.setTimeout(() => frameStep(activeStep), 0);
    return () => window.clearTimeout(timer);
  }, [computed, activeStep, frameStep]);

  useEffect(() => {
    if (!playing || steps.length === 0) return;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);

    timerRef.current = window.setTimeout(() => {
      setActiveStep((step) => {
        const next = step + 1;
        if (next < steps.length) return next;
        if (loop) return 0;
        setPlaying(false);
        return step;
      });
    }, Math.max(1, preview?.stepDelaySeconds ?? 4) * 1000);

    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [activeStep, loop, playing, preview?.stepDelaySeconds, steps.length]);

  useEffect(() => {
    function animate(tick: number) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0) {
        const dpr = window.devicePixelRatio || 1;
        const width = Math.round(rect.width);
        const height = Math.round(rect.height || rect.width * 0.62);
        if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          frameStep(activeStep, undefined, true);
        }
      }

      const transition = frameTransitionRef.current;
      if (transition) {
        if (transition.startTick === 0) transition.startTick = tick;
        const t = Math.min(1, (tick - transition.startTick) / FRAME_ANIMATION_MS);
        const eased = easeInOut(t);
        zoomRef.current = lerp(transition.fromZoom, transition.toZoom, eased);
        panRef.current = {
          x: lerp(transition.fromX, transition.toX, eased),
          y: lerp(transition.fromY, transition.toY, eased),
        };
        if (t >= 1) {
          zoomRef.current = transition.toZoom;
          panRef.current = { x: transition.toX, y: transition.toY };
          frameTransitionRef.current = null;
        }
      }

      draw(
        canvas,
        computed,
        tick,
        zoomRef.current,
        panRef.current.x,
        panRef.current.y,
        true,
        null,
        isFullscreen,
        highlightedConstellations
      );
      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [activeStep, computed, frameStep, highlightedConstellations, isFullscreen]);

  if (!preview) {
    return (
      <div className="border border-surface/10 bg-surface/[0.02] p-5 font-mono text-xs text-muted/35">
        Loading finder preview...
      </div>
    );
  }

  const shellClass = isFullscreen
    ? "fixed inset-0 z-[90] m-0 border-0 bg-base"
    : compact ? "my-4" : "my-8";
  const layoutClass = isFullscreen
    ? "relative h-[100dvh] w-full overflow-hidden bg-base"
    : "grid lg:grid-cols-[minmax(0,1fr)_18rem]";
  const mapClass = isFullscreen
    ? "absolute inset-0 bg-base"
    : "relative min-h-[18rem] bg-base";
  const canvasClass = isFullscreen
    ? "block h-full w-full"
    : "block h-[18rem] w-full sm:h-[24rem]";
  const locationClass = isFullscreen
    ? "absolute left-3 right-[4.75rem] top-[calc(3rem+env(safe-area-inset-top))] z-20 flex flex-wrap gap-1 overflow-hidden sm:left-4 sm:right-auto sm:max-w-[calc(100%-8rem)]"
    : "absolute left-3 bottom-3 z-20 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1";
  const zoomClass = isFullscreen
    ? "absolute right-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-20 flex items-center gap-1 rounded-sm border border-white/10 bg-black/45 p-1 backdrop-blur sm:right-4"
    : "absolute right-3 bottom-3 z-20 flex items-center gap-1 rounded-sm border border-white/10 bg-black/40 p-1 backdrop-blur";
  const panelClass = isFullscreen
    ? "absolute inset-x-0 bottom-0 z-30 max-h-[48dvh] overflow-y-auto border-t border-white/10 bg-base/[0.90] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-12 shadow-2xl backdrop-blur-md sm:left-auto sm:right-4 sm:bottom-4 sm:w-[min(24rem,calc(100vw-2rem))] sm:max-h-[calc(100dvh-8rem)] sm:border sm:p-4"
    : "border-t border-surface/10 p-4 sm:p-5 lg:border-t-0 lg:border-l";
  const topOverlayStyle = isFullscreen
    ? { background: "linear-gradient(to bottom, rgba(15,23,42,0.82), rgba(15,23,42,0))" }
    : undefined;
  const bottomOverlayStyle = isFullscreen
    ? { background: "linear-gradient(to top, rgba(15,23,42,0.84), rgba(15,23,42,0))" }
    : undefined;

  return (
    <section className={`not-prose overflow-hidden border border-surface/10 bg-base ${shellClass}`}>
      <div className={layoutClass}>
        {isFullscreen && (
          <>
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28" style={topOverlayStyle} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-56" style={bottomOverlayStyle} />
          </>
        )}
        <div className={mapClass}>
          <canvas
            ref={canvasRef}
            className={canvasClass}
            onDoubleClick={() => goToStep(activeStep)}
          />
          <div className="absolute left-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-20 flex items-center gap-2 sm:left-4">
            <div className="rounded-sm border border-white/10 bg-black/45 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-white/65">
              Finder mode
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreen((value) => !value)}
              className="rounded-sm border border-white/10 bg-black/45 p-1.5 text-white/65 hover:text-accent"
              aria-label={isFullscreen ? "Exit fullscreen finder preview" : "Open fullscreen finder preview"}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
          <div className={locationClass}>
            {LOCATIONS.map((location, index) => (
              <button
                key={location.name}
                type="button"
                onClick={() => changeLocation(index)}
                className={`rounded-sm border px-2 py-1 font-mono text-[10px] backdrop-blur ${
                  locationIdx === index
                    ? "border-accent text-accent bg-black/55"
                    : "border-white/10 text-white/55 bg-black/35 hover:text-white"
                }`}
              >
                {location.label}
              </button>
            ))}
          </div>
          <div className={zoomClass}>
            <button
              type="button"
              onClick={() => applyZoom(zoomRef.current / 1.35)}
              className="h-7 w-7 font-mono text-sm text-white/65 hover:text-accent"
              aria-label="Zoom out"
            >
              -
            </button>
            <span className="w-10 text-center font-mono text-[10px] text-white/50">
              {zoomLevel.toFixed(1)}x
            </span>
            <button
              type="button"
              onClick={() => applyZoom(zoomRef.current * 1.35)}
              className="h-7 w-7 font-mono text-sm text-white/65 hover:text-accent"
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
        </div>

        <div className={`flex flex-col gap-3 sm:gap-4 ${panelClass}`}>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent/70">
              {activeStep + 1}/{Math.max(steps.length, 1)}
            </p>
            <h3 className="mt-1 text-surface font-semibold text-lg leading-tight">{preview.name}</h3>
            {preview.description && <p className="mt-2 text-sm text-muted/55 leading-relaxed">{preview.description}</p>}
          </div>

          <div className="border border-surface/10 bg-surface/[0.02] p-3 min-h-28">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted/35">
              {currentTarget?.name ?? "Step target"} · {(currentStep?.zoomLevel ?? TARGET_ZOOM).toFixed(1)}x
            </p>
            <p className="mt-2 text-sm text-muted/70 leading-relaxed">
              {currentStep?.description || "No description for this step."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => goToStep(activeStep - 1)}
              disabled={activeStep === 0}
              className="p-2 border border-surface/15 text-muted/55 hover:text-accent hover:border-accent/40 disabled:opacity-30"
              aria-label="Previous finder step"
            >
              <SkipBack size={15} />
            </button>
            <button
              type="button"
              onClick={() => setPlaying((value) => !value)}
              className="inline-flex items-center gap-2 px-3 py-2 border border-accent/50 text-accent font-mono text-xs hover:bg-accent/10"
            >
              {playing ? <Pause size={15} /> : <Play size={15} />}
              {playing ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              onClick={() => goToStep(activeStep + 1)}
              disabled={activeStep >= steps.length - 1}
              className="p-2 border border-surface/15 text-muted/55 hover:text-accent hover:border-accent/40 disabled:opacity-30"
              aria-label="Next finder step"
            >
              <SkipForward size={15} />
            </button>
            <button
              type="button"
              onClick={() => goToStep(0)}
              className="p-2 border border-surface/15 text-muted/55 hover:text-accent hover:border-accent/40"
              aria-label="Restart finder preview"
            >
              <RotateCcw size={15} />
            </button>
            <label className="ml-auto inline-flex items-center gap-2 font-mono text-xs text-muted/45">
              <input
                type="checkbox"
                checked={loop}
                onChange={(event) => setLoop(event.target.checked)}
                className="accent-accent"
              />
              Loop
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
