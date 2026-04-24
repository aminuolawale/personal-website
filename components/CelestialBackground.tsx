"use client";

import { useEffect, useRef, useState } from "react";

// ── Seeded PRNG ───────────────────────────────────────────────────────────
function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Colour palette ────────────────────────────────────────────────────────
const P = {
  orange: "#fc9e4f",
  gold: "#edd382",
  cream: "#f2f3ae",
  red: "#f4442e",
  oa: (a: number) => `rgba(252,158,79,${a.toFixed(3)})`,
  ga: (a: number) => `rgba(237,211,130,${a.toFixed(3)})`,
  ca: (a: number) => `rgba(242,243,174,${a.toFixed(3)})`,
  ra: (a: number) => `rgba(244,68,46,${a.toFixed(3)})`,
};

export interface CelestialData {
  id: string;
  category: "galaxy" | "nebula" | "planet" | "comet" | "blackhole";
  name: string;
  type: string;
  summary: string;
  imageUrl: string;
  traits: any;
}

const CELESTIAL_CATALOG: Record<string, CelestialData[]> = {
  galaxy: [
    { id: "m31", category: "galaxy", name: "Andromeda Galaxy (M31)", type: "Spiral Galaxy", summary: "The closest major galaxy to the Milky Way, approximately 2.5 million light-years away.", imageUrl: "/celestial/m31.jpg", traits: { tilt: 0.4, core: P.cream, arm: P.gold } },
    { id: "m51", category: "galaxy", name: "Whirlpool Galaxy (M51)", type: "Spiral Galaxy", summary: "An interacting grand-design spiral galaxy located in the constellation Canes Venatici.", imageUrl: "/celestial/m51.jpg", traits: { tilt: 1.0, core: P.cream, arm: P.orange } },
    { id: "m104", category: "galaxy", name: "Sombrero Galaxy (M104)", type: "Spiral Galaxy", summary: "A peculiar galaxy characterized by its bright nucleus, unusually large central bulge, and prominent dust lane.", imageUrl: "/celestial/m104.jpg", traits: { tilt: 0.15, dustLane: true, core: P.cream, arm: P.gold } },
    { id: "m101", category: "galaxy", name: "Pinwheel Galaxy (M101)", type: "Spiral Galaxy", summary: "A face-on spiral galaxy distanced 21 million light-years away in the constellation Ursa Major.", imageUrl: "/celestial/m101.jpg", traits: { tilt: 0.9, core: P.gold, arm: P.orange } },
    { id: "m33", category: "galaxy", name: "Triangulum Galaxy (M33)", type: "Spiral Galaxy", summary: "The third-largest member of the Local Group of galaxies.", imageUrl: "/celestial/m33.jpg", traits: { tilt: 0.6, core: P.cream, arm: P.cream } }
  ],
  nebula: [
    { id: "m42", category: "nebula", name: "Orion Nebula (M42)", type: "Diffuse Nebula", summary: "A diffuse nebula situated in the Milky Way, being one of the brightest nebulae visible to the naked eye.", imageUrl: "/celestial/m42.jpg", traits: { shape: 'cloud', color1: P.red, color2: P.orange } },
    { id: "m1", category: "nebula", name: "Crab Nebula (M1)", type: "Supernova Remnant", summary: "A supernova remnant and pulsar wind nebula in the constellation of Taurus.", imageUrl: "/celestial/m1.jpg", traits: { shape: 'burst', color1: P.orange, color2: P.cream } },
    { id: "m57", category: "nebula", name: "Ring Nebula (M57)", type: "Planetary Nebula", summary: "A planetary nebula in the northern constellation of Lyra, formed by a star casting off its outer layers.", imageUrl: "/celestial/m57.jpg", traits: { shape: 'ring', color1: P.red, color2: P.gold } },
    { id: "m16", category: "nebula", name: "Eagle Nebula (M16)", type: "Emission Nebula", summary: "Contains the famous Pillars of Creation, a large region of active star formation.", imageUrl: "/celestial/m16.jpg", traits: { shape: 'pillars', color1: P.orange, color2: P.gold } },
    { id: "ngc3372", category: "nebula", name: "Carina Nebula", type: "Complex Nebula", summary: "A large, complex area of bright and dark nebulosity in the constellation Carina.", imageUrl: "/celestial/ngc3372.jpg", traits: { shape: 'cloud', color1: P.red, color2: P.gold } }
  ],
  planet: [
    { id: "jupiter", category: "planet", name: "Jupiter", type: "Gas Giant", summary: "The largest planet in the Solar System, known for its Great Red Spot and prominent cloud bands.", imageUrl: "/celestial/jupiter.jpg", traits: { color: P.orange, hasRing: false, bands: true } },
    { id: "saturn", category: "planet", name: "Saturn", type: "Gas Giant", summary: "The sixth planet from the Sun, famous for its extensive ring system.", imageUrl: "/celestial/saturn.jpg", traits: { color: P.gold, hasRing: true, bands: true } },
    { id: "mars", category: "planet", name: "Mars", type: "Terrestrial Planet", summary: "The fourth planet from the Sun, known as the Red Planet.", imageUrl: "/celestial/mars.jpg", traits: { color: P.red, hasRing: false, bands: false } },
    { id: "venus", category: "planet", name: "Venus", type: "Terrestrial Planet", summary: "The second planet from the Sun, shrouded in thick clouds of sulfuric acid.", imageUrl: "/celestial/venus.jpg", traits: { color: P.cream, hasRing: false, bands: false } },
    { id: "trappist", category: "planet", name: "TRAPPIST-1e", type: "Exoplanet", summary: "A rocky, Earth-sized exoplanet orbiting within the habitable zone of the ultra-cool dwarf star TRAPPIST-1.", imageUrl: "/celestial/trappist.jpg", traits: { color: P.red, hasRing: false, bands: false } }
  ],
  comet: [
    { id: "halley", category: "comet", name: "Halley's Comet", type: "Periodic Comet", summary: "A short-period comet visible from Earth every 75–76 years.", imageUrl: "/celestial/halley.jpg", traits: { color: P.cream, tailLen: 1.2 } },
    { id: "neowise", category: "comet", name: "Comet NEOWISE (C/2020 F3)", type: "Long-period Comet", summary: "A bright comet discovered by the NEOWISE mission, visible to the naked eye in 2020.", imageUrl: "/celestial/neowise.jpg", traits: { color: P.gold, tailLen: 1.5, twinTail: true } },
    { id: "halebopp", category: "comet", name: "Comet Hale-Bopp", type: "Long-period Comet", summary: "Perhaps the most widely observed comet of the 20th century.", imageUrl: "/celestial/halebopp.jpg", traits: { color: P.cream, tailLen: 1.0, twinTail: true } },
    { id: "encke", category: "comet", name: "Comet Encke", type: "Periodic Comet", summary: "A periodic comet that completes an orbit of the Sun once every 3.3 years.", imageUrl: "/celestial/encke.jpg", traits: { color: P.orange, tailLen: 0.8 } }
  ],
  blackhole: [
    { id: "m87", category: "blackhole", name: "M87*", type: "Supermassive Black Hole", summary: "The supermassive black hole at the center of the massive elliptical galaxy Messier 87.", imageUrl: "/celestial/m87.jpg", traits: { color: P.orange, jets: true, asymmetry: true } },
    { id: "saga", category: "blackhole", name: "Sagittarius A*", type: "Supermassive Black Hole", summary: "The supermassive black hole at the Galactic Center of the Milky Way.", imageUrl: "/celestial/saga.jpg", traits: { color: P.red, jets: false, asymmetry: false } },
    { id: "cygnus", category: "blackhole", name: "Cygnus X-1", type: "Stellar Black Hole", summary: "A well-known galactic X-ray source widely accepted to be a black hole.", imageUrl: "/celestial/cygnus.jpg", traits: { color: P.cream, jets: true, asymmetry: true } }
  ]
};

