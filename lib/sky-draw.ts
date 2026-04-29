import { DEG, type Computed } from "@/lib/sky-engine";
import { PLANET_STYLES } from "@/lib/sky-data";

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

function altRingStep(zoom: number) {
  if (zoom >= 5) return 5; if (zoom >= 3) return 10; if (zoom >= 2) return 15; return 30;
}

export function clampPan(zoom: number, panX: number, panY: number, R: number) {
  const m = R * Math.max(0, zoom - 1);
  return { x: Math.max(-m, Math.min(m, panX)), y: Math.max(-m, Math.min(m, panY)) };
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
    if (isSelected && con.centroid) {
      const [lx, ly] = sc(con.centroid.alt, con.centroid.az);
      ctx.fillStyle = darkMode ? "rgba(160,185,255,0.85)" : "rgba(40,60,180,0.75)";
      ctx.font = `bold 10px Space Mono, monospace`;
      ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.fillText(con.name, lx, ly - 6);
    }
  }

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

  const magThreshold = zoom >= 4 ? 4.5 : zoom >= 3 ? 3.5 : zoom >= 2 ? 2.5 : 1.4;
  ctx.textBaseline = "middle";
  for (const s of comp.stars) {
    if (!s.name || s.name === "Polaris" || s.mag > magThreshold) continue;
    const [sx, sy] = sc(s.alt, s.az);
    ctx.fillStyle = darkMode ? "rgba(255,255,255,0.55)" : "rgba(10,10,60,0.55)";
    ctx.font = `9px Space Mono, monospace`;
    ctx.textAlign = "left"; ctx.fillText(s.name, sx + s.r + 4, sy - 4);
  }

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

export function draw(
  canvas: HTMLCanvasElement, comp: Computed, tick: number,
  zoom: number, panX: number, panY: number,
  darkMode: boolean,
  selectedConstellation: string | null,
  fullBleed = false,
) {
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.width / dpr, H = canvas.height / dpr;
  const cx = W / 2, cy = H / 2;
  const isPortrait = H > W;
  const R = (fullBleed && isPortrait) ? H / 2 : Math.min(W, H) / 2 - 24;
  if (R <= 0) return;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save(); ctx.scale(dpr, dpr);

  if (!fullBleed) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
  }

  const bg = ctx.createRadialGradient(cx + panX, cy + panY, 0, cx + panX, cy + panY, R * zoom);
  if (darkMode) {
    bg.addColorStop(0, "#0d1240"); bg.addColorStop(0.5, "#060c2a"); bg.addColorStop(1, "#020122");
  } else {
    bg.addColorStop(0, "#ffffff"); bg.addColorStop(0.5, "#fafafa"); bg.addColorStop(1, "#f5f5f5");
  }
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

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
  drawPolarisMarker(ctx, comp, zoom, panX, panY, cx, cy, R, darkMode);
  if (!fullBleed) ctx.restore();

  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = darkMode ? "rgba(252,158,79,0.2)" : "rgba(184,58,8,0.25)";
  ctx.lineWidth = 1; ctx.stroke();

  ctx.fillStyle = darkMode ? "rgba(252,158,79,0.55)" : "rgba(184,58,8,0.65)";
  ctx.font = `bold 11px Space Mono, monospace`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  if (fullBleed && isPortrait) {
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

  if (zoom > 1.05 && !fullBleed) {
    ctx.fillStyle = darkMode ? "rgba(252,158,79,0.4)" : "rgba(184,58,8,0.45)";
    ctx.font = `8px Space Mono, monospace`;
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText(`${zoom.toFixed(1)}×`, cx - R + 6, cy - R + 8);
  }

  ctx.restore();
}
