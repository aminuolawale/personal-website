import { NebulaTraits } from "./nebula";
import { colorPalette } from "./utils";

export interface CelestialData {
  id: string;
  category: "nebula";
  name: string;
  type: string;
  summary: string;
  imageUrl: string;
  traits: NebulaTraits;
}

export const CELESTIAL_CATALOG: Record<string, CelestialData[]> = {
  nebula: [
    { 
      id: "ngc3372", 
      category: "nebula", 
      name: "Carina Nebula", 
      type: "Complex Nebula", 
      summary: "A large, complex area of bright and dark nebulosity in the constellation Carina.", 
      imageUrl: "/celestial/ngc3372.jpg", 
      traits: { shape: 'cloud', color1: colorPalette.red, color2: colorPalette.gold } 
    }
  ]
};
