"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { lst, raDecToAltAz, planetPosition, moonPosition, moonPhase } from "@/lib/sky-math";
import { NAMED_STARS, BG_STARS, CONSTELLATIONS, DSO_OBJECTS, PLANET_STYLES } from "@/lib/sky-data";
import { useTheme } from "@/components/ThemeProvider";

const LOCATIONS = [
  { name: "North Pole",          label: "N. Pole", lat:  89.99, lon:  0    },
  { name: "Zurich, Switzerland", label: "Zurich",  lat:  47.37, lon:  8.54 },
  { name: "Lagos, Nigeria",      label: "Lagos",   lat:   6.52, lon:  3.38 },
  { name: "South Pole",          label: "S. Pole", lat: -89.99, lon:  0    },
] as const;

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const DEG = Math.PI / 180;
const TRANSITION_DURATION = 1400;

// Deterministic urban horizon: altitude (°) blocked by buildings at each azimuth degree.
// Simulates a moderate city density (6–22° blockage) — the range where buildings
// realistically occlude stars from a rooftop or open courtyard.
const SKYLINE_ALTS: number[] = (() => {
  let s = 0xc0ffee;
  const rng = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0x100000000; };
  const alts = new Array(360).fill(0) as number[];
  let az = Math.floor(rng() * 6);
  while (az < 360) {
    const w    = 2 + Math.floor(rng() * 11);    // building width: 2–12°
    const h    = 6  + rng() * 16;               // building height: 6–22°
    const step = rng() > 0.5 ? Math.floor(w * (0.35 + rng() * 0.3)) : w;
    const h2   = step < w   ? h * (0.4 + rng() * 0.35) : 0;
    for (let i = 0; i < w && az + i < 360; i++) alts[az + i] = i < step ? h : h2;
    az += w + 1 + Math.floor(rng() * 4);        // gap: 1–4°
  }
  return alts;
})();

