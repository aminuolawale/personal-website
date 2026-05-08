import { describe, expect, it } from "vitest";
import { BG_STARS, CONSTELLATIONS } from "@/lib/sky-data";

describe("sky-data constellations", () => {
  it("uses a complete standard Hercules outline when highlighted", () => {
    const hercules = CONSTELLATIONS.find((constellation) => constellation.name === "Hercules");

    expect(hercules).toBeTruthy();
    expect(hercules?.lines.length).toBeGreaterThanOrEqual(8);

    const vertices = new Set(
      hercules?.lines.flat().map(([ra, dec]) => `${ra.toFixed(2)},${dec.toFixed(2)}`)
    );
    [
      "250.32,31.60",
      "250.72,38.92",
      "258.76,36.81",
      "255.07,30.93",
      "247.56,21.49",
      "258.66,14.39",
      "264.87,46.01",
      "269.06,37.25",
    ].forEach((vertex) => expect(vertices.has(vertex)).toBe(true));
  });

  it("renders star points for the added Hercules outline vertices", () => {
    const backgroundVertices = new Set(BG_STARS.map(([ra, dec]) => `${ra.toFixed(2)},${dec.toFixed(2)}`));

    [
      "250.32,31.60",
      "250.72,38.92",
      "255.07,30.93",
      "258.76,36.81",
      "264.87,46.01",
      "269.06,37.25",
    ].forEach((vertex) => expect(backgroundVertices.has(vertex)).toBe(true));
  });
});
