// Astronomical coordinate math — no external dependencies.
// Accuracy: stars exact, planets ±1–2°, Moon ±1°. Fine for visualization.

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function wrapTo360(angle: number) { return ((angle % 360) + 360) % 360; }
function wrapTo180(angle: number) { const wrapped = wrapTo360(angle); return wrapped > 180 ? wrapped - 360 : wrapped; }

export function julianDate(date: Date): number {
  return date.getTime() / 86_400_000 + 2_440_587.5;
}

// Days since J2000.0
function daysSinceJ2000(date: Date) { return julianDate(date) - 2_451_545.0; }

// Greenwich Mean Sidereal Time in degrees
function greenwichMeanSiderealTimeDeg(date: Date): number {
  const julianCenturies = daysSinceJ2000(date) / 36_525;
  return wrapTo360(280.46061837 + 360.98564736629 * daysSinceJ2000(date) + julianCenturies * julianCenturies * 0.000387933);
}

// Local Sidereal Time in degrees
export function localSiderealTimeDeg(date: Date, lonDeg: number): number {
  return wrapTo360(greenwichMeanSiderealTimeDeg(date) + lonDeg);
}

// Solve Kepler's equation M = E - e*sin(E) iteratively
function solveKeplerEquation(meanAnomalyDeg: number, eccentricity: number): number {
  let eccentricAnomalyRad = meanAnomalyDeg * DEG_TO_RAD;
  for (let i = 0; i < 10; i++) eccentricAnomalyRad = meanAnomalyDeg * DEG_TO_RAD + eccentricity * Math.sin(eccentricAnomalyRad);
  return eccentricAnomalyRad;
}

// Ecliptic (λ,β in degrees) → equatorial (RA,Dec in degrees)
function eclipticToEquatorial(longitudeDeg: number, latitudeDeg: number, obliquityDeg: number): { ra: number; dec: number } {
  const lonRad = longitudeDeg * DEG_TO_RAD;
  const latRad = latitudeDeg  * DEG_TO_RAD;
  const oblRad = obliquityDeg * DEG_TO_RAD;
  const sinDec = Math.sin(latRad) * Math.cos(oblRad) + Math.cos(latRad) * Math.sin(oblRad) * Math.sin(lonRad);
  const dec = Math.asin(Math.max(-1, Math.min(1, sinDec))) * RAD_TO_DEG;
  const y = Math.sin(lonRad) * Math.cos(oblRad) - Math.tan(latRad) * Math.sin(oblRad);
  const x = Math.cos(lonRad);
  const ra = wrapTo360(Math.atan2(y, x) * RAD_TO_DEG);
  return { ra, dec };
}

// Keplerian orbital elements at J2000 + per-century rates
// Source: Standish (1992) / JPL Approximate Positions of the Planets
const ELEMENTS: Record<string, [number, number, number, number, number, number, number, number, number, number, number, number]> = {
  //          a0          da           e0          de            i0           di
  //          L0          dL           w0          dw            N0           dN
  Mercury: [0.38709927,  3.7e-7,   0.20563593,  1.906e-5,   7.00497902, -5.94749e-3,
            252.25032350, 149472.67411175, 77.45779628,  1.6048e-1, 48.33076593, -1.2534e-1],
  Venus:   [0.72333566,  3.9e-6,   0.00677672, -4.107e-5,   3.39467605, -7.889e-4,
            181.97909950,  58517.81538729,131.60246718,  2.683e-3, 76.67984255, -2.777e-1],
  Earth:   [1.00000261,  5.62e-6,  0.01671123, -4.392e-5,  -1.531e-5,  -1.2947e-2,
            100.46457166,  35999.37244981,102.93768193,  3.233e-1,  0.0,         0.0],
  Mars:    [1.52371034,  1.847e-5, 0.09339410,  7.882e-5,   1.84969142, -8.131e-3,
            -4.55343205,  19140.30268499, -23.94362959,  4.444e-1, 49.55953891, -2.926e-1],
  Jupiter: [5.20288700, -1.161e-4, 0.04838624, -1.325e-4,   1.30439695, -1.837e-3,
             34.39644051,  3034.74612775,  14.72847983,  2.125e-1,100.47390909,  2.047e-1],
  Saturn:  [9.53667594, -1.251e-3, 0.05386179, -5.099e-4,   2.48599187,  1.936e-3,
             49.95424423,  1222.49362201,  92.59887831, -4.190e-1,113.66242448, -2.887e-1],
  Uranus:  [19.18916464,-1.962e-3, 0.04725744, -4.397e-5,   0.77263783, -2.429e-3,
            313.23810451,   428.48202785, 170.95427630,  4.081e-1, 74.01692503,  4.241e-2],
  Neptune: [30.06992276, 2.629e-4, 0.00859048,  5.105e-5,   1.77004347,  3.537e-4,
            -55.12002969,   218.45945325,  44.96476227, -3.224e-1,131.78422574, -5.087e-3],
};

