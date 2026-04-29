// Named bright stars (mag ≤ 2.5), constellation lines, and deep-sky objects.
// RA in decimal degrees (0–360), Dec in degrees, mag = visual magnitude,
// sp = first letter of spectral class for colour tinting.

export interface Star {
  name: string;
  ra: number;
  dec: number;
  mag: number;
  sp: string;
}

// Top ~90 named stars, all with mag ≤ 2.5 (most), visible from northern latitudes
export const NAMED_STARS: Star[] = [
  { name: "Sirius",      ra: 101.287, dec: -16.716, mag: -1.46, sp: "A" },
  { name: "Arcturus",    ra: 213.915, dec:  19.182, mag: -0.05, sp: "K" },
  { name: "Vega",        ra: 279.235, dec:  38.784, mag:  0.03, sp: "A" },
  { name: "Capella",     ra:  79.172, dec:  45.998, mag:  0.08, sp: "G" },
  { name: "Rigel",       ra:  78.634, dec:  -8.202, mag:  0.12, sp: "B" },
  { name: "Procyon",     ra: 114.826, dec:   5.226, mag:  0.34, sp: "F" },
  { name: "Betelgeuse",  ra:  88.793, dec:   7.407, mag:  0.50, sp: "M" },
  { name: "Altair",      ra: 297.696, dec:   8.868, mag:  0.77, sp: "A" },
  { name: "Aldebaran",   ra:  68.980, dec:  16.509, mag:  0.85, sp: "K" },
  { name: "Antares",     ra: 247.352, dec: -26.432, mag:  0.96, sp: "M" },
  { name: "Spica",       ra: 201.298, dec: -11.161, mag:  1.04, sp: "B" },
  { name: "Pollux",      ra: 116.329, dec:  28.026, mag:  1.16, sp: "K" },
  { name: "Fomalhaut",   ra: 344.413, dec: -29.622, mag:  1.16, sp: "A" },
  { name: "Deneb",       ra: 310.358, dec:  45.280, mag:  1.25, sp: "A" },
  { name: "Regulus",     ra: 152.093, dec:  11.967, mag:  1.36, sp: "B" },
  { name: "Adhara",      ra: 104.656, dec: -28.972, mag:  1.50, sp: "B" },
  { name: "Castor",      ra: 113.649, dec:  31.889, mag:  1.58, sp: "A" },
  { name: "Bellatrix",   ra:  81.283, dec:   6.350, mag:  1.64, sp: "B" },
  { name: "Elnath",      ra:  81.573, dec:  28.608, mag:  1.65, sp: "B" },
  { name: "Alnilam",     ra:  84.053, dec:  -1.202, mag:  1.69, sp: "B" },
  { name: "Alnitak",     ra:  85.190, dec:  -1.943, mag:  1.74, sp: "O" },
  { name: "Alioth",      ra: 193.507, dec:  55.960, mag:  1.77, sp: "A" },
  { name: "Dubhe",       ra: 165.932, dec:  61.751, mag:  1.79, sp: "K" },
  { name: "Mirfak",      ra:  51.081, dec:  49.861, mag:  1.79, sp: "F" },
  { name: "Menkalinan",  ra:  89.882, dec:  44.948, mag:  1.90, sp: "A" },
  { name: "Alkaid",      ra: 206.885, dec:  49.313, mag:  1.86, sp: "B" },
  { name: "Alhena",      ra:  99.428, dec:  16.399, mag:  1.93, sp: "A" },
  { name: "Mirzam",      ra:  95.675, dec: -17.956, mag:  1.97, sp: "B" },
  { name: "Alphard",     ra: 141.896, dec:  -8.658, mag:  1.98, sp: "K" },
  { name: "Polaris",     ra:  37.954, dec:  89.264, mag:  2.02, sp: "F" },
  { name: "Hamal",       ra:  31.793, dec:  23.463, mag:  2.01, sp: "K" },
  { name: "Diphda",      ra:  10.897, dec: -17.987, mag:  2.04, sp: "K" },
  { name: "Nunki",       ra: 283.816, dec: -26.297, mag:  2.05, sp: "B" },
  { name: "Mirach",      ra:  17.433, dec:  35.621, mag:  2.07, sp: "M" },
  { name: "Kochab",      ra: 222.676, dec:  74.156, mag:  2.08, sp: "K" },
  { name: "Algol",       ra:  47.042, dec:  40.956, mag:  2.09, sp: "B" },
  { name: "Rasalhague",  ra: 263.734, dec:  12.560, mag:  2.08, sp: "A" },
  { name: "Alphecca",    ra: 233.672, dec:  26.715, mag:  2.23, sp: "A" },
  { name: "Sadr",        ra: 305.557, dec:  40.257, mag:  2.20, sp: "F" },
  { name: "Schedar",     ra:  10.127, dec:  56.537, mag:  2.24, sp: "K" },
  { name: "Mintaka",     ra:  83.002, dec:  -0.299, mag:  2.25, sp: "B" },
  { name: "Caph",        ra:   2.295, dec:  59.150, mag:  2.27, sp: "F" },
  { name: "Eltanin",     ra: 269.152, dec:  51.489, mag:  2.24, sp: "K" },
  { name: "Mizar",       ra: 200.981, dec:  54.926, mag:  2.27, sp: "A" },
  { name: "Dschubba",    ra: 240.083, dec: -22.622, mag:  2.29, sp: "B" },
  { name: "Denebola",    ra: 177.265, dec:  14.572, mag:  2.14, sp: "A" },
  { name: "Alpheratz",   ra:   2.097, dec:  29.091, mag:  2.07, sp: "B" },
  { name: "Aljanah",     ra: 311.553, dec:  33.970, mag:  2.48, sp: "K" },
  { name: "Enif",        ra: 326.046, dec:   9.875, mag:  2.38, sp: "K" },
  { name: "Scheat",      ra: 345.943, dec:  28.083, mag:  2.42, sp: "M" },
  { name: "Phecda",      ra: 178.457, dec:  53.695, mag:  2.44, sp: "A" },
  { name: "Markab",      ra: 346.190, dec:  15.205, mag:  2.49, sp: "B" },
  { name: "Merak",       ra: 165.460, dec:  56.383, mag:  2.37, sp: "A" },
  { name: "Alderamin",   ra: 319.645, dec:  62.585, mag:  2.44, sp: "A" },
  { name: "Sabik",       ra: 257.595, dec: -15.725, mag:  2.43, sp: "A" },
  { name: "Algieba",     ra: 154.993, dec:  19.841, mag:  2.61, sp: "K" },
  { name: "Almach",      ra:  30.975, dec:  42.330, mag:  2.10, sp: "K" },
  { name: "Kornephoros", ra: 247.555, dec:  21.490, mag:  2.77, sp: "G" },
  { name: "Izar",        ra: 221.247, dec:  27.074, mag:  2.37, sp: "K" },
  { name: "Muphrid",     ra: 208.671, dec:  18.398, mag:  2.68, sp: "G" },
  { name: "Albireo",     ra: 292.680, dec:  27.960, mag:  3.05, sp: "K" },
  { name: "Tarazed",     ra: 296.565, dec:  10.613, mag:  2.72, sp: "K" },
  { name: "Saiph",       ra:  86.939, dec:  -9.670, mag:  2.07, sp: "B" },
  { name: "Porrima",     ra: 190.415, dec:  -1.449, mag:  2.74, sp: "F" },
  { name: "Wezen",       ra: 107.098, dec: -26.393, mag:  1.83, sp: "F" },
  { name: "Aludra",      ra: 111.024, dec: -29.303, mag:  2.45, sp: "B" },
  { name: "Gomeisa",     ra: 111.788, dec:   8.289, mag:  2.90, sp: "B" },
  { name: "Mahasim",     ra:  89.930, dec:  37.213, mag:  2.62, sp: "A" },
  { name: "Hassaleh",    ra:  74.248, dec:  33.166, mag:  2.69, sp: "K" },
  { name: "Vindemiatrix",ra: 195.544, dec:  10.959, mag:  2.83, sp: "G" },
  { name: "Algenib",     ra:   3.309, dec:  15.183, mag:  2.83, sp: "B" },
  { name: "Sheratan",    ra:  28.660, dec:  20.808, mag:  2.66, sp: "A" },
  { name: "Zosma",       ra: 168.527, dec:  20.524, mag:  2.56, sp: "A" },
  { name: "Epsilon Leo", ra: 146.463, dec:  23.774, mag:  2.97, sp: "G" },
  { name: "Kaus Borealis",ra:276.993, dec: -25.421, mag:  2.81, sp: "K" },
  { name: "Kaus Media",  ra: 275.249, dec: -29.828, mag:  2.70, sp: "B" },
  { name: "Ascella",     ra: 285.653, dec: -29.880, mag:  2.59, sp: "A" },
  { name: "Han",         ra: 253.650, dec: -10.567, mag:  2.54, sp: "O" },
  { name: "Cor Caroli",  ra: 194.007, dec:  38.319, mag:  2.90, sp: "A" },
  { name: "Megrez",      ra: 183.857, dec:  57.032, mag:  3.32, sp: "A" },
  { name: "Gienah",      ra: 183.952, dec: -17.542, mag:  2.59, sp: "B" },
  { name: "Menkar",      ra:  45.570, dec:   4.090, mag:  2.54, sp: "M" },
  { name: "Cebalrai",    ra: 265.868, dec:   4.567, mag:  2.77, sp: "K" },
  { name: "Gamma Cas",   ra:  14.177, dec:  60.717, mag:  2.15, sp: "B" },
  { name: "Ruchbah",     ra:  21.454, dec:  60.235, mag:  2.66, sp: "A" },
  { name: "Pherkad",     ra: 230.182, dec:  71.834, mag:  3.05, sp: "A" },
];

