import { CONSTELLATIONS, DSO_OBJECTS } from "@/lib/sky-data";
import { type Computed, type SkyPos } from "@/lib/sky-engine";

export const SOLAR_SYSTEM_TARGETS = [
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Moon",
] as const;

export type SkyTargetType = "constellation" | "deep-sky" | "solar-system";

export interface SkyTarget {
  id: string;
  name: string;
  type: SkyTargetType;
}

function slugifyTarget(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const SKY_TARGETS: SkyTarget[] = [
  ...CONSTELLATIONS.map((target) => ({
    id: `constellation:${slugifyTarget(target.name)}`,
    name: target.name,
    type: "constellation" as const,
  })),
  ...DSO_OBJECTS.map((target) => ({
    id: `deep-sky:${slugifyTarget(target.name)}`,
    name: target.name,
    type: "deep-sky" as const,
  })),
  ...SOLAR_SYSTEM_TARGETS.map((name) => ({
    id: `solar-system:${slugifyTarget(name)}`,
    name,
    type: "solar-system" as const,
  })),
];

export function getSkyTargetById(id: string): SkyTarget | null {
  return SKY_TARGETS.find((target) => target.id === id) ?? null;
}

export function resolveComputedTargetPosition(
  computed: Computed,
  targetId: string
): SkyPos | null {
  const target = getSkyTargetById(targetId);
  if (!target) return null;

  if (target.type === "constellation") {
    return computed.constellations.find((item) => item.name === target.name)?.centroid ?? null;
  }

  if (target.type === "deep-sky") {
    return computed.dso.find((item) => item.name === target.name) ?? null;
  }

  if (target.name === "Moon") return computed.moon;
  return computed.planets.find((item) => item.name === target.name) ?? null;
}