export interface EquatorialCoord { ra: number; dec: number }

function computeHeliocentricEcliptic(julianCenturies: number, orbitalElements: number[]): [number, number, number] {
  const [a0, da, e0, de, i0, di, L0, dL, w0, dw, N0, dN] = orbitalElements;
  const semiMajorAxisAU            = a0 + da * julianCenturies;
  const eccentricity               = e0 + de * julianCenturies;
  const inclinationRad             = (i0 + di * julianCenturies) * DEG_TO_RAD;
  const meanLongitudeDeg           = wrapTo360(L0 + dL * julianCenturies);
  const perihelionLongitudeDeg     = wrapTo360(w0 + dw * julianCenturies);
  const ascendingNodeLongitudeDeg  = wrapTo360(N0 + dN * julianCenturies);
  const meanAnomalyDeg             = wrapTo360(meanLongitudeDeg - perihelionLongitudeDeg);
  const eccentricAnomalyRad        = solveKeplerEquation(meanAnomalyDeg, eccentricity);
  const trueAnomalyDeg = 2 * Math.atan2(
    Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomalyRad / 2),
    Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomalyRad / 2),
  ) * RAD_TO_DEG;
  const radiusVectorAU            = semiMajorAxisAU * (1 - eccentricity * Math.cos(eccentricAnomalyRad));
  const argOfPerihelionRad        = (perihelionLongitudeDeg - ascendingNodeLongitudeDeg) * DEG_TO_RAD;
  const trueAnomalyFromNodeRad    = trueAnomalyDeg * DEG_TO_RAD + argOfPerihelionRad;
  const nodeRad = ascendingNodeLongitudeDeg * DEG_TO_RAD;
  const helioX = radiusVectorAU * (Math.cos(nodeRad) * Math.cos(trueAnomalyFromNodeRad) - Math.sin(nodeRad) * Math.sin(trueAnomalyFromNodeRad) * Math.cos(inclinationRad));
  const helioY = radiusVectorAU * (Math.sin(nodeRad) * Math.cos(trueAnomalyFromNodeRad) + Math.cos(nodeRad) * Math.sin(trueAnomalyFromNodeRad) * Math.cos(inclinationRad));
  const helioZ = radiusVectorAU * Math.sin(inclinationRad) * Math.sin(trueAnomalyFromNodeRad);
  return [helioX, helioY, helioZ];
}

export function planetPosition(name: keyof typeof ELEMENTS, date: Date): EquatorialCoord {
  const julianCenturies = daysSinceJ2000(date) / 36_525;
  const obliquityDeg = 23.4393 - 3.563e-7 * daysSinceJ2000(date);
  const [planetHelioX, planetHelioY, planetHelioZ] = computeHeliocentricEcliptic(julianCenturies, ELEMENTS[name]);
  const [earthHelioX,  earthHelioY,  earthHelioZ]  = computeHeliocentricEcliptic(julianCenturies, ELEMENTS.Earth);
  const geocentricX = planetHelioX - earthHelioX;
  const geocentricY = planetHelioY - earthHelioY;
  const geocentricZ = planetHelioZ - earthHelioZ;
  const eclipticLongitudeDeg  = Math.atan2(geocentricY, geocentricX) * RAD_TO_DEG;
  const geocentricDistanceAU  = Math.sqrt(geocentricX * geocentricX + geocentricY * geocentricY + geocentricZ * geocentricZ);
  const eclipticLatitudeDeg   = Math.asin(geocentricZ / geocentricDistanceAU) * RAD_TO_DEG;
  return eclipticToEquatorial(wrapTo360(eclipticLongitudeDeg), eclipticLatitudeDeg, obliquityDeg);
}

