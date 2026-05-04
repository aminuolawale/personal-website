import { DEG_TO_RAD, type Computed } from "@/lib/sky-engine";
import { PLANET_STYLES } from "@/lib/sky-data";

function starColorDark(spectralClass: string, alpha: number): string {
  const spectralClassColors: Record<string, string> = {
    O: `rgba(155,180,255,${alpha})`, B: `rgba(190,210,255,${alpha})`,
    A: `rgba(255,255,255,${alpha})`, F: `rgba(255,255,220,${alpha})`,
    G: `rgba(255,240,160,${alpha})`, K: `rgba(255,200,110,${alpha})`,
    M: `rgba(255,150, 90,${alpha})`,
  };
  return spectralClassColors[spectralClass] ?? `rgba(255,255,255,${alpha})`;
}

function starColorLight(spectralClass: string, alpha: number): string {
  const spectralClassColors: Record<string, string> = {
    O: `rgba(10,30,130,${alpha})`,  B: `rgba(20,50,150,${alpha})`,
    A: `rgba(10,10,60,${alpha})`,   F: `rgba(60,45,0,${alpha})`,
    G: `rgba(80,55,0,${alpha})`,    K: `rgba(100,30,0,${alpha})`,
    M: `rgba(110,10,0,${alpha})`,
  };
  return spectralClassColors[spectralClass] ?? `rgba(10,10,60,${alpha})`;
}

const LIGHT_MODE_PLANET_COLORS: Record<string, string> = {
  Mercury: "#5a5a6a", Venus: "#8a6a00", Mars: "#cc3311",
  Jupiter: "#9a7030", Saturn: "#8a6820", Uranus: "#006070", Neptune: "#2030b0",
};

function computeAltitudeRingStep(zoom: number) {
  if (zoom >= 5) return 5; if (zoom >= 3) return 10; if (zoom >= 2) return 15; return 30;
}

export function clampPan(zoom: number, panX: number, panY: number, skyRadius: number) {
  const maxPanOffset = skyRadius * Math.max(0, zoom - 1);
  return {
    x: Math.max(-maxPanOffset, Math.min(maxPanOffset, panX)),
    y: Math.max(-maxPanOffset, Math.min(maxPanOffset, panY)),
  };
}