interface Hitbox {
  x: number;
  y: number;
  r: number;
  layerSpeed: number;
  data: CelestialData;
}

// ── Helpers ───────────────────────────────────────────────────────────────
function glow(
  ctx: CanvasRenderingContext2D,
  blur: number,
  color: string,
  fn: () => void
) {
  ctx.save();
  ctx.shadowBlur = blur;
  ctx.shadowColor = color;
  fn();
  ctx.restore();
}

// ── Galaxy ────────────────────────────────────────────────────────────────
function drawGalaxy(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  lw: number,
  traits: any,
  rand: () => number
) {
  const tilt = traits.tilt || 1.0;
  const coreColor = traits.core || P.cream;
  const armColor = traits.arm || P.orange;
  const dustLane = traits.dustLane || false;

  const turns = 1.6;
  const a = R / (turns * 2 * Math.PI);
  const steps = 300;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, tilt);
  ctx.rotate(rand() * Math.PI * 2);

  // Two spiral arms
  for (let arm = 0; arm < 2; arm++) {
    const offset = arm * Math.PI;

    // Faint outer trail
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = armColor;
    ctx.lineWidth = lw * 0.7;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * turns * 2 * Math.PI;
      const r = a * theta;
      const x = r * Math.cos(theta + offset);
      const y = r * Math.sin(theta + offset);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // Bright inner core of the arm
    glow(ctx, lw * 10, armColor, () => {
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = armColor;
      ctx.lineWidth = lw;
      ctx.beginPath();
      const innerSteps = Math.floor(steps * 0.6);
      for (let i = 0; i <= innerSteps; i++) {
        const theta = (i / steps) * turns * 2 * Math.PI;
        const r = a * theta;
        const x = r * Math.cos(theta + offset);
        const y = r * Math.sin(theta + offset);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
  }

  // Outer halo circle
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = armColor;
  ctx.lineWidth = lw * 0.5;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.9, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.restore();

  // Dust lane
  if (dustLane) {
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = "#020122";
    ctx.lineWidth = lw * 6;
    ctx.beginPath();
    ctx.moveTo(-R, 0);
    ctx.lineTo(R, 0);
    ctx.stroke();
    ctx.restore();
  }

  // Bright nucleus
  glow(ctx, 22, coreColor, () => {
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.arc(0, 0, lw * (dustLane ? 4 : 2), 0, 2 * Math.PI);
    ctx.fill();
  });

  glow(ctx, 14, coreColor, () => {
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = lw * 0.7;
    ctx.beginPath();
    ctx.arc(0, 0, lw * (dustLane ? 8 : 4), 0, 2 * Math.PI);
    ctx.stroke();
  });

  ctx.restore();
}

// ── Planet ────────────────────────────────────────────────────────────────
function drawPlanet(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  lw: number,
  traits: any
) {
  const color = traits.color || P.orange;
  const hasRing = traits.hasRing || false;
  const bands = traits.bands || false;

  ctx.save();
  ctx.translate(cx, cy);

  ctx.globalAlpha = 0.55;
  ctx.fillStyle = "#020122";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, 2 * Math.PI);
  ctx.fill();

  if (bands) {
    ctx.save();
    ctx.clip(); 
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = color;
    ctx.lineWidth = lw * 2;
    for(let y = -r; y < r; y += lw * 4) {
      ctx.beginPath();
      ctx.moveTo(-r, y);
      ctx.lineTo(r, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  glow(ctx, 14, color, () => {
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, 2 * Math.PI);
    ctx.stroke();
  });

  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = P.cream;
  ctx.lineWidth = lw * 0.8;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.85, Math.PI * 1.1, Math.PI * 1.75);
  ctx.stroke();
  ctx.restore();

  if (hasRing) {
    const rx = r * 1.85;
    const ry = r * 0.38;

    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = P.gold;
    ctx.lineWidth = lw * 0.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI); 
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "#020122";
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(0, 0, r - 0.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    glow(ctx, 10, color, () => {
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, 2 * Math.PI);
      ctx.stroke();
    });

    glow(ctx, 8, P.gold, () => {
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = P.gold;
      ctx.lineWidth = lw * 0.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, Math.PI, 2 * Math.PI); 
      ctx.stroke();
    });
  }

  ctx.restore();
}