export function moonPosition(date: Date): EquatorialCoord {
  const daysSinceEpoch           = daysSinceJ2000(date);
  const moonMeanLongitudeDeg     = wrapTo360(218.316 + 13.176396 * daysSinceEpoch);
  const moonMeanAnomalyDeg       = wrapTo360(134.963 + 13.064993 * daysSinceEpoch);
  const moonArgOfLatitudeDeg     = wrapTo360(93.272  + 13.229350 * daysSinceEpoch);
  const moonEclipticLongitudeDeg = moonMeanLongitudeDeg
    + 6.289 * Math.sin(moonMeanAnomalyDeg   * DEG_TO_RAD)
    - 1.274 * Math.sin((moonMeanAnomalyDeg - 2 * moonArgOfLatitudeDeg) * DEG_TO_RAD)
    + 0.658 * Math.sin(2 * moonArgOfLatitudeDeg * DEG_TO_RAD)
    - 0.186 * Math.sin(/* sun mean anomaly */ (357.529 + 0.985600 * daysSinceEpoch) * DEG_TO_RAD);
  const moonEclipticLatitudeDeg  = 5.128 * Math.sin(moonArgOfLatitudeDeg * DEG_TO_RAD)
    + 0.280 * Math.sin((moonMeanAnomalyDeg + moonArgOfLatitudeDeg) * DEG_TO_RAD)
    - 0.278 * Math.sin((moonMeanAnomalyDeg - moonArgOfLatitudeDeg) * DEG_TO_RAD)
    - 0.173 * Math.sin((2 * moonArgOfLatitudeDeg - moonMeanAnomalyDeg) * DEG_TO_RAD);
  const obliquityDeg = 23.4393 - 3.563e-7 * daysSinceEpoch;
  return eclipticToEquatorial(wrapTo360(moonEclipticLongitudeDeg), moonEclipticLatitudeDeg, obliquityDeg);
}

// Returns Moon phase angle 0-360 (0=new, 180=full)
export function moonPhase(date: Date): number {
  const daysSinceEpoch       = daysSinceJ2000(date);
  const moonMeanLongitudeDeg = wrapTo360(218.316 + 13.176396 * daysSinceEpoch);
  const sunMeanLongitudeDeg  = wrapTo360(280.459 +  0.985600 * daysSinceEpoch);
  return wrapTo360(moonMeanLongitudeDeg - sunMeanLongitudeDeg);
}

export function sunPosition(date: Date): EquatorialCoord {
  const daysSinceEpoch       = daysSinceJ2000(date);
  const sunMeanLongitudeDeg  = wrapTo360(280.459 + 0.985600 * daysSinceEpoch);
  const sunMeanAnomalyDeg    = wrapTo360(357.529 + 0.985600 * daysSinceEpoch);
  const eclipticLongitudeDeg = sunMeanLongitudeDeg
    + 1.915 * Math.sin(sunMeanAnomalyDeg * DEG_TO_RAD)
    + 0.020 * Math.sin(2 * sunMeanAnomalyDeg * DEG_TO_RAD);
  const obliquityDeg = 23.4393 - 3.563e-7 * daysSinceEpoch;
  return eclipticToEquatorial(wrapTo360(eclipticLongitudeDeg), 0, obliquityDeg);
}

// RA/Dec (degrees) + observer position → altitude/azimuth (degrees)
export function raDecToAltAz(ra: number, dec: number, lat: number, lstDeg: number) {
  const hourAngleRad  = wrapTo360(lstDeg - ra) * DEG_TO_RAD;
  const declinationRad = dec * DEG_TO_RAD;
  const latitudeRad    = lat * DEG_TO_RAD;
  const sinAlt = Math.sin(declinationRad) * Math.sin(latitudeRad) + Math.cos(declinationRad) * Math.cos(latitudeRad) * Math.cos(hourAngleRad);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * RAD_TO_DEG;
  const cosAlt = Math.cos(alt * DEG_TO_RAD);
  if (cosAlt < 1e-10) return { alt, az: 0 };
  const sinAz = (-Math.cos(declinationRad) * Math.sin(hourAngleRad)) / cosAlt;
  const cosAz = (Math.sin(declinationRad) - Math.sin(latitudeRad) * sinAlt) / (Math.cos(latitudeRad) * cosAlt);
  const az = wrapTo360(Math.atan2(sinAz, cosAz) * RAD_TO_DEG);
  return { alt, az };
}

// Azimuthal equidistant projection — zenith at center, horizon at edge
// azimuth: 0=N up, 90=E right
export function project(alt: number, az: number, centerX: number, centerY: number, skyRadius: number): [number, number] {
  const radialDistance = (1 - alt / 90) * skyRadius;
  const azimuthRad = az * DEG_TO_RAD;
  return [centerX + radialDistance * Math.sin(azimuthRad), centerY - radialDistance * Math.cos(azimuthRad)];
}
