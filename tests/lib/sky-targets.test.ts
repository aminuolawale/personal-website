import { describe, expect, it } from "vitest";
import { getSkyTargetById, SKY_TARGETS } from "@/lib/sky-targets";

describe("sky target catalog", () => {
  it("includes constellations, deep-sky objects, planets, and the Moon", () => {
    expect(getSkyTargetById("constellation:orion")?.name).toBe("Orion");
    expect(getSkyTargetById("deep-sky:orion-nebula")?.name).toBe("Orion Nebula");
    expect(getSkyTargetById("solar-system:jupiter")?.name).toBe("Jupiter");
    expect(getSkyTargetById("solar-system:moon")?.name).toBe("Moon");
  });

  it("keeps target ids unique", () => {
    const ids = SKY_TARGETS.map((target) => target.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