// ── Blackhole ─────────────────────────────────────────────────────────────
function drawBlackHole(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  lw: number,
  traits: any
) {
  const color = traits.color || P.orange;
  const jets = traits.jets !== false;
  const asymmetry = traits.asymmetry !== false;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(0.2);

  for (let i = 4; i >= 1; i--) {
    ctx.save();
    ctx.globalAlpha = 0.07 * i;
    ctx.strokeStyle = color;
    ctx.lineWidth = lw * 0.6;
    ctx.beginPath();
    ctx.arc(0, 0, r + i * (r * 0.35), 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  glow(ctx, 18, color, () => {
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = color;
    ctx.lineWidth = lw * 1.2;
    ctx.beginPath();
    if (asymmetry) {
      ctx.arc(0, 0, r, 0, Math.PI);
      ctx.stroke();
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(0, 0, r, Math.PI, 2 * Math.PI);
      ctx.stroke();
    } else {
      ctx.arc(0, 0, r, 0, 2 * Math.PI);
      ctx.stroke();
    }
  });

  glow(ctx, 8, P.cream, () => {
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = P.cream;
    ctx.lineWidth = lw * 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.75, 0, 2 * Math.PI);
    ctx.stroke();
  });

  if (jets) {
    glow(ctx, 6, P.cream, () => {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = P.ca(1);
      ctx.lineWidth = lw * 0.7;
      [[0, -r - 4, 0, -r - r * 1.8], [0, r + 4, 0, r + r * 1.8]].forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
    });
  }

  ctx.restore();
}

// ── Nebula ────────────────────────────────────────────────────────────────
function drawNebula(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  lw: number,
  rand: () => number,
  traits: any
) {
  const shape = traits.shape || 'cloud';
  const c1 = traits.color1 || P.orange;
  const c2 = traits.color2 || P.gold;
  const palette = [c1, c2, P.cream];

  ctx.save();
  ctx.translate(cx, cy);

  if (shape === 'ring') {
    glow(ctx, 15, c1, () => {
      ctx.strokeStyle = c1;
      ctx.lineWidth = lw * 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.7, 0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = c2;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.8, r * 0.5, 0.3, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.fillStyle = P.cream;
    ctx.beginPath();
    ctx.arc(0, 0, lw, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'burst') {
    for (let i = 0; i < 40; i++) {
      const a = rand() * Math.PI * 2;
      const l = r * (0.3 + rand() * 0.7);
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = palette[Math.floor(rand() * palette.length)];
      ctx.lineWidth = lw * (0.2 + rand() * 0.5);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * l, Math.sin(a) * l);
      ctx.stroke();
    }
  } else if (shape === 'pillars') {
    ctx.strokeStyle = c1;
    ctx.lineWidth = lw * 1.5;
    ctx.fillStyle = "#020122";
    for(let i=-1; i<=1; i++) {
      const px = i * r * 0.4;
      const ph = r * (0.8 + rand() * 0.4);
      ctx.beginPath();
      ctx.moveTo(px - r*0.1, r);
      ctx.lineTo(px, r - ph);
      ctx.lineTo(px + r*0.1, r);
      ctx.fill();
      ctx.stroke();
    }
    glow(ctx, 10, c2, () => {
       ctx.globalAlpha = 0.5;
       ctx.fillStyle = c2;
       ctx.beginPath();
       ctx.arc(0, -r*0.2, r*0.5, 0, Math.PI*2);
       ctx.fill();
    });
  } else {
    const blobs = 5 + Math.floor(rand() * 4);
    for (let i = 0; i < blobs; i++) {
      const bx = (rand() - 0.5) * r * 0.7;
      const by = (rand() - 0.5) * r * 0.7;
      const br = r * (0.25 + rand() * 0.75);
      const color = palette[Math.floor(rand() * palette.length)];
      const alpha = 0.05 + rand() * 0.07;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = alpha * 2.5;
      ctx.strokeStyle = color;
      ctx.lineWidth = lw * 0.5;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
}

// ── Comet ─────────────────────────────────────────────────────────────────
function drawComet(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
  tailLen: number,
  lw: number,
  traits: any
) {
  const color = traits.color || P.orange;
  const spread = 0.28; 
  const fanCount = traits.twinTail ? 8 : 5;
  const tMult = traits.tailLen || 1.0;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineCap = "round";

  for (let s = -(fanCount - 1) / 2; s <= (fanCount - 1) / 2; s++) {
    const fanAngle = angle + (s / ((fanCount - 1) / 2)) * spread;
    const t = 1 - Math.abs(s) / ((fanCount - 1) / 2 + 1);
    ctx.globalAlpha = 0.6 * t;
    if (traits.twinTail && Math.abs(s) < 1.5) ctx.globalAlpha *= 0.2;
    
    ctx.strokeStyle = s === 0 ? P.cream : color;
    ctx.lineWidth = lw * t * 0.9;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(
      -Math.cos(fanAngle) * tailLen * tMult * (0.7 + t * 0.3),
      -Math.sin(fanAngle) * tailLen * tMult * (0.7 + t * 0.3)
    );
    ctx.stroke();
  }

  glow(ctx, 16, P.cream, () => {
    ctx.fillStyle = P.cream;
    ctx.beginPath();
    ctx.arc(0, 0, lw * 1.8, 0, 2 * Math.PI);
    ctx.fill();
  });

  ctx.restore();
}

// ── Rocket (SLS) ──────────────────────────────────────────────────────────
function drawRocket(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  lw: number
) {
  const w = 18 * scale;
  const h = 100 * scale;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.15); 

  ctx.fillStyle = "#020122";
  ctx.globalAlpha = 0.85;

  glow(ctx, 10, P.orange, () => {
    ctx.strokeStyle = P.orange;
    ctx.lineWidth = lw * 0.6;
    ctx.beginPath();
    ctx.rect(-w * 0.6, -h * 0.3, w * 1.2, h * 0.8);
    ctx.fill();
    ctx.stroke();
  });

  const bw = w * 0.35;
  const bh = h * 0.65;
  glow(ctx, 8, P.cream, () => {
    ctx.strokeStyle = P.cream;
    ctx.lineWidth = lw * 0.5;
    for (const sign of [-1, 1]) {
      const bx = sign * w * 0.85;
      ctx.beginPath();
      ctx.moveTo(bx - bw, -bh * 0.4);
      ctx.lineTo(bx - bw, bh * 0.5);
      ctx.lineTo(bx + bw, bh * 0.5);
      ctx.lineTo(bx + bw, -bh * 0.4);
      ctx.lineTo(bx, -bh * 0.6); 
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  });

  glow(ctx, 8, P.cream, () => {
    ctx.strokeStyle = P.cream;
    ctx.lineWidth = lw * 0.5;
    ctx.beginPath();
    ctx.moveTo(-w * 0.6, -h * 0.3);
    ctx.lineTo(-w * 0.4, -h * 0.45);
    ctx.lineTo(-w * 0.4, -h * 0.6); 
    ctx.lineTo(-w * 0.25, -h * 0.7); 
    ctx.lineTo(0, -h * 0.9); 
    ctx.lineTo(w * 0.25, -h * 0.7);
    ctx.lineTo(w * 0.4, -h * 0.6);
    ctx.lineTo(w * 0.4, -h * 0.45);
    ctx.lineTo(w * 0.6, -h * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  ctx.globalAlpha = 1.0;
  glow(ctx, 15, P.orange, () => {
    ctx.strokeStyle = P.gold;
    ctx.lineWidth = lw * 0.8;
    ctx.beginPath();
    ctx.moveTo(-w * 0.3, h * 0.5);
    ctx.lineTo(0, h * 0.85);
    ctx.lineTo(w * 0.3, h * 0.5);
    ctx.stroke();
    for (const sign of [-1, 1]) {
      const bx = sign * w * 0.85;
      ctx.beginPath();
      ctx.moveTo(bx - bw * 0.5, bh * 0.5);
      ctx.lineTo(bx, bh * 0.5 + h * 0.25);
      ctx.lineTo(bx + bw * 0.5, bh * 0.5);
      ctx.stroke();
    }
  });

  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = P.gold;
  ctx.lineWidth = lw * 0.3;
  ctx.beginPath();
  ctx.moveTo(-w * 0.6, 0);
  ctx.lineTo(w * 0.6, 0);
  ctx.moveTo(-w * 0.6, h * 0.25);
  ctx.lineTo(w * 0.6, h * 0.25);
  ctx.stroke();

  ctx.restore();
}

// ── Starship & Gantry ─────────────────────────────────────────────────────
function drawStarship(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  lw: number
) {
  const w = 14 * scale;
  const h = 180 * scale; 
  const tw = 25 * scale; 
  const th = 220 * scale; 

  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = "#020122";
  ctx.globalAlpha = 0.85;

  const tx = -w * 2.5; 
  glow(ctx, 3, P.gold, () => {
    ctx.strokeStyle = P.gold;
    ctx.lineWidth = lw * 0.2;
    ctx.beginPath();
    ctx.moveTo(tx - tw * 0.5, h * 0.5);
    ctx.lineTo(tx - tw * 0.5, h * 0.5 - th);
    ctx.moveTo(tx + tw * 0.5, h * 0.5);
    ctx.lineTo(tx + tw * 0.5, h * 0.5 - th);
    ctx.stroke();

    const segments = 20;
    const segH = th / segments;
    ctx.beginPath();
    for (let i = 0; i < segments; i++) {
      const y1 = h * 0.5 - i * segH;
      const y2 = h * 0.5 - (i + 1) * segH;
      ctx.moveTo(tx - tw * 0.5, y1);
      ctx.lineTo(tx + tw * 0.5, y2);
      ctx.moveTo(tx + tw * 0.5, y1);
      ctx.lineTo(tx - tw * 0.5, y2);
      ctx.moveTo(tx - tw * 0.5, y1);
      ctx.lineTo(tx + tw * 0.5, y1);
    }
    ctx.stroke();

    const armsY = h * 0.5 - th * 0.65;
    ctx.lineWidth = lw * 0.3;
    ctx.beginPath();
    ctx.moveTo(tx + tw * 0.5, armsY);
    ctx.lineTo(tx + tw * 0.5 + w * 2.2, armsY - h * 0.02);
    ctx.moveTo(tx + tw * 0.5, armsY + h * 0.05);
    ctx.lineTo(tx + tw * 0.5 + w * 2.4, armsY + h * 0.03);
    ctx.stroke();
  });

  const shH = h * 0.55;
  const shipH = h * 0.45;
  const baseY = h * 0.5;
  
  glow(ctx, 4, P.cream, () => {
    ctx.strokeStyle = P.cream;
    ctx.lineWidth = lw * 0.25;
    ctx.beginPath();
    ctx.rect(-w * 0.5, baseY - shH, w, shH);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-w * 0.5, baseY - shH + h * 0.05);
    ctx.lineTo(-w * 1.2, baseY - shH + h * 0.05);
    ctx.lineTo(-w * 1.2, baseY - shH + h * 0.08);
    ctx.lineTo(-w * 0.5, baseY - shH + h * 0.08);
    ctx.moveTo(w * 0.5, baseY - shH + h * 0.05);
    ctx.lineTo(w * 1.2, baseY - shH + h * 0.05);
    ctx.lineTo(w * 1.2, baseY - shH + h * 0.08);
    ctx.lineTo(w * 0.5, baseY - shH + h * 0.08);
    ctx.stroke();
  });

  glow(ctx, 4, P.cream, () => {
    ctx.strokeStyle = P.cream;
    ctx.lineWidth = lw * 0.25;
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, baseY - shH);
    ctx.lineTo(-w * 0.5, baseY - shH - shipH * 0.6);
    ctx.bezierCurveTo(
      -w * 0.5, baseY - shH - shipH * 0.9,
      -w * 0.1, baseY - shH - shipH,
      0, baseY - shH - shipH
    );
    ctx.bezierCurveTo(
      w * 0.1, baseY - shH - shipH,
      w * 0.5, baseY - shH - shipH * 0.9,
      w * 0.5, baseY - shH - shipH * 0.6
    );
    ctx.lineTo(w * 0.5, baseY - shH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    const noseY = baseY - shH - shipH * 0.7;
    ctx.moveTo(-w * 0.45, noseY);
    ctx.lineTo(-w * 1.1, noseY);
    ctx.lineTo(-w * 1.1, noseY + h * 0.08);
    ctx.lineTo(-w * 0.5, noseY + h * 0.05);
    ctx.moveTo(w * 0.45, noseY);
    ctx.lineTo(w * 1.1, noseY);
    ctx.lineTo(w * 1.1, noseY + h * 0.08);
    ctx.lineTo(w * 0.5, noseY + h * 0.05);
    ctx.stroke();

    ctx.beginPath();
    const aftY = baseY - shH - shipH * 0.1;
    ctx.moveTo(-w * 0.5, aftY);
    ctx.lineTo(-w * 1.2, aftY + h * 0.05);
    ctx.lineTo(-w * 1.2, aftY + h * 0.15);
    ctx.lineTo(-w * 0.5, aftY + h * 0.12);
    ctx.moveTo(w * 0.5, aftY);
    ctx.lineTo(w * 1.2, aftY + h * 0.05);
    ctx.lineTo(w * 1.2, aftY + h * 0.15);
    ctx.lineTo(w * 0.5, aftY + h * 0.12);
    ctx.stroke();
  });

  glow(ctx, 10, P.cream, () => {
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = P.cream;
    ctx.lineWidth = lw * 0.15;
    for(let i=0; i<8; i++) {
      ctx.beginPath();
      ctx.moveTo(-w * 1.5 + Math.random() * w * 3, baseY);
      ctx.lineTo(-w * 2.5 + Math.random() * w * 5, baseY + h * 0.08 + Math.random() * h * 0.05);
      ctx.stroke();
    }
  });

  ctx.restore();
}

// ── Star field ────────────────────────────────────────────────────────────
function drawStarField(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  count: number,
  rand: () => number
) {
  for (let i = 0; i < count; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const b = rand();

    if (b > 0.96) {
      const r = 1.2 + rand() * 0.8;
      const spikeLen = 5 + rand() * 6;
      glow(ctx, 7, P.cream, () => {
        ctx.fillStyle = P.cream;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = P.ca(0.6);
        ctx.lineWidth = 0.7;
        for (let d = 0; d < 4; d++) {
          const dx = Math.cos((d * Math.PI) / 2);
          const dy = Math.sin((d * Math.PI) / 2);
          ctx.beginPath();
          ctx.moveTo(x + dx * r, y + dy * r);
          ctx.lineTo(x + dx * (r + spikeLen), y + dy * (r + spikeLen));
          ctx.stroke();
        }
      });
    } else if (b > 0.82) {
      ctx.fillStyle = P.ca(0.55 + rand() * 0.3);
      ctx.beginPath();
      ctx.arc(x, y, 0.9, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      ctx.fillStyle = P.ga(0.18 + rand() * 0.2);
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

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
