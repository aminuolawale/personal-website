// Astronomical coordinate math — no external dependencies.
// Accuracy: stars exact, planets ±1–2°, Moon ±1°. Fine for visualization.

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

function norm360(x: number) { return ((x % 360) + 360) % 360; }
function norm180(x: number) { const n = norm360(x); return n > 180 ? n - 360 : n; }

export function julianDate(d: Date): number {
  return d.getTime() / 86_400_000 + 2_440_587.5;
}

// Days since J2000.0
function j2000(d: Date) { return julianDate(d) - 2_451_545.0; }

// Greenwich Mean Sidereal Time in degrees
function gmst(d: Date): number {
  const t = j2000(d) / 36_525;
  return norm360(280.46061837 + 360.98564736629 * j2000(d) + t * t * 0.000387933);
}

// Local Sidereal Time in degrees
export function lst(d: Date, lonDeg: number): number {
  return norm360(gmst(d) + lonDeg);
}

// Solve Kepler's equation M = E - e*sin(E) iteratively
function solveKepler(M_deg: number, e: number): number {
  let E = M_deg * DEG;
  for (let i = 0; i < 10; i++) E = M_deg * DEG + e * Math.sin(E);
  return E;
}

// Ecliptic (λ,β in degrees) → equatorial (RA,Dec in degrees)
function eclToEq(lam: number, bet: number, eps: number): { ra: number; dec: number } {
  const la = lam * DEG, be = bet * DEG, ep = eps * DEG;
  const sinDec = Math.sin(be) * Math.cos(ep) + Math.cos(be) * Math.sin(ep) * Math.sin(la);
  const dec = Math.asin(Math.max(-1, Math.min(1, sinDec))) * RAD;
  const y = Math.sin(la) * Math.cos(ep) - Math.tan(be) * Math.sin(ep);
  const x = Math.cos(la);
  const ra = norm360(Math.atan2(y, x) * RAD);
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

function heliocentricEcliptic(T: number, els: number[]): [number, number, number] {
  const [a0, da, e0, de, i0, di, L0, dL, w0, dw, N0, dN] = els;
  const a = a0 + da * T;
  const e = e0 + de * T;
  const i = (i0 + di * T) * DEG;
  const L = norm360(L0 + dL * T);
  const w = norm360(w0 + dw * T);
  const N = norm360(N0 + dN * T);
  const M = norm360(L - w);
  const E = solveKepler(M, e);
  const v = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2)) * RAD;
  const r = a * (1 - e * Math.cos(E));
  const wp = (w - N) * DEG;
  const vr = (v + wp);
  const x = r * (Math.cos(N * DEG) * Math.cos(vr) - Math.sin(N * DEG) * Math.sin(vr) * Math.cos(i));
  const y = r * (Math.sin(N * DEG) * Math.cos(vr) + Math.cos(N * DEG) * Math.sin(vr) * Math.cos(i));
  const z = r * Math.sin(i) * Math.sin(vr);
  return [x, y, z];
}

export function planetPosition(name: keyof typeof ELEMENTS, date: Date): EquatorialCoord {
  const T = j2000(date) / 36_525;
  const eps = 23.4393 - 3.563e-7 * j2000(date);
  const [xp, yp, zp] = heliocentricEcliptic(T, ELEMENTS[name]);
  const [xe, ye, ze] = heliocentricEcliptic(T, ELEMENTS.Earth);
  const dx = xp - xe, dy = yp - ye, dz = zp - ze;
  const lam = Math.atan2(dy, dx) * RAD;
  const r   = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const bet = Math.asin(dz / r) * RAD;
  return eclToEq(norm360(lam), bet, eps);
}

export function moonPosition(date: Date): EquatorialCoord {
  const d = j2000(date);
  const L = norm360(218.316 + 13.176396 * d);
  const M = norm360(134.963 + 13.064993 * d);
  const F = norm360(93.272  + 13.229350 * d);
  const lam = L + 6.289 * Math.sin(M * DEG) - 1.274 * Math.sin((M - 2 * F) * DEG)
                + 0.658 * Math.sin(2 * F * DEG) - 0.186 * Math.sin(/* sun M */ (357.529 + 0.985600 * d) * DEG);
  const bet = 5.128 * Math.sin(F * DEG) + 0.280 * Math.sin((M + F) * DEG)
            - 0.278 * Math.sin((M - F) * DEG) - 0.173 * Math.sin((2 * F - M) * DEG);
  const eps = 23.4393 - 3.563e-7 * d;
  return eclToEq(norm360(lam), bet, eps);
}

// Returns Moon phase angle 0-360 (0=new, 180=full)
export function moonPhase(date: Date): number {
  const d = j2000(date);
  const Lmoon = norm360(218.316 + 13.176396 * d);
  const Lsun  = norm360(280.459 + 0.985600 * d);
  return norm360(Lmoon - Lsun);
}

export function sunPosition(date: Date): EquatorialCoord {
  const d = j2000(date);
  const L = norm360(280.459 + 0.985600 * d);
  const M = norm360(357.529 + 0.985600 * d);
  const lam = L + 1.915 * Math.sin(M * DEG) + 0.020 * Math.sin(2 * M * DEG);
  const eps = 23.4393 - 3.563e-7 * d;
  return eclToEq(norm360(lam), 0, eps);
}

// RA/Dec (degrees) + observer position → altitude/azimuth (degrees)
export function raDecToAltAz(ra: number, dec: number, lat: number, lstDeg: number) {
  const ha  = norm360(lstDeg - ra) * DEG;
  const d   = dec * DEG;
  const phi = lat * DEG;
  const sinAlt = Math.sin(d) * Math.sin(phi) + Math.cos(d) * Math.cos(phi) * Math.cos(ha);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * RAD;
  const cosAlt = Math.cos(alt * DEG);
  if (cosAlt < 1e-10) return { alt, az: 0 };
  const sinAz = (-Math.cos(d) * Math.sin(ha)) / cosAlt;
  const cosAz = (Math.sin(d) - Math.sin(phi) * sinAlt) / (Math.cos(phi) * cosAlt);
  const az = norm360(Math.atan2(sinAz, cosAz) * RAD);
  return { alt, az };
}

// Azimuthal equidistant projection — zenith at center, horizon at edge
// azimuth: 0=N up, 90=E right
export function project(alt: number, az: number, cx: number, cy: number, R: number): [number, number] {
  const r = (1 - alt / 90) * R;
  const a = az * DEG;
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
}
