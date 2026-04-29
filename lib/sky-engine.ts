import { localSiderealTimeDeg, raDecToAltAz, planetPosition, moonPosition, moonPhase } from "@/lib/sky-math";
import { NAMED_STARS, BG_STARS, CONSTELLATIONS, DSO_OBJECTS, PLANET_STYLES } from "@/lib/sky-data";

export const DEG_TO_RAD = Math.PI / 180;

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
function starDisplayRadius(mag: number) { return Math.max(0.4, 3.2 - mag * 0.65); }
function circularMeanAzimuth(azimuths: number[]): number {
  const sinSum = azimuths.reduce((acc, az) => acc + Math.sin(az * DEG_TO_RAD), 0);
  const cosSum = azimuths.reduce((acc, az) => acc + Math.cos(az * DEG_TO_RAD), 0);
  return ((Math.atan2(sinSum, cosSum) / DEG_TO_RAD) + 360) % 360;
}

export function compute(date: Date, lat: number, lon: number): Computed {
  const lstDeg = localSiderealTimeDeg(date, lon);
  function computeSkyPosition(ra: number, dec: number): SkyPos | null {
    const { alt, az } = raDecToAltAz(ra, dec, lat, lstDeg);
    return alt < 0 ? null : { alt, az };
  }

  const stars: Computed["stars"] = NAMED_STARS.flatMap((star) => {
    const pos = computeSkyPosition(star.ra, star.dec);
    return pos ? [{ ...pos, r: starDisplayRadius(star.mag), sp: star.sp, name: star.name, mag: star.mag }] : [];
  });
  for (const [ra, dec, mag] of BG_STARS) {
    const pos = computeSkyPosition(ra, dec);
    if (pos) stars.push({ ...pos, r: starDisplayRadius(mag), sp: "A", mag });
  }

  const constellations: ConstellationInfo[] = CONSTELLATIONS.map((constellation) => {
    const segments: [SkyPos, SkyPos][] = [];
    const visiblePoints: SkyPos[] = [];
    for (const poly of constellation.lines) {
      for (let i = 0; i < poly.length - 1; i++) {
        const startPos = computeSkyPosition(poly[i][0],     poly[i][1]);
        const endPos   = computeSkyPosition(poly[i + 1][0], poly[i + 1][1]);
        if (startPos && endPos) { segments.push([startPos, endPos]); visiblePoints.push(startPos, endPos); }
      }
    }
    const centroid: SkyPos | null = visiblePoints.length
      ? {
          alt: visiblePoints.reduce((sum, pos) => sum + pos.alt, 0) / visiblePoints.length,
          az:  circularMeanAzimuth(visiblePoints.map((pos) => pos.az)),
        }
      : null;
    return { name: constellation.name, visible: segments.length > 0, segs: segments, centroid };
  });

  const dso = DSO_OBJECTS.flatMap((object) => {
    const pos = computeSkyPosition(object.ra, object.dec);
    return pos ? [{ ...pos, name: object.name, type: object.type, mag: object.mag }] : [];
  });

  const planets = PLANET_NAMES.flatMap((name) => {
    try {
      const { ra, dec } = planetPosition(name, date);
      const pos = computeSkyPosition(ra, dec);
      if (!pos) return [];
      return [{ ...pos, name, radius: PLANET_STYLES[name].radius }];
    } catch { return []; }
  });

  const { ra: moonRa, dec: moonDec } = moonPosition(date);
  const moonPos = computeSkyPosition(moonRa, moonDec);
  return {
    stars, constellations, dso, planets,
    moon: moonPos ? { ...moonPos, phase: moonPhase(date) } : null,
    date,
  };
}
