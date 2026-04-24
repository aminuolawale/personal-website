import { colorPalette } from "./utils";

export interface CelestialData {
  id: string;
  category: "galaxy" | "nebula" | "planet" | "comet" | "blackhole";
  name: string;
  type: string;
  summary: string;
  imageUrl: string;
  traits: any;
}

export const CELESTIAL_CATALOG: Record<string, CelestialData[]> = {
  galaxy: [
    { id: "m31", category: "galaxy", name: "Andromeda Galaxy (M31)", type: "Spiral Galaxy", summary: "The closest major galaxy to the Milky Way, approximately 2.5 million light-years away.", imageUrl: "/celestial/m31.jpg", traits: { tilt: 0.4, core: colorPalette.cream, arm: colorPalette.gold } },
    { id: "m51", category: "galaxy", name: "Whirlpool Galaxy (M51)", type: "Spiral Galaxy", summary: "An interacting grand-design spiral galaxy located in the constellation Canes Venatici.", imageUrl: "/celestial/m51.jpg", traits: { tilt: 1.0, core: colorPalette.cream, arm: colorPalette.orange } },
    { id: "m104", category: "galaxy", name: "Sombrero Galaxy (M104)", type: "Spiral Galaxy", summary: "A peculiar galaxy characterized by its bright nucleus, unusually large central bulge, and prominent dust lane.", imageUrl: "/celestial/m104.jpg", traits: { tilt: 0.15, dustLane: true, core: colorPalette.cream, arm: colorPalette.gold } },
    { id: "m101", category: "galaxy", name: "Pinwheel Galaxy (M101)", type: "Spiral Galaxy", summary: "A face-on spiral galaxy distanced 21 million light-years away in the constellation Ursa Major.", imageUrl: "/celestial/m101.jpg", traits: { tilt: 0.9, core: colorPalette.gold, arm: colorPalette.orange } },
    { id: "m33", category: "galaxy", name: "Triangulum Galaxy (M33)", type: "Spiral Galaxy", summary: "The third-largest member of the Local Group of galaxies.", imageUrl: "/celestial/m33.jpg", traits: { tilt: 0.6, core: colorPalette.cream, arm: colorPalette.cream } }
  ],
  nebula: [
    { id: "m42", category: "nebula", name: "Orion Nebula (M42)", type: "Diffuse Nebula", summary: "A diffuse nebula situated in the Milky Way, being one of the brightest nebulae visible to the naked eye.", imageUrl: "/celestial/m42.jpg", traits: { shape: 'cloud', color1: colorPalette.red, color2: colorPalette.orange } },
    { id: "m1", category: "nebula", name: "Crab Nebula (M1)", type: "Supernova Remnant", summary: "A supernova remnant and pulsar wind nebula in the constellation of Taurus.", imageUrl: "/celestial/m1.jpg", traits: { shape: 'burst', color1: colorPalette.orange, color2: colorPalette.cream } },
    { id: "m57", category: "nebula", name: "Ring Nebula (M57)", type: "Planetary Nebula", summary: "A planetary nebula in the northern constellation of Lyra, formed by a star casting off its outer layers.", imageUrl: "/celestial/m57.jpg", traits: { shape: 'ring', color1: colorPalette.red, color2: colorPalette.gold } },
    { id: "m16", category: "nebula", name: "Eagle Nebula (M16)", type: "Emission Nebula", summary: "Contains the famous Pillars of Creation, a large region of active star formation.", imageUrl: "/celestial/m16.jpg", traits: { shape: 'pillars', color1: colorPalette.orange, color2: colorPalette.gold } },
    { id: "ngc3372", category: "nebula", name: "Carina Nebula", type: "Complex Nebula", summary: "A large, complex area of bright and dark nebulosity in the constellation Carina.", imageUrl: "/celestial/ngc3372.jpg", traits: { shape: 'cloud', color1: colorPalette.red, color2: colorPalette.gold } }
  ],
  planet: [
    { id: "jupiter", category: "planet", name: "Jupiter", type: "Gas Giant", summary: "The largest planet in the Solar System, known for its Great Red Spot and prominent cloud bands.", imageUrl: "/celestial/jupiter.jpg", traits: { color: colorPalette.orange, hasRing: false, bands: true } },
    { id: "saturn", category: "planet", name: "Saturn", type: "Gas Giant", summary: "The sixth planet from the Sun, famous for its extensive ring system.", imageUrl: "/celestial/saturn.jpg", traits: { color: colorPalette.gold, hasRing: true, bands: true } },
    { id: "mars", category: "planet", name: "Mars", type: "Terrestrial Planet", summary: "The fourth planet from the Sun, known as the Red Planet.", imageUrl: "/celestial/mars.jpg", traits: { color: colorPalette.red, hasRing: false, bands: false } },
    { id: "venus", category: "planet", name: "Venus", type: "Terrestrial Planet", summary: "The second planet from the Sun, shrouded in thick clouds of sulfuric acid.", imageUrl: "/celestial/venus.jpg", traits: { color: colorPalette.cream, hasRing: false, bands: false } },
    { id: "trappist", category: "planet", name: "TRAPPIST-1e", type: "Exoplanet", summary: "A rocky, Earth-sized exoplanet orbiting within the habitable zone of the ultra-cool dwarf star TRAPPIST-1.", imageUrl: "/celestial/trappist.jpg", traits: { color: colorPalette.red, hasRing: false, bands: false } }
  ],
  comet: [
    { id: "halley", category: "comet", name: "Halley's Comet", type: "Periodic Comet", summary: "A short-period comet visible from Earth every 75–76 years.", imageUrl: "/celestial/halley.jpg", traits: { color: colorPalette.cream, tailLen: 1.2 } },
    { id: "neowise", category: "comet", name: "Comet NEOWISE (C/2020 F3)", type: "Long-period Comet", summary: "A bright comet discovered by the NEOWISE mission, visible to the naked eye in 2020.", imageUrl: "/celestial/neowise.jpg", traits: { color: colorPalette.gold, tailLen: 1.5, twinTail: true } },
    { id: "halebopp", category: "comet", name: "Comet Hale-Bopp", type: "Long-period Comet", summary: "Perhaps the most widely observed comet of the 20th century.", imageUrl: "/celestial/halebopp.jpg", traits: { color: colorPalette.cream, tailLen: 1.0, twinTail: true } },
    { id: "encke", category: "comet", name: "Comet Encke", type: "Periodic Comet", summary: "A periodic comet that completes an orbit of the Sun once every 3.3 years.", imageUrl: "/celestial/encke.jpg", traits: { color: colorPalette.orange, tailLen: 0.8 } }
  ],
  blackhole: [
    { id: "m87", category: "blackhole", name: "M87*", type: "Supermassive Black Hole", summary: "The supermassive black hole at the center of the massive elliptical galaxy Messier 87.", imageUrl: "/celestial/m87.jpg", traits: { color: colorPalette.orange, jets: true, asymmetry: true } },
    { id: "saga", category: "blackhole", name: "Sagittarius A*", type: "Supermassive Black Hole", summary: "The supermassive black hole at the Galactic Center of the Milky Way.", imageUrl: "/celestial/saga.jpg", traits: { color: colorPalette.red, jets: false, asymmetry: false } },
    { id: "cygnus", category: "blackhole", name: "Cygnus X-1", type: "Stellar Black Hole", summary: "A well-known galactic X-ray source widely accepted to be a black hole.", imageUrl: "/celestial/cygnus.jpg", traits: { color: colorPalette.cream, jets: true, asymmetry: true } }
  ]
};
