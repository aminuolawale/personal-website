import { describe, expect, it } from "vitest";
import { deriveScsFromOcs, getOcsBucket } from "@/lib/activity-score";

describe("activity-score", () => {
  it("buckets OCS values into poor, good, and great", () => {
    expect(getOcsBucket(0)).toBe("poor");
    expect(getOcsBucket(49)).toBe("poor");
    expect(getOcsBucket(50)).toBe("good");
    expect(getOcsBucket(79)).toBe("good");
    expect(getOcsBucket(80)).toBe("great");
  });

  it("derives SCS from OCS", () => {
    expect(deriveScsFromOcs(100)).toBe(0);
    expect(deriveScsFromOcs(75)).toBe(25);
    expect(deriveScsFromOcs(12)).toBe(88);
  });
});