function drawSkyObjects(
  ctx: CanvasRenderingContext2D,
  comp: Computed, tick: number,
  zoom: number, panX: number, panY: number,
  centerX: number, centerY: number, skyRadius: number,
  darkMode: boolean,
  selectedConstellation: string | null,
  highlightedConstellations: readonly string[],
) {
  function projectToCanvas(alt: number, az: number): [number, number] {
    const radialDistance = (1 - alt / 90) * skyRadius;
    const azimuthRad = az * DEG_TO_RAD;
    return [
      centerX + radialDistance * Math.sin(azimuthRad) * zoom + panX,
      centerY - radialDistance * Math.cos(azimuthRad) * zoom + panY,
    ];
  }

  for (const constellation of comp.constellations) {
    const isSelected = selectedConstellation === constellation.name;
    const isHighlighted = highlightedConstellations.includes(constellation.name);
    if (selectedConstellation !== null && !isSelected && !isHighlighted) continue;
    ctx.strokeStyle = isHighlighted
      ? (darkMode ? "rgba(252,158,79,0.9)" : "rgba(184,58,8,0.85)")
      : isSelected
        ? (darkMode ? "rgba(130,160,255,0.65)" : "rgba(40,60,180,0.5)")
        : (darkMode ? "rgba(130,160,255,0.22)" : "rgba(40,60,180,0.15)");
    ctx.lineWidth = isHighlighted ? 1.5 : isSelected ? 1.2 : 0.8;
    for (const [startPos, endPos] of constellation.segs) {
      const [x1, y1] = projectToCanvas(startPos.alt, startPos.az);
      const [x2, y2] = projectToCanvas(endPos.alt,   endPos.az);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    if ((isSelected || isHighlighted) && constellation.centroid) {
      const [constellationLabelX, constellationLabelY] = projectToCanvas(constellation.centroid.alt, constellation.centroid.az);
      ctx.fillStyle = isHighlighted
        ? (darkMode ? "rgba(252,180,105,0.9)" : "rgba(184,58,8,0.85)")
        : darkMode ? "rgba(160,185,255,0.85)" : "rgba(40,60,180,0.75)";
      ctx.font = `bold 10px Space Mono, monospace`;
      ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.fillText(constellation.name, constellationLabelX, constellationLabelY - 6);
    }
  }

  for (const object of comp.dso) {
    const [dsoX, dsoY] = projectToCanvas(object.alt, object.az);
    const dsoDisplayRadius = (object.type === "galaxy" ? 9 : object.type === "cluster" ? 7 : 6) * Math.min(zoom, 2);
    const dsoAlpha = Math.max(0.1, 0.55 - object.mag * 0.06);
    const dsoGlow = ctx.createRadialGradient(dsoX, dsoY, 0, dsoX, dsoY, dsoDisplayRadius);
    if (darkMode) {
      dsoGlow.addColorStop(0, object.type === "nebula" ? `rgba(180,100,200,${dsoAlpha * 1.5})` : `rgba(180,200,255,${dsoAlpha * 1.8})`);
    } else {
      dsoGlow.addColorStop(0, object.type === "nebula" ? `rgba(120,0,160,${dsoAlpha * 1.2})` : `rgba(10,40,140,${dsoAlpha * 1.5})`);
    }
    dsoGlow.addColorStop(1, "transparent");
    ctx.beginPath(); ctx.arc(dsoX, dsoY, dsoDisplayRadius, 0, Math.PI * 2);
    ctx.fillStyle = dsoGlow; ctx.fill();
    ctx.fillStyle = darkMode ? "rgba(180,200,255,0.5)" : "rgba(10,40,140,0.5)";
    ctx.font = `8px Space Mono, monospace`; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(object.name, dsoX + dsoDisplayRadius + 3, dsoY);
  }

  for (const star of comp.stars) {
    const [starX, starY] = projectToCanvas(star.alt, star.az);
    const starFillColor  = darkMode ? starColorDark(star.sp, 1) : starColorLight(star.sp, 1);
    const starHaloAlpha  = darkMode ? 0.8 : 0.7;
    const starHaloColor  = darkMode ? starColorDark(star.sp, starHaloAlpha) : starColorLight(star.sp, starHaloAlpha);
    const twinkleFactor  = star.name ? 0.85 + 0.15 * Math.sin(tick * 0.0018 + starX * 7.3) : 0.75 + 0.25 * Math.random();
    const scaledStarRadius = star.r * Math.min(1 + (zoom - 1) * 0.3, 2);
    if (scaledStarRadius > 1.2) {
      const starHalo = ctx.createRadialGradient(starX, starY, 0, starX, starY, scaledStarRadius * 3.5);
      starHalo.addColorStop(0, starHaloColor.replace(/[\d.]+\)$/, `${0.35 * twinkleFactor})`));
      starHalo.addColorStop(1, "transparent");
      ctx.beginPath(); ctx.arc(starX, starY, scaledStarRadius * 3.5, 0, Math.PI * 2); ctx.fillStyle = starHalo; ctx.fill();
    }
    ctx.beginPath(); ctx.arc(starX, starY, scaledStarRadius * twinkleFactor, 0, Math.PI * 2); ctx.fillStyle = starFillColor; ctx.fill();
  }

  const labelMagnitudeThreshold = zoom >= 4 ? 4.5 : zoom >= 3 ? 3.5 : zoom >= 2 ? 2.5 : 1.4;
  ctx.textBaseline = "middle";
  for (const star of comp.stars) {
    if (!star.name || star.name === "Polaris" || star.mag > labelMagnitudeThreshold) continue;
    const [starX, starY] = projectToCanvas(star.alt, star.az);
    ctx.fillStyle = darkMode ? "rgba(255,255,255,0.55)" : "rgba(10,10,60,0.55)";
    ctx.font = `9px Space Mono, monospace`;
    ctx.textAlign = "left"; ctx.fillText(star.name, starX + star.r + 4, starY - 4);
  }

  if (comp.moon) {
    const [moonX, moonY] = projectToCanvas(comp.moon.alt, comp.moon.az);
    const { phase } = comp.moon;
    const moonDisplayRadius = 10 * Math.min(1 + (zoom - 1) * 0.4, 2);
    const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonDisplayRadius * 3);
    if (darkMode) {
      moonGlow.addColorStop(0, "rgba(230,230,200,0.25)"); moonGlow.addColorStop(1, "transparent");
      ctx.beginPath(); ctx.arc(moonX, moonY, moonDisplayRadius * 3, 0, Math.PI * 2); ctx.fillStyle = moonGlow; ctx.fill();
      ctx.save();
      ctx.beginPath(); ctx.arc(moonX, moonY, moonDisplayRadius, 0, Math.PI * 2); ctx.clip();
      ctx.beginPath(); ctx.arc(moonX, moonY, moonDisplayRadius, 0, Math.PI * 2); ctx.fillStyle = "rgba(230,225,200,0.9)"; ctx.fill();
      const moonTerminatorCurvature = Math.cos((phase * Math.PI) / 180);
      ctx.fillStyle = "rgba(4,4,20,0.88)";
      ctx.beginPath(); ctx.arc(moonX, moonY, moonDisplayRadius, Math.PI / 2, -Math.PI / 2);
      ctx.bezierCurveTo(moonX + moonTerminatorCurvature * moonDisplayRadius, moonY - moonDisplayRadius, moonX + moonTerminatorCurvature * moonDisplayRadius, moonY + moonDisplayRadius, moonX, moonY + moonDisplayRadius); ctx.fill();
      ctx.restore();
      ctx.beginPath(); ctx.arc(moonX, moonY, moonDisplayRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(230,225,200,0.4)"; ctx.lineWidth = 0.5; ctx.stroke();
      ctx.fillStyle = "rgba(230,225,200,0.7)";
    } else {
      moonGlow.addColorStop(0, "rgba(50,55,70,0.12)"); moonGlow.addColorStop(1, "transparent");
      ctx.beginPath(); ctx.arc(moonX, moonY, moonDisplayRadius * 3, 0, Math.PI * 2); ctx.fillStyle = moonGlow; ctx.fill();
      ctx.save();
      ctx.beginPath(); ctx.arc(moonX, moonY, moonDisplayRadius, 0, Math.PI * 2); ctx.clip();
      ctx.beginPath(); ctx.arc(moonX, moonY, moonDisplayRadius, 0, Math.PI * 2); ctx.fillStyle = "rgba(50,55,70,0.85)"; ctx.fill();
      const moonTerminatorCurvature = Math.cos((phase * Math.PI) / 180);
      ctx.fillStyle = "rgba(225,228,240,0.92)";
      ctx.beginPath(); ctx.arc(moonX, moonY, moonDisplayRadius, Math.PI / 2, -Math.PI / 2);
      ctx.bezierCurveTo(moonX + moonTerminatorCurvature * moonDisplayRadius, moonY - moonDisplayRadius, moonX + moonTerminatorCurvature * moonDisplayRadius, moonY + moonDisplayRadius, moonX, moonY + moonDisplayRadius); ctx.fill();
      ctx.restore();
      ctx.beginPath(); ctx.arc(moonX, moonY, moonDisplayRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(50,55,70,0.35)"; ctx.lineWidth = 0.5; ctx.stroke();
      ctx.fillStyle = "rgba(50,55,70,0.7)";
    }
    ctx.font = `bold 9px Space Mono, monospace`;
    ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText("Moon", moonX + moonDisplayRadius + 4, moonY);
  }

  for (const planet of comp.planets) {
    const [planetX, planetY]   = projectToCanvas(planet.alt, planet.az);
    const planetDisplayRadius  = planet.radius * Math.min(1 + (zoom - 1) * 0.4, 2);
    const planetColor          = darkMode ? PLANET_STYLES[planet.name].color : (LIGHT_MODE_PLANET_COLORS[planet.name] ?? "#333");
    const planetGlow = ctx.createRadialGradient(planetX, planetY, 0, planetX, planetY, planetDisplayRadius * 3.5);
    planetGlow.addColorStop(0, planetColor + "66"); planetGlow.addColorStop(1, "transparent");
    ctx.beginPath(); ctx.arc(planetX, planetY, planetDisplayRadius * 3.5, 0, Math.PI * 2); ctx.fillStyle = planetGlow; ctx.fill();
    ctx.beginPath(); ctx.arc(planetX, planetY, planetDisplayRadius, 0, Math.PI * 2); ctx.fillStyle = planetColor; ctx.fill();
    ctx.fillStyle = planetColor; ctx.font = `bold 9px Space Mono, monospace`;
    ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(planet.name, planetX + planetDisplayRadius + 5, planetY);
  }
}

function drawPolarisMarker(
  ctx: CanvasRenderingContext2D,
  comp: Computed,
  zoom: number, panX: number, panY: number,
  centerX: number, centerY: number, skyRadius: number,
  darkMode: boolean,
) {
  const polaris = comp.stars.find((star) => star.name === "Polaris");
  if (!polaris) return;

  const radialDistance  = (1 - polaris.alt / 90) * skyRadius;
  const azimuthRad      = polaris.az * DEG_TO_RAD;
  const polarisX        = centerX + radialDistance * Math.sin(azimuthRad) * zoom + panX;
  const polarisY        = centerY - radialDistance * Math.cos(azimuthRad) * zoom + panY;
  const scaledStarRadius = polaris.r * Math.min(1 + (zoom - 1) * 0.3, 2);

  ctx.save();
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.arc(polarisX, polarisY, scaledStarRadius * 5, 0, Math.PI * 2);
  ctx.strokeStyle = darkMode ? "rgba(180,210,255,0.5)" : "rgba(10,40,140,0.45)";
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = darkMode ? "rgba(200,220,255,0.85)" : "rgba(10,40,140,0.75)";
  ctx.font = `bold 9px Space Mono, monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("Polaris", polarisX + scaledStarRadius * 5 + 4, polarisY);
  ctx.restore();
}

export function draw(
  canvas: HTMLCanvasElement, comp: Computed, tick: number,
  zoom: number, panX: number, panY: number,
  darkMode: boolean,
  selectedConstellation: string | null,
  fullBleed = false,
  highlightedConstellations: readonly string[] = [],
) {
  const devicePixelRatio = window.devicePixelRatio || 1;
  const canvasWidth  = canvas.width  / devicePixelRatio;
  const canvasHeight = canvas.height / devicePixelRatio;
  const centerX = canvasWidth  / 2;
  const centerY = canvasHeight / 2;
  const isPortrait = canvasHeight > canvasWidth;
  const skyRadius = (fullBleed && isPortrait) ? canvasHeight / 2 : Math.min(canvasWidth, canvasHeight) / 2 - 24;
  if (skyRadius <= 0) return;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save(); ctx.scale(devicePixelRatio, devicePixelRatio);

  if (!fullBleed) {
    ctx.save();
    ctx.beginPath(); ctx.arc(centerX, centerY, skyRadius, 0, Math.PI * 2); ctx.clip();
  }

  const skyGradient = ctx.createRadialGradient(centerX + panX, centerY + panY, 0, centerX + panX, centerY + panY, skyRadius * zoom);
  if (darkMode) {
    skyGradient.addColorStop(0, "#0d1240"); skyGradient.addColorStop(0.5, "#060c2a"); skyGradient.addColorStop(1, "#020122");
  } else {
    skyGradient.addColorStop(0, "#ffffff"); skyGradient.addColorStop(0.5, "#fafafa"); skyGradient.addColorStop(1, "#f5f5f5");
  }
  ctx.fillStyle = skyGradient; ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const ringStepDegrees = computeAltitudeRingStep(zoom);
  for (let alt = ringStepDegrees; alt < 90; alt += ringStepDegrees) {
    const ringRadius = (1 - alt / 90) * skyRadius * zoom;
    const isMajor = alt % 30 === 0;
    ctx.beginPath(); ctx.arc(centerX + panX, centerY + panY, ringRadius, 0, Math.PI * 2);
    if (darkMode) {
      ctx.strokeStyle = isMajor ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.04)";
    } else {
      ctx.strokeStyle = isMajor ? "rgba(0,0,60,0.08)" : "rgba(0,0,60,0.04)";
    }
    ctx.lineWidth = isMajor ? 0.7 : 0.4; ctx.stroke();
    if (!isMajor && !(ringStepDegrees <= 10 && alt % (ringStepDegrees * 2) === 0)) continue;
    const ringLabelX = centerX + ringRadius * Math.sin(90 * DEG_TO_RAD) + panX;
    const ringLabelY = centerY - ringRadius * Math.cos(90 * DEG_TO_RAD) + panY;
    if (ringLabelX > centerX - skyRadius && ringLabelX < centerX + skyRadius && ringLabelY > centerY - skyRadius && ringLabelY < centerY + skyRadius) {
      ctx.fillStyle = darkMode
        ? (isMajor ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.13)")
        : (isMajor ? "rgba(0,0,60,0.30)" : "rgba(0,0,60,0.18)");
      ctx.font = `9px Space Mono, monospace`; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText(`${alt}°`, ringLabelX + 3, ringLabelY);
    }
  }

  drawSkyObjects(ctx, comp, tick, zoom, panX, panY, centerX, centerY, skyRadius, darkMode, selectedConstellation, highlightedConstellations);
  drawPolarisMarker(ctx, comp, zoom, panX, panY, centerX, centerY, skyRadius, darkMode);
  if (!fullBleed) ctx.restore();

  ctx.beginPath(); ctx.arc(centerX, centerY, skyRadius, 0, Math.PI * 2);
  ctx.strokeStyle = darkMode ? "rgba(252,158,79,0.2)" : "rgba(184,58,8,0.25)";
  ctx.lineWidth = 1; ctx.stroke();

  ctx.fillStyle = darkMode ? "rgba(252,158,79,0.55)" : "rgba(184,58,8,0.65)";
  ctx.font = `bold 11px Space Mono, monospace`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  if (fullBleed && isPortrait) {
    const cardinalLabelPadding = 14;
    ctx.fillText("N", centerX, cardinalLabelPadding);
    ctx.fillText("S", centerX, canvasHeight - cardinalLabelPadding);
    ctx.fillText("E", canvasWidth - cardinalLabelPadding, centerY);
    ctx.fillText("W", cardinalLabelPadding, centerY);
  } else {
    for (const [label, az] of [["N", 0], ["E", 90], ["S", 180], ["W", 270]] as [string, number][]) {
      const azimuthRad = az * DEG_TO_RAD;
      ctx.fillText(label, centerX + (skyRadius + 14) * Math.sin(azimuthRad), centerY - (skyRadius + 14) * Math.cos(azimuthRad));
    }
  }

  if (zoom > 1.05 && !fullBleed) {
    ctx.fillStyle = darkMode ? "rgba(252,158,79,0.4)" : "rgba(184,58,8,0.45)";
    ctx.font = `8px Space Mono, monospace`;
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText(`${zoom.toFixed(1)}×`, centerX - skyRadius + 6, centerY - skyRadius + 8);
  }

  ctx.restore();
}