// ─── Background star field (unlabeled dim stars, mag 2.5–5.0) ──────────────
// Compact: [ra_deg, dec_deg, mag] triples — a selection from BSC
export const BG_STARS: [number, number, number][] = [
  [28.38,19.29,3.88],[56.87,24.10,2.87],[130.82,18.15,3.94],[41.07,34.99,3.77],
  [42.67,53.50,2.93],[45.17,47.71,3.01],[56.57,40.01,2.89],[58.66,31.88,2.86],
  [74.25,33.17,2.69],[84.41,21.14,3.01],[59.46,12.49,3.47],[93.72,22.51,3.28],
  [95.74,22.51,2.86],[97.36,-23.83,3.87],[107.10,-26.39,1.83],[109.53,21.98,3.53],
  [120.16,43.19,3.79],[123.88,9.19,3.52],[124.13,7.33,3.91],[128.59,15.43,3.34],
  [130.05,21.47,4.66],[140.53,34.39,3.45],[146.46,23.77,2.97],[152.65,16.76,3.52],
  [154.17,23.42,3.44],[158.61,11.23,4.00],[161.69,5.95,3.85],[168.56,15.43,3.34],
  [169.62,15.43,3.34],[183.86,57.03,3.32],[184.98,56.38,3.01],[190.38,-48.96,2.20],
  [193.90,3.40,3.38],[200.98,54.93,2.27],[204.37,36.36,3.57],[209.56,18.36,3.65],
  [211.67,-36.37,2.06],[218.88,53.69,3.01],[220.48,-47.39,2.29],[221.25,27.07,2.37],
  [224.63,-43.13,1.91],[228.49,6.43,3.46],[232.71,-26.41,3.64],[233.88,30.93,3.92],
  [240.38,-19.80,2.50],[241.36,19.15,3.75],[244.58,-3.71,3.24],[246.00,19.15,3.75],
  [246.36,38.92,3.53],[247.56,31.60,2.81],[249.29,-42.36,4.01],[251.97,82.04,4.35],
  [252.54,-34.29,2.29],[253.08,-38.05,3.04],[258.66,14.39,3.46],[262.69,-37.30,3.33],
  [264.33,-42.99,1.87],[265.87,4.57,2.77],[269.06,51.49,3.84],[270.19,2.71,3.34],
  [271.45,28.76,3.26],[274.41,-36.76,3.17],[276.04,-34.38,1.85],[278.80,26.30,3.26],
  [282.52,33.36,3.52],[283.11,-27.67,3.17],[284.74,32.69,3.24],[285.65,-29.88,2.59],
  [286.35,-4.88,3.44],[287.44,-21.74,3.58],[288.44,67.66,3.57],[290.00,-20.66,3.97],
  [290.72,-27.67,3.32],[292.68,27.96,3.05],[296.10,13.86,2.99],[296.24,45.13,2.86],
  [296.48,3.11,3.36],[298.83,6.41,3.71],[299.76,-0.82,3.23],[302.23,24.67,3.94],
  [305.22,14.11,3.84],[306.41,-56.74,1.94],[311.55,33.97,2.48],[319.64,62.59,2.44],
  [322.89,-5.57,2.90],[326.05,9.88,2.38],[331.45,-0.32,2.96],[332.06,-46.96,1.74],
  [334.21,56.12,3.45],[340.67,-46.88,2.11],[341.67,12.17,3.49],[342.51,30.22,2.95],
  [348.58,-7.78,3.69],[350.16,-20.10,3.74],[353.14,-37.82,3.47],[355.93,-17.82,3.81],
  [14.18,60.72,2.15],[21.45,60.24,2.66],[28.60,63.67,3.38],[47.04,40.96,2.09],
  [51.08,49.86,1.79],[83.18,-17.82,2.58],[86.94,-9.67,2.07],[89.88,44.95,1.90],
  [103.20,33.96,3.60],[111.02,-29.30,2.45],[138.30,-69.72,1.68],[141.90,-8.66,1.98],
];

