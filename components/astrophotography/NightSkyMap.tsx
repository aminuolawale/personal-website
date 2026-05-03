"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { DEG_TO_RAD, compute, midnightTonight, type Computed } from "@/lib/sky-engine";
import { draw, clampPan } from "@/lib/sky-draw";
import { useTheme } from "@/components/ThemeProvider";

const LOCATIONS = [
  { name: "North Pole",          label: "N. Pole", lat:  89.99, lon:   0    },
  { name: "Zurich, Switzerland", label: "Zurich",  lat:  47.37, lon:   8.54 },
  { name: "Lagos, Nigeria",      label: "Lagos",   lat:   6.52, lon:   3.38 },
  { name: "Kyiv, Ukraine",       label: "Kyiv",    lat:  50.45, lon:  30.52 },
  { name: "South Pole",          label: "S. Pole", lat: -89.99, lon:   0    },
] as const;

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 8;
const TRANSITION_DURATION = 1400;

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function easeInOut(t: number) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

export default function NightSkyMap() {
  const { theme } = useTheme();
  const themeRef = useRef<"dark" | "light">("dark");

  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const rafRef        = useRef<number>(0);
  const zoomRef       = useRef(1);
  const panRef        = useRef({ x: 0, y: 0 });
  const dragRef       = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);
  const pinchRef      = useRef<{ dist: number; zoom: number } | null>(null);
  const touchDragRef  = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);
  const hasDraggedRef = useRef(false);
  const transitionRef = useRef<{ fromLat: number; fromLon: number; toLat: number; toLon: number; startTick: number } | null>(null);
  const selectedConstellationRef = useRef<string | null>(null);
  const isFullscreenRef          = useRef(false);
  const panTransitionRef         = useRef<{ fromX: number; fromY: number; toX: number; toY: number; startTick: number } | null>(null);
  const date = useRef(midnightTonight());

  const [computed, setComputed]                               = useState<Computed | null>(null);
  const [isDragging, setIsDragging]                           = useState(false);
  const [zoomLevel, setZoomLevel]                             = useState(1);
  const [locationIdx, setLocationIdx]                         = useState(1);
  const [isFullscreen, setIsFullscreen]                       = useState(false);
  const [selectedConstellation, setSelectedConstellation]     = useState<string | null>(null);
  const [error, setError]                                     = useState("");

  useEffect(() => { themeRef.current = theme; }, [theme]);
  useEffect(() => { isFullscreenRef.current = isFullscreen; }, [isFullscreen]);

  const nightLabel = date.current.toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

  const applyZoom = useCallback((newZoom: number, anchorX = 0, anchorY = 0) => {
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    const worldX = (anchorX - panRef.current.x) / zoomRef.current;
    const worldY = (anchorY - panRef.current.y) / zoomRef.current;
    zoomRef.current = clamped;
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const cW = canvas ? canvas.width / dpr : 400;
    const cH = canvas ? canvas.height / dpr : 400;
    const R = (isFullscreenRef.current && cH > cW) ? cH / 2 : Math.min(cW, cH) / 2 - 24;
    panRef.current = clampPan(clamped, anchorX - worldX * clamped, anchorY - worldY * clamped, R);
    setZoomLevel(clamped);
  }, []);

  useEffect(() => {
    try { setComputed(compute(date.current, LOCATIONS[1].lat, LOCATIONS[1].lon)); }
    catch (e) { setError(String(e)); }
  }, []);

  const handleConstellationSelect = useCallback((name: string | null) => {
    const next = selectedConstellationRef.current === name ? null : name;
    selectedConstellationRef.current = next;
    setSelectedConstellation(next);

    if (!next || !computed) return;
    const con = computed.constellations.find((c) => c.name === next);
    if (!con?.visible || !con.centroid) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr, H = canvas.height / dpr;
    const isPortrait = H > W;
    const R = (isFullscreenRef.current && isPortrait) ? H / 2 : Math.min(W, H) / 2 - 24;
    if (R <= 0) return;

    if (zoomRef.current < 1.5) applyZoom(1.5);
    const effectiveZoom = zoomRef.current;

    const baseR = (1 - con.centroid.alt / 90) * R;
    const azimuthRad = con.centroid.az * DEG_TO_RAD;
    const targetPanX = -(baseR * Math.sin(azimuthRad)) * effectiveZoom;
    const targetPanY =  (baseR * Math.cos(azimuthRad)) * effectiveZoom;
    const clamped = clampPan(effectiveZoom, targetPanX, targetPanY, R);

    panTransitionRef.current = {
      fromX: panRef.current.x, fromY: panRef.current.y,
      toX: clamped.x, toY: clamped.y,
      startTick: 0,
    };
  }, [computed, applyZoom]);

  const handleLocationToggle = useCallback((newIdx: number) => {
    if (newIdx === locationIdx) return;
    transitionRef.current = {
      fromLat: LOCATIONS[locationIdx].lat, fromLon: LOCATIONS[locationIdx].lon,
      toLat:   LOCATIONS[newIdx].lat,      toLon:   LOCATIONS[newIdx].lon,
      startTick: 0,
    };
    setLocationIdx(newIdx);
  }, [locationIdx]);

  const animate = useCallback((tick: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !computed) return;

    if (canvas.width === 300 || canvas.height === 150) {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1) { rafRef.current = requestAnimationFrame(animate); return; }
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = Math.round(rect.width) * dpr;
      canvas.height = Math.round(rect.height || rect.width) * dpr;
    }

    let frameComp = computed;
    const tr = transitionRef.current;
    if (tr) {
      if (tr.startTick === 0) tr.startTick = tick;
      const t = Math.min(1, (tick - tr.startTick) / TRANSITION_DURATION);
      const ease = easeInOut(t);
      frameComp = compute(date.current, lerp(tr.fromLat, tr.toLat, ease), lerp(tr.fromLon, tr.toLon, ease));
      if (t >= 1) { transitionRef.current = null; setComputed(frameComp); }
    }

    const pt = panTransitionRef.current;
    if (pt) {
      if (pt.startTick === 0) pt.startTick = tick;
      const t = Math.min(1, (tick - pt.startTick) / 700);
      const ease = easeInOut(t);
      panRef.current = { x: lerp(pt.fromX, pt.toX, ease), y: lerp(pt.fromY, pt.toY, ease) };
      if (t >= 1) panTransitionRef.current = null;
    }

    draw(canvas, frameComp, tick, zoomRef.current, panRef.current.x, panRef.current.y,
      themeRef.current === "dark", selectedConstellationRef.current, isFullscreenRef.current);
    rafRef.current = requestAnimationFrame(animate);
  }, [computed, locationIdx]);

  useEffect(() => {
    if (!computed) return;
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [computed, animate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      const h = Math.round(entry.contentRect.height);
      if (w < 1 || h < 1) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = w * dpr;
      canvas.height = (h || w) * dpr;
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [isFullscreen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dpr = window.devicePixelRatio || 1;
      const cx = (canvas.width / dpr) / 2, cy = (canvas.height / dpr) / 2;
      const rect = canvas.getBoundingClientRect();
      applyZoom(zoomRef.current * (e.deltaY < 0 ? 1.15 : 1 / 1.15),
        e.clientX - rect.left - cx, e.clientY - rect.top - cy);
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [applyZoom, isFullscreen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        applyZoom(pinchRef.current.zoom * Math.sqrt(dx * dx + dy * dy) / pinchRef.current.dist);
      } else if (e.touches.length === 1 && touchDragRef.current) {
        e.preventDefault();
        const dx = e.touches[0].clientX - touchDragRef.current.startX;
        const dy = e.touches[0].clientY - touchDragRef.current.startY;
        const dpr = window.devicePixelRatio || 1;
        const cW = canvas.width / dpr, cH = canvas.height / dpr;
        const R = (isFullscreenRef.current && cH > cW) ? cH / 2 : Math.min(cW, cH) / 2 - 24;
        panRef.current = clampPan(
          zoomRef.current,
          touchDragRef.current.startPanX + dx,
          touchDragRef.current.startPanY + dy,
          R,
        );
      }
    };
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => canvas.removeEventListener("touchmove", onTouchMove);
  }, [applyZoom, isFullscreen]);

  useEffect(() => {
    document.body.style.overflow = isFullscreen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isFullscreen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsFullscreen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    hasDraggedRef.current = false;
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPanX: panRef.current.x, startPanY: panRef.current.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX, dy = e.clientY - dragRef.current.startY;
    if (Math.sqrt(dx * dx + dy * dy) > 4) hasDraggedRef.current = true;
    const canvas = canvasRef.current;
    const R = canvas ? Math.min(canvas.width, canvas.height) / (2 * (window.devicePixelRatio || 1)) - 24 : 200;
    panRef.current = clampPan(zoomRef.current, dragRef.current.startPanX + dx, dragRef.current.startPanY + dy, R);
  };

  const onPointerUp = () => { dragRef.current = null; setIsDragging(false); };

  const onCanvasClick = () => {
    if (!hasDraggedRef.current && !isFullscreen) setIsFullscreen(true);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      touchDragRef.current = null;
      const dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.sqrt(dx * dx + dy * dy), zoom: zoomRef.current };
    } else if (e.touches.length === 1) {
      touchDragRef.current = {
        startX: e.touches[0].clientX, startY: e.touches[0].clientY,
        startPanX: panRef.current.x,  startPanY: panRef.current.y,
      };
    }
  };

  const onTouchEnd = () => { pinchRef.current = null; touchDragRef.current = null; };
  const onDoubleClick = () => {
    zoomRef.current = 1; panRef.current = { x: 0, y: 0 }; setZoomLevel(1);
    selectedConstellationRef.current = null; setSelectedConstellation(null);
    panTransitionRef.current = null; touchDragRef.current = null;
  };

  if (error) return <p className="font-mono text-xs text-red-400 py-8">{error}</p>;

  const canvasEvents = {
    onClick: onCanvasClick,
    onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp,
    onTouchStart, onTouchEnd, onDoubleClick,
  };

  const locationToggle = (
    <div className="flex items-center gap-1 font-mono text-[10px] rounded border border-muted/20 overflow-hidden shrink-0">
      {LOCATIONS.map((loc, i) => (
        <button key={loc.name} onClick={() => handleLocationToggle(i)}
          className={`px-3 py-1.5 transition-colors ${locationIdx === i ? "bg-accent/10 text-accent" : "text-muted/40 hover:text-muted/70"}`}>
          {loc.label}
        </button>
      ))}
    </div>
  );

  const zoomControls = (
    <div className="flex items-center gap-3 font-mono select-none shrink-0">
      <button onClick={() => applyZoom(zoomRef.current / 1.4)} aria-label="Zoom out"
        className="w-7 h-7 flex items-center justify-center rounded border border-muted/20 text-muted/50 hover:text-muted/80 hover:border-muted/40 transition-colors text-base leading-none">−</button>
      <div className="flex gap-1.5">
        {(isFullscreen ? [0.5, 1, 2, 4] : [1, 2, 4, 8]).map((lvl) => (
          <button key={lvl} onClick={() => applyZoom(lvl)}
            className={`px-2 py-0.5 rounded text-[10px] tracking-wider transition-colors border ${Math.abs(zoomLevel - lvl) < 0.15 ? "border-accent text-accent" : "border-muted/20 text-muted/40 hover:border-muted/40 hover:text-muted/70"}`}>
            {lvl}×
          </button>
        ))}
      </div>
      <button onClick={() => applyZoom(zoomRef.current * 1.4)} aria-label="Zoom in"
        className="w-7 h-7 flex items-center justify-center rounded border border-muted/20 text-muted/50 hover:text-muted/80 hover:border-muted/40 transition-colors text-base leading-none">+</button>
      <span className="text-[9px] text-muted/25 uppercase tracking-widest ml-1">{zoomLevel.toFixed(1)}×</span>
    </div>
  );

  const legend = (
    <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center font-mono text-[10px] text-muted/40 uppercase tracking-widest shrink-0">
      {([
        [theme === "dark" ? "bg-white/80" : "bg-[rgba(10,10,60,0.7)]", "Stars"],
        ["w-4 h-px bg-[rgba(130,160,255,0.5)] rounded-none", "Constellations"],
        [theme === "dark" ? "bg-[rgba(252,158,79,0.9)]" : "bg-[rgba(184,58,8,0.8)]", "Planets"],
        [theme === "dark" ? "bg-[rgba(230,225,200,0.8)]" : "bg-[rgba(50,55,70,0.7)]", "Moon"],
        [theme === "dark" ? "bg-[rgba(180,200,255,0.6)]" : "bg-[rgba(10,40,140,0.5)]", "Deep sky"],
      ] as [string, string][]).map(([cls, label]) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className={`inline-block w-2 h-2 rounded-full ${cls}`} /> {label}
        </span>
      ))}
    </div>
  );

  // ── Fullscreen overlay ─────────────────────────────────────────────────
  if (isFullscreen) {
    const constellationList = computed?.constellations ?? [];
    const visibleCount = constellationList.filter((c) => c.visible).length;
    const bgClass = theme === "dark" ? "bg-[#020122]" : "bg-white";
    const topGradient = theme === "dark"
      ? "linear-gradient(to bottom, rgba(2,1,34,0.88) 0%, transparent 100%)"
      : "linear-gradient(to bottom, rgba(255,255,255,0.88) 0%, transparent 100%)";
    const bottomGradient = theme === "dark"
      ? "linear-gradient(to top, rgba(2,1,34,0.95) 0%, transparent 100%)"
      : "linear-gradient(to top, rgba(255,255,255,0.95) 0%, transparent 100%)";

    const closeButton = (
      <button onClick={() => setIsFullscreen(false)}
        className="w-8 h-8 flex items-center justify-center rounded-full border border-muted/20 text-muted/50 hover:text-muted/80 hover:border-muted/40 transition-colors font-mono text-sm shrink-0">
        ✕
      </button>
    );

    const constellationStrip = (
      <div className="flex flex-row overflow-x-auto gap-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {selectedConstellation && (
          <button onClick={() => handleConstellationSelect(null)}
            className="shrink-0 font-mono text-[10px] px-2.5 py-1 border border-accent/40 text-accent/60 hover:text-accent transition-colors">
            All
          </button>
        )}
        {constellationList.map((con) => {
          const isActive = selectedConstellation === con.name;
          return (
            <button key={con.name}
              onClick={() => con.visible ? handleConstellationSelect(con.name) : undefined}
              disabled={!con.visible}
              className={`shrink-0 font-mono text-[10px] px-2.5 py-1 border transition-colors ${
                !con.visible
                  ? "text-muted/15 border-muted/10 cursor-default"
                  : isActive
                    ? "text-accent border-accent bg-accent/10"
                    : "text-muted/45 border-muted/20 hover:text-muted/75 hover:border-muted/40"
              }`}>
              {con.name}
            </button>
          );
        })}
      </div>
    );

    return (
      <div className={`fixed inset-0 z-50 overflow-hidden flex flex-col ${bgClass}`}>

        {/* Desktop header */}
        <div className="hidden sm:flex w-full items-center justify-between shrink-0 px-4 pt-3 pb-2">
          <span className="font-mono text-[10px] text-muted/35 tracking-widest uppercase">
            {nightLabel} &nbsp;·&nbsp; midnight
          </span>
          {closeButton}
        </div>

        {/* Middle: canvas area + desktop sidebar */}
        <div className="flex-1 min-h-0 relative sm:flex sm:flex-row sm:gap-3 sm:px-4 sm:pb-2 sm:overflow-hidden">

          {/* Canvas wrapper:
              Mobile  — absolute inset-0, canvas fills the full screen
              Desktop — flex-1 static container, canvas is a centred square */}
          <div className="absolute inset-0 sm:relative sm:flex-1 sm:min-h-0 sm:min-w-0 sm:flex sm:items-center sm:justify-center">
            <canvas
              ref={canvasRef}
              className="block w-full h-full sm:w-auto sm:h-full sm:rounded-full"
              style={{
                aspectRatio: "1",
                maxHeight: "100%",
                maxWidth: "100%",
                cursor: isDragging ? "grabbing" : "grab",
              }}
              {...canvasEvents}
            />
            {!computed && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="font-mono text-xs text-muted/30">Computing sky…</p>
              </div>
            )}
          </div>

          {/* Constellation sidebar — desktop only */}
          <div className="hidden sm:flex flex-col w-44 shrink-0 overflow-hidden border-l border-surface/[0.06]">
            <div className="flex items-center justify-between px-3 py-2 shrink-0 border-b border-surface/[0.06]">
              <span className="font-mono text-[9px] text-muted/30 uppercase tracking-widest">Constellations</span>
              <span className="font-mono text-[9px] text-muted/25">{visibleCount}/{constellationList.length}</span>
            </div>
            <div className="overflow-y-auto flex-1">
              {constellationList.map((con) => {
                const isActive = selectedConstellation === con.name;
                return (
                  <button key={con.name}
                    onClick={() => con.visible ? handleConstellationSelect(con.name) : undefined}
                    disabled={!con.visible}
                    className={`w-full text-left px-3 py-1.5 font-mono text-[11px] transition-colors flex items-center gap-1.5 ${
                      !con.visible
                        ? "text-muted/18 cursor-default"
                        : isActive
                          ? "text-accent bg-accent/8"
                          : "text-muted/50 hover:text-muted/80 hover:bg-surface/[0.04]"
                    }`}>
                    {isActive && <span className="text-accent text-[8px]">●</span>}
                    {!isActive && con.visible && <span className="w-[10px]" />}
                    {!isActive && !con.visible && <span className="text-muted/15 text-[8px]">○</span>}
                    {con.name}
                  </button>
                );
              })}
            </div>
            {selectedConstellation && (
              <button onClick={() => handleConstellationSelect(null)}
                className="shrink-0 px-3 py-2 font-mono text-[10px] text-muted/30 hover:text-muted/60 transition-colors border-t border-surface/[0.06] text-left">
                Show all
              </button>
            )}
          </div>

          {/* Mobile control overlays — layered on top of the full-bleed canvas */}
          <div className="sm:hidden absolute inset-0 pointer-events-none">
            {/* Top: date + close */}
            <div className="absolute top-0 inset-x-0 flex items-start justify-between px-4 pt-3 pb-14 pointer-events-auto"
              style={{ background: topGradient }}>
              <span className="font-mono text-[10px] text-muted/35 tracking-widest uppercase pt-0.5">{nightLabel}</span>
              {closeButton}
            </div>
            {/* Bottom: constellation strip + location + zoom + hint */}
            <div className="absolute bottom-0 inset-x-0 flex flex-col gap-2.5 px-4 pt-12 pb-5 pointer-events-auto"
              style={{ background: bottomGradient }}>
              {constellationStrip}
              <div className="flex flex-col items-center gap-2">
                {locationToggle}
                {zoomControls}
              </div>
              <p className="font-mono text-[9px] text-muted/20 uppercase tracking-widest select-none text-center">
                pinch&nbsp;·&nbsp;drag&nbsp;·&nbsp;double-tap to reset
              </p>
            </div>
          </div>
        </div>

        {/* Desktop controls */}
        <div className="hidden sm:flex flex-col shrink-0 px-4 pb-4 pt-1 gap-2 items-center">
          <div className="flex flex-row items-center justify-center gap-3">
            {locationToggle}
            {zoomControls}
          </div>
          <p className="font-mono text-[9px] text-muted/20 uppercase tracking-widest select-none text-center">
            scroll&nbsp;·&nbsp;pinch&nbsp;·&nbsp;drag to pan&nbsp;·&nbsp;double-click to reset&nbsp;·&nbsp;esc to close
          </p>
          {legend}
        </div>
      </div>
    );
  }

  // ── Normal (inline) mode ───────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="font-mono text-[10px] text-muted/35 tracking-widest uppercase">
        {nightLabel} &nbsp;·&nbsp; midnight
      </div>

      <div className="w-full max-w-2xl mx-auto relative group">
        <canvas
          ref={canvasRef}
          className="block w-full rounded-full"
          style={{ aspectRatio: "1", cursor: isDragging ? "grabbing" : "grab" }}
          {...canvasEvents}
        />
        <div className="absolute inset-0 flex items-center justify-center rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full ${theme === "dark" ? "text-white/30 bg-[#020122]/60" : "text-black/30 bg-white/70"}`}>
            click to expand
          </span>
        </div>
        {!computed && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-mono text-xs text-muted/30">Computing sky…</p>
          </div>
        )}
      </div>

      {locationToggle}
      {zoomControls}
      <p className="font-mono text-[9px] text-muted/20 uppercase tracking-widest select-none -mt-2">
        scroll · pinch &nbsp;·&nbsp; drag to pan &nbsp;·&nbsp; double-click to reset
      </p>
      {legend}
    </div>
  );
}
