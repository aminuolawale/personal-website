"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { lst, raDecToAltAz, planetPosition, moonPosition, moonPhase } from "@/lib/sky-math";
import { NAMED_STARS, BG_STARS, CONSTELLATIONS, DSO_OBJECTS, PLANET_STYLES } from "@/lib/sky-data";

const LOCATIONS = [
  { name: "Zurich, Switzerland", lat: 47.37, lon: 8.54 },
  { name: "Lagos, Nigeria",      lat: 6.52,  lon: 3.38 },
] as const;

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const DEG = Math.PI / 180;

function midnightTonight(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function starRadius(mag: number): number {
  return Math.max(0.4, 3.2 - mag * 0.65);
}

function starColor(sp: string, alpha: number): string {
  const map: Record<string, string> = {
    O: `rgba(155,180,255,${alpha})`,
    B: `rgba(190,210,255,${alpha})`,
    A: `rgba(255,255,255,${alpha})`,
    F: `rgba(255,255,220,${alpha})`,
    G: `rgba(255,240,160,${alpha})`,
    K: `rgba(255,200,110,${alpha})`,
    M: `rgba(255,150, 90,${alpha})`,
  };
  return map[sp] ?? `rgba(255,255,255,${alpha})`;
}

const PLANET_NAMES = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"] as const;

interface SkyPos { alt: number; az: number }

interface Computed {
  stars:   (SkyPos & { r: number; color: string; name?: string; mag: number })[];
  constellationSegs: [SkyPos, SkyPos][];
  dso:     (SkyPos & { name: string; type: string; mag: number })[];
  planets: (SkyPos & { name: string; color: string; radius: number })[];
  moon:    (SkyPos & { phase: number }) | null;
  date:    Date;
}

// Compute sky positions (alt/az) — independent of canvas size.
function compute(date: Date, lat: number, lon: number): Computed {
  const lstDeg = lst(date, lon);

  function skyPos(ra: number, dec: number): SkyPos | null {
    const { alt, az } = raDecToAltAz(ra, dec, lat, lstDeg);
    if (alt < 0) return null;
    return { alt, az };
  }

  const stars = NAMED_STARS.flatMap((s) => {
    const p = skyPos(s.ra, s.dec);
    if (!p) return [];
    return [{ ...p, r: starRadius(s.mag), color: starColor(s.sp, 1), name: s.name, mag: s.mag }];
  });

  for (const [ra, dec, mag] of BG_STARS) {
    const p = skyPos(ra, dec);
    if (!p) continue;
    stars.push({ ...p, r: starRadius(mag), color: starColor("A", 0.8), mag });
  }

  const constellationSegs: [SkyPos, SkyPos][] = [];
  for (const con of CONSTELLATIONS) {
    for (const poly of con.lines) {
      for (let i = 0; i < poly.length - 1; i++) {
        const a = skyPos(poly[i][0], poly[i][1]);
        const b = skyPos(poly[i + 1][0], poly[i + 1][1]);
        if (a && b) constellationSegs.push([a, b]);
      }
    }
  }

  const dso = DSO_OBJECTS.flatMap((o) => {
    const p = skyPos(o.ra, o.dec);
    if (!p) return [];
    return [{ ...p, name: o.name, type: o.type, mag: o.mag }];
  });

  const planets = PLANET_NAMES.flatMap((name) => {
    try {
      const { ra, dec } = planetPosition(name, date);
      const p = skyPos(ra, dec);
      if (!p) return [];
      const style = PLANET_STYLES[name];
      return [{ ...p, name, color: style.color, radius: style.radius }];
    } catch { return []; }
  });

  const { ra: mRa, dec: mDec } = moonPosition(date);
  const mp = skyPos(mRa, mDec);
  const moon = mp ? { ...mp, phase: moonPhase(date) } : null;

  return { stars, constellationSegs, dso, planets, moon, date };
}

function draw(
  canvas: HTMLCanvasElement,
  comp: Computed,
  tick: number,
  zoom: number,
  panX: number,
  panY: number,
  cityName: string,
) {
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.width / dpr;
  const H = canvas.height / dpr;
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(W, H) / 2 - 24;

  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(dpr, dpr);

  // Project alt/az → canvas pixel using current zoom & pan.
  function sc(alt: number, az: number): [number, number] {
    const baseR = (1 - alt / 90) * R;
    const a = az * DEG;
    return [
      cx + baseR * Math.sin(a) * zoom + panX,
      cy - baseR * Math.cos(a) * zoom + panY,
    ];
  }

  // ── Clip everything sky-content to the disc ───────────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();

  // Sky background — gradient follows pan
  const bg = ctx.createRadialGradient(cx + panX, cy + panY, 0, cx + panX, cy + panY, R * zoom);
  bg.addColorStop(0,   "#0d1240");
  bg.addColorStop(0.5, "#060c2a");
  bg.addColorStop(1,   "#020122");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Altitude rings — density grows with zoom
  const step = altRingStep(zoom);
  for (let alt = step; alt < 90; alt += step) {
    const r = (1 - alt / 90) * R * zoom;
    const isMajor = alt % 30 === 0;
    ctx.beginPath();
    ctx.arc(cx + panX, cy + panY, r, 0, Math.PI * 2);
    ctx.strokeStyle = isMajor ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.04)";
    ctx.lineWidth = isMajor ? 0.7 : 0.4;
    ctx.stroke();
    // Label on east side — only major rings, or every 2nd minor ring at fine steps
    const showLabel = isMajor || (step <= 10 && alt % (step * 2) === 0);
    if (!showLabel) continue;
    const [lx, ly] = sc(alt, 90);
    if (lx > cx - R && lx < cx + R && ly > cy - R && ly < cy + R) {
      ctx.fillStyle = isMajor ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.13)";
      ctx.font = `9px Space Mono, monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`${alt}°`, lx + 3, ly);
    }
  }

  // Constellation lines
  ctx.strokeStyle = "rgba(130,160,255,0.22)";
  ctx.lineWidth = 0.8;
  for (const [a, b] of comp.constellationSegs) {
    const [x1, y1] = sc(a.alt, a.az);
    const [x2, y2] = sc(b.alt, b.az);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Deep-sky objects
  for (const o of comp.dso) {
    const [ox, oy] = sc(o.alt, o.az);
    const rDso = (o.type === "galaxy" ? 9 : o.type === "cluster" ? 7 : 6) * Math.min(zoom, 2);
    const alpha = Math.max(0.1, 0.55 - o.mag * 0.06);
    const glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, rDso);
    glow.addColorStop(0, o.type === "nebula" ? `rgba(180,100,200,${alpha * 1.5})` : `rgba(180,200,255,${alpha * 1.8})`);
    glow.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(ox, oy, rDso, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
    ctx.fillStyle = "rgba(180,200,255,0.5)";
    ctx.font = `8px Space Mono, monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(o.name, ox + rDso + 3, oy);
  }

  // Stars
  for (const s of comp.stars) {
    const [sx, sy] = sc(s.alt, s.az);
    const twinkle = s.name
      ? 0.85 + 0.15 * Math.sin(tick * 0.0018 + sx * 7.3)
      : 0.75 + 0.25 * Math.random();
    const sr = s.r * Math.min(1 + (zoom - 1) * 0.3, 2);

    if (sr > 1.2) {
      const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 3.5);
      halo.addColorStop(0, s.color.replace(/[\d.]+\)$/, `${0.35 * twinkle})`));
      halo.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(sx, sy, sr * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(sx, sy, sr * twinkle, 0, Math.PI * 2);
    ctx.fillStyle = s.color;
    ctx.fill();
  }

  // Star labels — reveal more at higher zoom
  const magThreshold = zoom >= 4 ? 4.5 : zoom >= 3 ? 3.5 : zoom >= 2 ? 2.5 : 1.4;
  ctx.textBaseline = "middle";
  for (const s of comp.stars) {
    if (!s.name || s.mag > magThreshold) continue;
    const [sx, sy] = sc(s.alt, s.az);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = `9px Space Mono, monospace`;
    ctx.textAlign = "left";
    ctx.fillText(s.name, sx + s.r + 4, sy - 4);
  }

  // Moon
  if (comp.moon) {
    const [mx, my] = sc(comp.moon.alt, comp.moon.az);
    const { phase } = comp.moon;
    const mr = 10 * Math.min(1 + (zoom - 1) * 0.4, 2);
    const moonGlow = ctx.createRadialGradient(mx, my, 0, mx, my, mr * 3);
    moonGlow.addColorStop(0, "rgba(230,230,200,0.25)");
    moonGlow.addColorStop(1, "transparent");
    ctx.beginPath(); ctx.arc(mx, my, mr * 3, 0, Math.PI * 2);
    ctx.fillStyle = moonGlow; ctx.fill();

    ctx.save();
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.clip();
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(230,225,200,0.9)"; ctx.fill();
    const phaseRad = (phase * Math.PI) / 180;
    ctx.fillStyle = "rgba(4,4,20,0.88)";
    ctx.beginPath();
    ctx.arc(mx, my, mr, Math.PI / 2, -Math.PI / 2);
    const k = Math.cos(phaseRad);
    ctx.bezierCurveTo(mx + k * mr, my - mr, mx + k * mr, my + mr, mx, my + mr);
    ctx.fill();
    ctx.restore();

    ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(230,225,200,0.4)"; ctx.lineWidth = 0.5; ctx.stroke();
    ctx.fillStyle = "rgba(230,225,200,0.7)";
    ctx.font = `bold 9px Space Mono, monospace`;
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText("Moon", mx + mr + 4, my);
  }

  // Planets
  for (const p of comp.planets) {
    const [px, py] = sc(p.alt, p.az);
    const pr = p.radius * Math.min(1 + (zoom - 1) * 0.4, 2);
    const pg = ctx.createRadialGradient(px, py, 0, px, py, pr * 3.5);
    pg.addColorStop(0, p.color.replace(")", ",0.4)").replace("rgb", "rgba"));
    pg.addColorStop(1, "transparent");
    ctx.beginPath(); ctx.arc(px, py, pr * 3.5, 0, Math.PI * 2);
    ctx.fillStyle = pg; ctx.fill();
    ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fillStyle = p.color; ctx.fill();
    ctx.fillStyle = p.color;
    ctx.font = `bold 9px Space Mono, monospace`;
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(p.name, px + pr + 5, py);
  }

  ctx.restore(); // end disc clip

  // ── Fixed UI (no zoom): horizon ring, cardinal labels, stamps ─────────

  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(252,158,79,0.2)";
  ctx.lineWidth = 1;
  ctx.stroke();

  const cardinals: [string, number][] = [["N", 0], ["E", 90], ["S", 180], ["W", 270]];
  ctx.font = `bold 11px Space Mono, monospace`;
  for (const [label, az] of cardinals) {
    const a = az * DEG;
    const lx = cx + (R + 14) * Math.sin(a);
    const ly = cy - (R + 14) * Math.cos(a);
    ctx.fillStyle = "rgba(252,158,79,0.55)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, lx, ly);
  }

  if (zoom > 1.05) {
    ctx.fillStyle = "rgba(252,158,79,0.4)";
    ctx.font = `8px Space Mono, monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`${zoom.toFixed(1)}×`, cx - R + 6, cy - R + 8);
  }

  ctx.fillStyle = "rgba(252,158,79,0.35)";
  ctx.font = `8px Space Mono, monospace`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  const dateLabel = comp.date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    + ` · midnight · ${cityName}`;
  ctx.fillText(dateLabel, cx + R - 4, cy + R - 4);

  ctx.restore();
}

function clampPan(zoom: number, panX: number, panY: number, R: number) {
  const maxPan = R * (zoom - 1);
  return {
    x: Math.max(-maxPan, Math.min(maxPan, panX)),
    y: Math.max(-maxPan, Math.min(maxPan, panY)),
  };
}

// Returns the altitude ring step (°) for a given zoom level.
function altRingStep(zoom: number): number {
  if (zoom >= 5) return 5;
  if (zoom >= 3) return 10;
  if (zoom >= 2) return 15;
  return 30;
}

export default function NightSkyMap() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const rafRef      = useRef<number>(0);
  const zoomRef     = useRef(1);
  const panRef      = useRef({ x: 0, y: 0 });
  const dragRef     = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);
  const pinchRef    = useRef<{ dist: number; zoom: number } | null>(null);

  const [computed, setComputed] = useState<Computed | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [locationIdx, setLocationIdx] = useState(0);
  const [error, setError] = useState("");

  // Update ref + state together so buttons and canvas stay in sync.
  const applyZoom = useCallback((newZoom: number, anchorX = 0, anchorY = 0) => {
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    const worldX = (anchorX - panRef.current.x) / zoomRef.current;
    const worldY = (anchorY - panRef.current.y) / zoomRef.current;
    const newPanX = anchorX - worldX * clamped;
    const newPanY = anchorY - worldY * clamped;
    zoomRef.current = clamped;
    const { R } = canvasMetrics();
    panRef.current = clamped <= 1 ? { x: 0, y: 0 } : clampPan(clamped, newPanX, newPanY, R);
    setZoomLevel(clamped);
  }, []);

  function canvasMetrics() {
    const canvas = canvasRef.current;
    if (!canvas) return { W: 0, H: 0, cx: 0, cy: 0, R: 0 };
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) / 2 - 24;
    return { W, H, cx, cy, R };
  }

  // Recompute sky positions when location changes; reset zoom/pan
  useEffect(() => {
    const { lat, lon } = LOCATIONS[locationIdx];
    try {
      setComputed(compute(midnightTonight(), lat, lon));
    } catch (e) {
      setError(String(e));
    }
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    setZoomLevel(1);
  }, [locationIdx]);

  // Animation loop — reads zoom/pan from refs each frame
  const animate = useCallback((tick: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !computed) return;
    const cityName = LOCATIONS[locationIdx].name.split(",")[0];
    draw(canvas, computed, tick, zoomRef.current, panRef.current.x, panRef.current.y, cityName);
    rafRef.current = requestAnimationFrame(animate);
  }, [computed, locationIdx]);

  useEffect(() => {
    if (!computed) return;
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [computed, animate]);

  // Resize observer — update canvas dimensions only (positions don't depend on canvas size)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(([entry]) => {
      const size = entry.contentRect.width;
      if (size < 1) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width  = `${size}px`;
      canvas.style.height = `${size}px`;
    });
    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
  }, []);

  // Wheel zoom — needs passive:false to call preventDefault
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { cx, cy } = canvasMetrics();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left - cx;
      const my = e.clientY - rect.top - cy;
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      applyZoom(zoomRef.current * factor, mx, my);
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [applyZoom]);

  // Touch pinch-to-zoom — needs passive:false on touchmove
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        applyZoom(pinchRef.current.zoom * dist / pinchRef.current.dist);
      }
    };
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => canvas.removeEventListener("touchmove", onTouchMove);
  }, [applyZoom]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    dragRef.current = {
      startX: e.clientX, startY: e.clientY,
      startPanX: panRef.current.x, startPanY: panRef.current.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const { R } = canvasMetrics();
    const newPanX = dragRef.current.startPanX + (e.clientX - dragRef.current.startX);
    const newPanY = dragRef.current.startPanY + (e.clientY - dragRef.current.startY);
    panRef.current = clampPan(zoomRef.current, newPanX, newPanY, R);
  };

  const onPointerUp = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.sqrt(dx * dx + dy * dy), zoom: zoomRef.current };
    }
  };

  const onTouchEnd = () => { pinchRef.current = null; };

  const onDoubleClick = () => {
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    setZoomLevel(1);
  };

  if (error) return <p className="font-mono text-xs text-red-400 py-8">{error}</p>;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full max-w-2xl mx-auto relative">
        <canvas
          ref={canvasRef}
          className="block w-full rounded-full"
          style={{ aspectRatio: "1", cursor: isDragging ? "grabbing" : "grab" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onDoubleClick={onDoubleClick}
        />
        {!computed && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-mono text-xs text-muted/30">Computing sky…</p>
          </div>
        )}
      </div>

      {/* Location toggle */}
      <div className="flex items-center gap-1 font-mono text-[10px] rounded border border-muted/20 overflow-hidden">
        {LOCATIONS.map((loc, i) => (
          <button
            key={loc.name}
            onClick={() => setLocationIdx(i)}
            className={`px-3 py-1.5 transition-colors ${
              locationIdx === i
                ? "bg-accent/10 text-accent"
                : "text-muted/40 hover:text-muted/70"
            }`}
          >
            {loc.name}
          </button>
        ))}
      </div>

      {/* Zoom controls */}
      <div className="flex items-center gap-3 font-mono select-none">
        <button
          onClick={() => applyZoom(zoomRef.current / 1.4)}
          className="w-7 h-7 flex items-center justify-center rounded border border-muted/20 text-muted/50 hover:text-muted/80 hover:border-muted/40 transition-colors text-base leading-none"
          aria-label="Zoom out"
        >−</button>

        <div className="flex gap-1.5">
          {[1, 2, 4, 8].map((lvl) => (
            <button
              key={lvl}
              onClick={() => applyZoom(lvl)}
              className={`px-2 py-0.5 rounded text-[10px] tracking-wider transition-colors border ${
                Math.abs(zoomLevel - lvl) < 0.15
                  ? "border-accent text-accent"
                  : "border-muted/20 text-muted/40 hover:border-muted/40 hover:text-muted/70"
              }`}
            >
              {lvl}×
            </button>
          ))}
        </div>

        <button
          onClick={() => applyZoom(zoomRef.current * 1.4)}
          className="w-7 h-7 flex items-center justify-center rounded border border-muted/20 text-muted/50 hover:text-muted/80 hover:border-muted/40 transition-colors text-base leading-none"
          aria-label="Zoom in"
        >+</button>

        <span className="text-[9px] text-muted/25 uppercase tracking-widest ml-1">
          {zoomLevel.toFixed(1)}×
        </span>
      </div>

      <p className="font-mono text-[9px] text-muted/20 uppercase tracking-widest select-none -mt-2">
        scroll · pinch &nbsp;·&nbsp; drag to pan &nbsp;·&nbsp; double-click to reset
      </p>

      <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center font-mono text-[10px] text-muted/40 uppercase tracking-widest">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-white/80" /> Stars
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-px bg-[rgba(130,160,255,0.5)]" /> Constellations
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[rgba(252,158,79,0.9)]" /> Planets
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-[rgba(230,225,200,0.8)]" /> Moon
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-[rgba(180,200,255,0.6)]" /> Deep sky
        </span>
      </div>
    </div>
  );
}