// ─── Constellation polylines [ra_deg, dec_deg][] ──────────────────────────

type Pt = [number, number];

export interface Constellation { name: string; lines: Pt[][] }

export const CONSTELLATIONS: Constellation[] = [
  {
    name: "Orion",
    lines: [
      [[88.79,7.41],[81.28,6.35]],             // shoulders
      [[88.79,7.41],[85.19,-1.94]],             // right shoulder → belt
      [[81.28,6.35],[83.00,-0.30]],             // left shoulder → belt
      [[83.00,-0.30],[84.05,-1.20],[85.19,-1.94]], // belt
      [[85.19,-1.94],[86.94,-9.67]],            // belt → saiph
      [[83.00,-0.30],[78.63,-8.20]],            // belt → rigel
      [[78.63,-8.20],[86.94,-9.67]],            // feet
    ],
  },
  {
    name: "Ursa Major",
    lines: [
      [[165.93,61.75],[165.46,56.38],[178.46,53.70],[183.86,57.03],
       [193.51,55.96],[200.98,54.93],[206.89,49.31]],  // Big Dipper bowl+handle
      [[165.93,61.75],[183.86,57.03]],          // Dubhe–Megrez
    ],
  },
  {
    name: "Ursa Minor",
    lines: [
      [[37.95,89.26],[231.44,86.59],[251.97,82.04],[222.68,74.16],[230.18,71.84]],
      [[222.68,74.16],[231.44,86.59]],
    ],
  },
  {
    name: "Cassiopeia",
    lines: [
      [[2.30,59.15],[10.13,56.54],[14.18,60.72],[21.45,60.24],[28.60,63.67]],
    ],
  },
  {
    name: "Perseus",
    lines: [
      [[51.08,49.86],[47.04,40.96]],
      [[51.08,49.86],[42.67,53.50]],
      [[51.08,49.86],[45.17,47.71],[56.57,40.01],[58.66,31.88]],
    ],
  },
  {
    name: "Auriga",
    lines: [
      [[79.17,45.99],[89.88,44.95],[89.93,37.21],[74.25,33.17],[79.17,45.99]],
      [[74.25,33.17],[81.57,28.61]],  // share with Taurus (Elnath)
    ],
  },
  {
    name: "Taurus",
    lines: [
      [[68.98,16.51],[81.57,28.61]],  // Aldebaran to Elnath
      [[68.98,16.51],[84.41,21.14]],  // Aldebaran to Zeta Tau (other horn)
      [[56.87,24.10],[68.98,16.51]],  // Pleiades direction to Aldebaran
    ],
  },
  {
    name: "Gemini",
    lines: [
      [[113.65,31.89],[109.53,21.98],[99.43,16.40]],   // Castor line
      [[116.33,28.03],[95.74,22.51],[93.72,22.51]],    // Pollux line
      [[113.65,31.89],[116.33,28.03]],                  // head bar
    ],
  },
  {
    name: "Leo",
    lines: [
      [[152.09,11.97],[154.99,19.84],[168.53,20.52],[177.27,14.57]], // body
      [[152.09,11.97],[152.65,16.76],[146.46,23.77]],  // sickle
      [[154.99,19.84],[152.65,16.76]],
    ],
  },
  {
    name: "Virgo",
    lines: [
      [[201.30,-11.16],[200.98,-0.60],[190.42,-1.45],[193.90,3.40],[195.54,10.96]],
    ],
  },
  {
    name: "Boötes",
    lines: [
      [[213.92,19.18],[208.67,18.40]],
      [[213.92,19.18],[221.25,27.07],[217.93,38.31],[225.49,40.39]],
      [[221.25,27.07],[233.88,30.93]],
    ],
  },
  {
    name: "Corona Borealis",
    lines: [
      [[233.67,26.72],[228.49,6.43],[240.38,-19.80]],  // simplified arc
    ],
  },
  {
    name: "Scorpius",
    lines: [
      [[240.38,-19.80],[240.08,-22.62],[247.35,-26.43],[245.30,-25.59],
       [248.97,-28.22],[252.54,-34.29],[253.08,-38.05],[263.40,-37.10]],
    ],
  },
  {
    name: "Sagittarius",
    lines: [
      [[275.25,-29.83],[276.99,-25.42],[283.82,-26.30],[285.65,-29.88],
       [283.11,-27.67],[275.25,-29.83]],   // teapot body
      [[276.04,-34.38],[275.25,-29.83]],   // spout bottom
    ],
  },
  {
    name: "Ophiuchus",
    lines: [
      [[263.73,12.56],[265.87,4.57],[257.60,-15.73]],
      [[257.60,-15.73],[244.58,-3.71],[243.59,-3.69],[263.73,12.56]],
    ],
  },
  {
    name: "Hercules",
    lines: [
      [[247.56,21.49],[247.55,31.60],[246.36,38.92]],
      [[247.56,21.49],[239.74,24.84]],
    ],
  },
  {
    name: "Cygnus",
    lines: [
      [[310.36,45.28],[305.56,40.26],[292.68,27.96]],  // long axis
      [[296.24,45.13],[305.56,40.26],[311.55,33.97]],  // cross
    ],
  },
  {
    name: "Lyra",
    lines: [
      [[279.23,38.78],[282.52,33.36],[284.74,32.69],[279.23,38.78]],
    ],
  },
  {
    name: "Aquila",
    lines: [
      [[296.56,10.61],[297.70,8.87],[298.83,6.41]],   // bar
      [[297.70,8.87],[296.10,13.86]],
      [[297.70,8.87],[299.76,-0.82],[286.35,-4.88]],  // body down
    ],
  },
  {
    name: "Pegasus",
    lines: [
      [[346.19,15.21],[345.94,28.08],[2.10,29.09],[3.31,15.18],[346.19,15.21]], // Great Square
      [[346.19,15.21],[326.05,9.88]],  // nose
    ],
  },
  {
    name: "Andromeda",
    lines: [
      [[2.10,29.09],[17.43,35.62],[30.97,42.33]],
    ],
  },
  {
    name: "Canis Major",
    lines: [
      [[95.68,-17.96],[101.29,-16.72],[107.10,-26.39],[104.66,-28.97],[111.02,-29.30]],
      [[101.29,-16.72],[107.10,-26.39]],
    ],
  },
  {
    name: "Canis Minor",
    lines: [
      [[111.79,8.29],[114.83,5.23]],
    ],
  },
  {
    name: "Aries",
    lines: [
      [[31.79,23.46],[28.66,20.81],[28.38,19.29]],
    ],
  },
];