function midnightTonight(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function easeInOut(t: number) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

function starRadius(mag: number) { return Math.max(0.4, 3.2 - mag * 0.65); }

function starColorDark(sp: string, alpha: number): string {
  const map: Record<string, string> = {
    O: `rgba(155,180,255,${alpha})`, B: `rgba(190,210,255,${alpha})`,
    A: `rgba(255,255,255,${alpha})`, F: `rgba(255,255,220,${alpha})`,
    G: `rgba(255,240,160,${alpha})`, K: `rgba(255,200,110,${alpha})`,
    M: `rgba(255,150, 90,${alpha})`,
  };
  return map[sp] ?? `rgba(255,255,255,${alpha})`;
}

function starColorLight(sp: string, alpha: number): string {
  const map: Record<string, string> = {
    O: `rgba(10,30,130,${alpha})`,  B: `rgba(20,50,150,${alpha})`,
    A: `rgba(10,10,60,${alpha})`,   F: `rgba(60,45,0,${alpha})`,
    G: `rgba(80,55,0,${alpha})`,    K: `rgba(100,30,0,${alpha})`,
    M: `rgba(110,10,0,${alpha})`,
  };
  return map[sp] ?? `rgba(10,10,60,${alpha})`;
}

const LIGHT_PLANET_COLORS: Record<string, string> = {
  Mercury: "#5a5a6a", Venus: "#8a6a00", Mars: "#cc3311",
  Jupiter: "#9a7030", Saturn: "#8a6820", Uranus: "#006070", Neptune: "#2030b0",
};

const PLANET_NAMES = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"] as const;

interface SkyPos { alt: number; az: number }

interface ConstellationInfo {
  name: string;
  visible: boolean;            // at least one segment has both endpoints above horizon
  segs: [SkyPos, SkyPos][];
  centroid: SkyPos | null;     // circular-mean centre of visible endpoints
}

interface Computed {
  stars:          (SkyPos & { r: number; sp: string; name?: string; mag: number })[];
  constellations: ConstellationInfo[];
  dso:            (SkyPos & { name: string; type: string; mag: number })[];
  planets:        (SkyPos & { name: string; radius: number })[];
  moon:           (SkyPos & { phase: number }) | null;
  date:           Date;
}

function circularMeanAz(azimuths: number[]): number {
  const sinSum = azimuths.reduce((s, a) => s + Math.sin(a * DEG), 0);
  const cosSum = azimuths.reduce((s, a) => s + Math.cos(a * DEG), 0);
  return ((Math.atan2(sinSum, cosSum) / DEG) + 360) % 360;
}

function compute(date: Date, lat: number, lon: number): Computed {
  const lstDeg = lst(date, lon);
  function skyPos(ra: number, dec: number): SkyPos | null {
    const { alt, az } = raDecToAltAz(ra, dec, lat, lstDeg);
    return alt < 0 ? null : { alt, az };
  }

  const stars: Computed["stars"] = NAMED_STARS.flatMap((s) => {
    const p = skyPos(s.ra, s.dec);
    return p ? [{ ...p, r: starRadius(s.mag), sp: s.sp, name: s.name, mag: s.mag }] : [];
  });
  for (const [ra, dec, mag] of BG_STARS) {
    const p = skyPos(ra, dec);
    if (p) stars.push({ ...p, r: starRadius(mag), sp: "A", mag });
  }

  const constellations: ConstellationInfo[] = CONSTELLATIONS.map((con) => {
    const segs: [SkyPos, SkyPos][] = [];
    const pts: SkyPos[] = [];
    for (const poly of con.lines) {
      for (let i = 0; i < poly.length - 1; i++) {
        const a = skyPos(poly[i][0], poly[i][1]);
        const b = skyPos(poly[i + 1][0], poly[i + 1][1]);
        if (a && b) { segs.push([a, b]); pts.push(a, b); }
      }
    }
    const centroid: SkyPos | null = pts.length
      ? { alt: pts.reduce((s, p) => s + p.alt, 0) / pts.length, az: circularMeanAz(pts.map((p) => p.az)) }
      : null;
    return { name: con.name, visible: segs.length > 0, segs, centroid };
  });

  const dso = DSO_OBJECTS.flatMap((o) => {
    const p = skyPos(o.ra, o.dec);
    return p ? [{ ...p, name: o.name, type: o.type, mag: o.mag }] : [];
  });

  const planets = PLANET_NAMES.flatMap((name) => {
    try {
      const { ra, dec } = planetPosition(name, date);
      const p = skyPos(ra, dec);
      if (!p) return [];
      return [{ ...p, name, radius: PLANET_STYLES[name].radius }];
    } catch { return []; }
  });

  const { ra: mRa, dec: mDec } = moonPosition(date);
  const mp = skyPos(mRa, mDec);
  return { stars, constellations, dso, planets, moon: mp ? { ...mp, phase: moonPhase(date) } : null, date };
}

function drawSkyObjects(
  ctx: CanvasRenderingContext2D,
  comp: Computed, tick: number,
  zoom: number, panX: number, panY: number,
  cx: number, cy: number, R: number,
  darkMode: boolean,
  selectedConstellation: string | null,
) {
  function sc(alt: number, az: number): [number, number] {
    const baseR = (1 - alt / 90) * R;
    const a = az * DEG;
    return [cx + baseR * Math.sin(a) * zoom + panX, cy - baseR * Math.cos(a) * zoom + panY];
  }

  // Constellation lines — only draw the selected one when one is active
  for (const con of comp.constellations) {
    const isSelected = selectedConstellation === con.name;
    if (selectedConstellation !== null && !isSelected) continue;
    ctx.strokeStyle = isSelected
      ? (darkMode ? "rgba(130,160,255,0.65)" : "rgba(40,60,180,0.5)")
      : (darkMode ? "rgba(130,160,255,0.22)" : "rgba(40,60,180,0.15)");
    ctx.lineWidth = isSelected ? 1.2 : 0.8;
    for (const [a, b] of con.segs) {
      const [x1, y1] = sc(a.alt, a.az), [x2, y2] = sc(b.alt, b.az);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    // Draw constellation name label near centroid when selected
    if (isSelected && con.centroid) {
      const [lx, ly] = sc(con.centroid.alt, con.centroid.az);
      ctx.fillStyle = darkMode ? "rgba(160,185,255,0.85)" : "rgba(40,60,180,0.75)";
      ctx.font = `bold 10px Space Mono, monospace`;
      ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.fillText(con.name, lx, ly - 6);
    }
  }

  // DSO
  for (const o of comp.dso) {
    const [ox, oy] = sc(o.alt, o.az);
    const rDso = (o.type === "galaxy" ? 9 : o.type === "cluster" ? 7 : 6) * Math.min(zoom, 2);
    const al = Math.max(0.1, 0.55 - o.mag * 0.06);
    const glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, rDso);
    if (darkMode) {
      glow.addColorStop(0, o.type === "nebula" ? `rgba(180,100,200,${al * 1.5})` : `rgba(180,200,255,${al * 1.8})`);
    } else {
      glow.addColorStop(0, o.type === "nebula" ? `rgba(120,0,160,${al * 1.2})` : `rgba(10,40,140,${al * 1.5})`);
    }
    glow.addColorStop(1, "transparent");
    ctx.beginPath(); ctx.arc(ox, oy, rDso, 0, Math.PI * 2);
    ctx.fillStyle = glow; ctx.fill();
    ctx.fillStyle = darkMode ? "rgba(180,200,255,0.5)" : "rgba(10,40,140,0.5)";
    ctx.font = `8px Space Mono, monospace`; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(o.name, ox + rDso + 3, oy);
  }

  // Stars
  for (const s of comp.stars) {
    const [sx, sy] = sc(s.alt, s.az);
    const color = darkMode ? starColorDark(s.sp, 1) : starColorLight(s.sp, 1);
    const bgAlpha = darkMode ? 0.8 : 0.7;
    const bgColor = darkMode ? starColorDark(s.sp, bgAlpha) : starColorLight(s.sp, bgAlpha);
    const twinkle = s.name ? 0.85 + 0.15 * Math.sin(tick * 0.0018 + sx * 7.3) : 0.75 + 0.25 * Math.random();
    const sr = s.r * Math.min(1 + (zoom - 1) * 0.3, 2);
    if (sr > 1.2) {
      const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 3.5);
      halo.addColorStop(0, bgColor.replace(/[\d.]+\)$/, `${0.35 * twinkle})`));
      halo.addColorStop(1, "transparent");
      ctx.beginPath(); ctx.arc(sx, sy, sr * 3.5, 0, Math.PI * 2); ctx.fillStyle = halo; ctx.fill();
    }
    ctx.beginPath(); ctx.arc(sx, sy, sr * twinkle, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
  }

  // Star name labels
  const magThreshold = zoom >= 4 ? 4.5 : zoom >= 3 ? 3.5 : zoom >= 2 ? 2.5 : 1.4;
  ctx.textBaseline = "middle";
  for (const s of comp.stars) {
    if (!s.name || s.name === "Polaris" || s.mag > magThreshold) continue;
    const [sx, sy] = sc(s.alt, s.az);
    ctx.fillStyle = darkMode ? "rgba(255,255,255,0.55)" : "rgba(10,10,60,0.55)";
    ctx.font = `9px Space Mono, monospace`;
    ctx.textAlign = "left"; ctx.fillText(s.name, sx + s.r + 4, sy - 4);
  }

  // Moon
  if (comp.moon) {
    const [mx, my] = sc(comp.moon.alt, comp.moon.az);
    const { phase } = comp.moon;
    const mr = 10 * Math.min(1 + (zoom - 1) * 0.4, 2);
    const moonGlow = ctx.createRadialGradient(mx, my, 0, mx, my, mr * 3);
    if (darkMode) {
      moonGlow.addColorStop(0, "rgba(230,230,200,0.25)"); moonGlow.addColorStop(1, "transparent");
      ctx.beginPath(); ctx.arc(mx, my, mr * 3, 0, Math.PI * 2); ctx.fillStyle = moonGlow; ctx.fill();
      ctx.save();
      ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.clip();
      ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fillStyle = "rgba(230,225,200,0.9)"; ctx.fill();
      const k = Math.cos((phase * Math.PI) / 180);
      ctx.fillStyle = "rgba(4,4,20,0.88)";
      ctx.beginPath(); ctx.arc(mx, my, mr, Math.PI / 2, -Math.PI / 2);
      ctx.bezierCurveTo(mx + k * mr, my - mr, mx + k * mr, my + mr, mx, my + mr); ctx.fill();
      ctx.restore();
      ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(230,225,200,0.4)"; ctx.lineWidth = 0.5; ctx.stroke();
      ctx.fillStyle = "rgba(230,225,200,0.7)";
    } else {
      moonGlow.addColorStop(0, "rgba(50,55,70,0.12)"); moonGlow.addColorStop(1, "transparent");
      ctx.beginPath(); ctx.arc(mx, my, mr * 3, 0, Math.PI * 2); ctx.fillStyle = moonGlow; ctx.fill();
      ctx.save();
      ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.clip();
      ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fillStyle = "rgba(50,55,70,0.85)"; ctx.fill();
      const k = Math.cos((phase * Math.PI) / 180);
      ctx.fillStyle = "rgba(225,228,240,0.92)";
      ctx.beginPath(); ctx.arc(mx, my, mr, Math.PI / 2, -Math.PI / 2);
      ctx.bezierCurveTo(mx + k * mr, my - mr, mx + k * mr, my + mr, mx, my + mr); ctx.fill();
      ctx.restore();
      ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(50,55,70,0.35)"; ctx.lineWidth = 0.5; ctx.stroke();
      ctx.fillStyle = "rgba(50,55,70,0.7)";
    }
    ctx.font = `bold 9px Space Mono, monospace`;
    ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText("Moon", mx + mr + 4, my);
  }

  // Planets
  for (const p of comp.planets) {
    const [px, py] = sc(p.alt, p.az);
    const pr = p.radius * Math.min(1 + (zoom - 1) * 0.4, 2);
    const pColor = darkMode ? PLANET_STYLES[p.name].color : (LIGHT_PLANET_COLORS[p.name] ?? "#333");
    const pg = ctx.createRadialGradient(px, py, 0, px, py, pr * 3.5);
    pg.addColorStop(0, pColor + "66"); pg.addColorStop(1, "transparent");
    ctx.beginPath(); ctx.arc(px, py, pr * 3.5, 0, Math.PI * 2); ctx.fillStyle = pg; ctx.fill();
    ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fillStyle = pColor; ctx.fill();
    ctx.fillStyle = pColor; ctx.font = `bold 9px Space Mono, monospace`;
    ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(p.name, px + pr + 5, py);
  }
}

