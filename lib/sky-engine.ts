import { lst, raDecToAltAz, planetPosition, moonPosition, moonPhase } from "@/lib/sky-math";
import { NAMED_STARS, BG_STARS, CONSTELLATIONS, DSO_OBJECTS, PLANET_STYLES } from "@/lib/sky-data";

export const DEG = Math.PI / 180;

export interface SkyPos { alt: number; az: number }

export interface ConstellationInfo {
  name: string;
  visible: boolean;
  segs: [SkyPos, SkyPos][];
  centroid: SkyPos | null;
}

export interface Computed {
  stars:          (SkyPos & { r: number; sp: string; name?: string; mag: number })[];
  constellations: ConstellationInfo[];
  dso:            (SkyPos & { name: string; type: string; mag: number })[];
  planets:        (SkyPos & { name: string; radius: number })[];
  moon:           (SkyPos & { phase: number }) | null;
  date:           Date;
}

export function midnightTonight(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

const PLANET_NAMES = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"] as const;
function starRadius(mag: number) { return Math.max(0.4, 3.2 - mag * 0.65); }
function circularMeanAz(azimuths: number[]): number {
  const s = azimuths.reduce((a, v) => a + Math.sin(v * DEG), 0);
  const c = azimuths.reduce((a, v) => a + Math.cos(v * DEG), 0);
  return ((Math.atan2(s, c) / DEG) + 360) % 360;
}

export function compute(date: Date, lat: number, lon: number): Computed {
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
  return {
    stars, constellations, dso, planets,
    moon: mp ? { ...mp, phase: moonPhase(date) } : null,
    date,
  };
}