// ─── Deep-sky objects ─────────────────────────────────────────────────────

export interface DSO {
  name: string;
  ra: number;
  dec: number;
  mag: number;
  type: "galaxy" | "cluster" | "nebula";
}

export const DSO_OBJECTS: DSO[] = [
  { name: "Andromeda Galaxy", ra:  10.685, dec: 41.269, mag: 3.4, type: "galaxy"  },
  { name: "Pleiades",         ra:  56.750, dec: 24.117, mag: 1.6, type: "cluster" },
  { name: "Orion Nebula",     ra:  83.822, dec: -5.391, mag: 4.0, type: "nebula"  },
  { name: "Beehive",          ra: 130.052, dec: 19.983, mag: 3.7, type: "cluster" },
  { name: "Hercules Cluster", ra: 250.423, dec: 36.460, mag: 5.8, type: "cluster" },
  { name: "Double Cluster",   ra:  34.750, dec: 57.133, mag: 4.3, type: "cluster" },
  { name: "Hyades",           ra:  66.750, dec: 15.867, mag: 0.5, type: "cluster" },
];

// Planet display properties
export const PLANET_STYLES: Record<string, { color: string; radius: number }> = {
  Mercury: { color: "#b0b0c0", radius: 4 },
  Venus:   { color: "#ffe8b0", radius: 6 },
  Mars:    { color: "#ff7755", radius: 5 },
  Jupiter: { color: "#f0d8a0", radius: 8 },
  Saturn:  { color: "#e8d090", radius: 7 },
  Uranus:  { color: "#a0e0e8", radius: 5 },
  Neptune: { color: "#8090f0", radius: 4 },
};