function altRingStep(zoom: number) {
  if (zoom >= 5) return 5; if (zoom >= 3) return 10; if (zoom >= 2) return 15; return 30;
}

function clampPan(zoom: number, panX: number, panY: number, R: number) {
  const m = R * (zoom - 1);
  return { x: Math.max(-m, Math.min(m, panX)), y: Math.max(-m, Math.min(m, panY)) };
}

function drawBuildings(
  ctx: CanvasRenderingContext2D,
  alpha: number,
  zoom: number, panX: number, panY: number,
  cx: number, cy: number, R: number,
  darkMode: boolean,
) {
  if (alpha < 0.004) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  // Warm amber-brown in dark mode contrasts with the cool blue-black sky;
  // dark charcoal in light mode stands out against the white background.
  ctx.fillStyle = darkMode ? "rgba(45,28,6,0.93)" : "#28283c";

  // Trace inner boundary (building tops, az 0→360) then outer boundary (horizon, 360→0)
  // to form a filled ring that covers stars behind the urban horizon.
  ctx.beginPath();
  for (let az = 0; az <= 360; az++) {
    const r = (1 - SKYLINE_ALTS[az % 360] / 90) * R * zoom;
    const x = cx + r * Math.sin(az * DEG) + panX;
    const y = cy - r * Math.cos(az * DEG) + panY;
    az === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  for (let az = 360; az >= 0; az--) {
    const r = R * zoom;
    ctx.lineTo(cx + r * Math.sin(az * DEG) + panX, cy - r * Math.cos(az * DEG) + panY);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPolarisMarker(
  ctx: CanvasRenderingContext2D,
  comp: Computed,
  zoom: number, panX: number, panY: number,
  cx: number, cy: number, R: number,
  darkMode: boolean,
) {
  const polaris = comp.stars.find((s) => s.name === "Polaris");
  if (!polaris) return;

  const r = (1 - polaris.alt / 90) * R;
  const a = polaris.az * DEG;
  const px = cx + r * Math.sin(a) * zoom + panX;
  const py = cy - r * Math.cos(a) * zoom + panY;
  const sr = polaris.r * Math.min(1 + (zoom - 1) * 0.3, 2);

  ctx.save();
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.arc(px, py, sr * 5, 0, Math.PI * 2);
  ctx.strokeStyle = darkMode ? "rgba(180,210,255,0.5)" : "rgba(10,40,140,0.45)";
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = darkMode ? "rgba(200,220,255,0.85)" : "rgba(10,40,140,0.75)";
  ctx.font = `bold 9px Space Mono, monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("Polaris", px + sr * 5 + 4, py);
  ctx.restore();
}

function draw(
  canvas: HTMLCanvasElement, comp: Computed, tick: number,
  zoom: number, panX: number, panY: number,
  darkMode: boolean, buildingAlpha: number,
  selectedConstellation: string | null,
  fullBleed = false,
) {
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.width / dpr, H = canvas.height / dpr;
  const cx = W / 2, cy = H / 2;
  // In portrait full-bleed mode, expand R to fill the screen height so the
  // sky covers the whole screen rather than being contained in a circle.
  const isPortrait = H > W;
  const R = (fullBleed && isPortrait) ? H / 2 : Math.min(W, H) / 2 - 24;
  if (R <= 0) return;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save(); ctx.scale(dpr, dpr);

  // In fullBleed portrait mode skip the clip so the sky fills the canvas rectangle.
  if (!fullBleed) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
  }

  // Sky background
  const bg = ctx.createRadialGradient(cx + panX, cy + panY, 0, cx + panX, cy + panY, R * zoom);
  if (darkMode) {
    bg.addColorStop(0, "#0d1240"); bg.addColorStop(0.5, "#060c2a"); bg.addColorStop(1, "#020122");
  } else {
    bg.addColorStop(0, "#ffffff"); bg.addColorStop(0.5, "#fafafa"); bg.addColorStop(1, "#f5f5f5");
  }
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Altitude rings
  const step = altRingStep(zoom);
  for (let alt = step; alt < 90; alt += step) {
    const r = (1 - alt / 90) * R * zoom;
    const isMajor = alt % 30 === 0;
    ctx.beginPath(); ctx.arc(cx + panX, cy + panY, r, 0, Math.PI * 2);
    if (darkMode) {
      ctx.strokeStyle = isMajor ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.04)";
    } else {
      ctx.strokeStyle = isMajor ? "rgba(0,0,60,0.08)" : "rgba(0,0,60,0.04)";
    }
    ctx.lineWidth = isMajor ? 0.7 : 0.4; ctx.stroke();
    if (!isMajor && !(step <= 10 && alt % (step * 2) === 0)) continue;
    const lx = cx + r * Math.sin(90 * DEG) + panX, ly = cy - r * Math.cos(90 * DEG) + panY;
    if (lx > cx - R && lx < cx + R && ly > cy - R && ly < cy + R) {
      ctx.fillStyle = darkMode
        ? (isMajor ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.13)")
        : (isMajor ? "rgba(0,0,60,0.30)" : "rgba(0,0,60,0.18)");
      ctx.font = `9px Space Mono, monospace`; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText(`${alt}°`, lx + 3, ly);
    }
  }

  drawSkyObjects(ctx, comp, tick, zoom, panX, panY, cx, cy, R, darkMode, selectedConstellation);
  drawBuildings(ctx, buildingAlpha, zoom, panX, panY, cx, cy, R, darkMode);
  drawPolarisMarker(ctx, comp, zoom, panX, panY, cx, cy, R, darkMode);
  if (!fullBleed) ctx.restore();

  // Horizon ring
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = darkMode ? "rgba(252,158,79,0.2)" : "rgba(184,58,8,0.25)";
  ctx.lineWidth = 1; ctx.stroke();

  // Cardinal labels
  ctx.fillStyle = darkMode ? "rgba(252,158,79,0.55)" : "rgba(184,58,8,0.65)";
  ctx.font = `bold 11px Space Mono, monospace`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  if (fullBleed && isPortrait) {
    // With R = H/2, the N/S/E/W horizon points land exactly at the screen edges.
    // Draw labels just inside those edges so they're always visible.
    const pad = 14;
    ctx.fillText("N", cx, pad);
    ctx.fillText("S", cx, H - pad);
    ctx.fillText("E", W - pad, cy);
    ctx.fillText("W", pad, cy);
  } else {
    for (const [label, az] of [["N", 0], ["E", 90], ["S", 180], ["W", 270]] as [string, number][]) {
      const a = az * DEG;
      ctx.fillText(label, cx + (R + 14) * Math.sin(a), cy - (R + 14) * Math.cos(a));
    }
  }

  // Zoom level overlay — skip in fullBleed (zoom controls are in the overlay UI)
  if (zoom > 1.05 && !fullBleed) {
    ctx.fillStyle = darkMode ? "rgba(252,158,79,0.4)" : "rgba(184,58,8,0.45)";
    ctx.font = `8px Space Mono, monospace`;
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText(`${zoom.toFixed(1)}×`, cx - R + 6, cy - R + 8);
  }

  ctx.restore();
}

export default function NightSkyMap() {
  const { theme } = useTheme();
  const themeRef = useRef<"dark" | "light">("dark");

  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const rafRef          = useRef<number>(0);
  const zoomRef         = useRef(1);
  const panRef          = useRef({ x: 0, y: 0 });
  const dragRef         = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);
  const pinchRef        = useRef<{ dist: number; zoom: number } | null>(null);
  const hasDraggedRef   = useRef(false);
  const transitionRef   = useRef<{ fromLat: number; fromLon: number; toLat: number; toLon: number; startTick: number } | null>(null);
  const buildingAlphaRef       = useRef(0);
  const buildingTargetRef      = useRef(0);
  const selectedConstellationRef = useRef<string | null>(null);
  const isFullscreenRef        = useRef(false);
  const panTransitionRef       = useRef<{
    fromX: number; fromY: number; toX: number; toY: number; startTick: number;
  } | null>(null);
  const date            = useRef(midnightTonight());

  const [computed, setComputed]             = useState<Computed | null>(null);
  const [isDragging, setIsDragging]         = useState(false);
  const [zoomLevel, setZoomLevel]           = useState(1);
  const [locationIdx, setLocationIdx]       = useState(1); // default: Zurich
  const [isFullscreen, setIsFullscreen]     = useState(false);
  const [selectedConstellation, setSelectedConstellation] = useState<string | null>(null);
  const [error, setError]                   = useState("");

  // Keep refs in sync so the RAF callback always reads current values
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
    const R = canvas ? Math.min(canvas.width, canvas.height) / (2 * (window.devicePixelRatio || 1)) - 24 : 200;
    panRef.current = clamped <= 1 ? { x: 0, y: 0 } : clampPan(clamped, anchorX - worldX * clamped, anchorY - worldY * clamped, R);
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
    const R = Math.min(W, H) / 2 - 24;
    if (R <= 0) return;

    const baseR = (1 - con.centroid.alt / 90) * R;
    const a = con.centroid.az * DEG;
    const targetPanX = -(baseR * Math.sin(a)) * zoomRef.current;
    const targetPanY =  (baseR * Math.cos(a)) * zoomRef.current;
    const clamped = clampPan(zoomRef.current, targetPanX, targetPanY, R);

    panTransitionRef.current = {
      fromX: panRef.current.x, fromY: panRef.current.y,
      toX: clamped.x, toY: clamped.y,
      startTick: 0,
    };
  }, [computed]);

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

    // Before ResizeObserver fires, the canvas defaults to 300×150.
    // Size it from the layout rect on the first frame.
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

    buildingAlphaRef.current += (buildingTargetRef.current - buildingAlphaRef.current) * 0.1;

    // Smooth pan-to-constellation animation
    const pt = panTransitionRef.current;
    if (pt) {
      if (pt.startTick === 0) pt.startTick = tick;
      const t = Math.min(1, (tick - pt.startTick) / 700);
      const ease = easeInOut(t);
      panRef.current = { x: lerp(pt.fromX, pt.toX, ease), y: lerp(pt.fromY, pt.toY, ease) };
      if (t >= 1) panTransitionRef.current = null;
    }

    draw(canvas, frameComp, tick, zoomRef.current, panRef.current.x, panRef.current.y,
      themeRef.current === "dark", buildingAlphaRef.current, selectedConstellationRef.current,
      isFullscreenRef.current);
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
    const canvas = canvasRef.current;
    // Reveal buildings when pointer is within 28 CSS-px of the horizon ring
    if (canvas) {
      const dpr  = window.devicePixelRatio || 1;
      const cssW = canvas.width / dpr;
      const cssH = canvas.height / dpr;
      const R_css = Math.min(cssW, cssH) / 2 - 24;
      const rect  = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left - cssW / 2;
      const my = e.clientY - rect.top  - cssH / 2;
      buildingTargetRef.current = Math.abs(Math.sqrt(mx * mx + my * my) - R_css) < 28 ? 1 : 0;
    }
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX, dy = e.clientY - dragRef.current.startY;
    if (Math.sqrt(dx * dx + dy * dy) > 4) hasDraggedRef.current = true;
    const R = canvas ? Math.min(canvas.width, canvas.height) / (2 * (window.devicePixelRatio || 1)) - 24 : 200;
    panRef.current = clampPan(zoomRef.current, dragRef.current.startPanX + dx, dragRef.current.startPanY + dy, R);
  };

  const onPointerLeave = () => { buildingTargetRef.current = 0; };

  const onPointerUp = () => { dragRef.current = null; setIsDragging(false); };

  const onCanvasClick = () => {
    if (!hasDraggedRef.current && !isFullscreen) setIsFullscreen(true);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.sqrt(dx * dx + dy * dy), zoom: zoomRef.current };
    }
  };

  const onTouchEnd   = () => { pinchRef.current = null; };
  const onDoubleClick = () => {
    zoomRef.current = 1; panRef.current = { x: 0, y: 0 }; setZoomLevel(1);
    selectedConstellationRef.current = null; setSelectedConstellation(null);
    panTransitionRef.current = null;
  };

  if (error) return <p className="font-mono text-xs text-red-400 py-8">{error}</p>;

  const canvasEvents = {
    onClick: onCanvasClick,
    onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp,
    onPointerLeave,
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
        {[1, 2, 4, 8].map((lvl) => (
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

        {/* Middle: canvas area + desktop sidebar. `relative` anchors mobile absolute children. */}
        <div className="flex-1 min-h-0 relative sm:flex sm:flex-row sm:gap-3 sm:px-4 sm:pb-2 sm:overflow-hidden">

          {/* Canvas wrapper:
              Mobile  — absolute inset-0, canvas fills the full screen
              Desktop — flex-1 static container, canvas is a centred square */}
          <div className="absolute inset-0 sm:relative sm:flex-1 sm:min-h-0 sm:min-w-0 sm:flex sm:items-center sm:justify-center">
            <canvas
              ref={canvasRef}
              className="block w-full h-full sm:w-auto sm:h-auto sm:rounded-full"
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
