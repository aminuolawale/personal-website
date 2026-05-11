import { describe, expect, it } from "vitest";
import { getOcsBucket } from "@/lib/activity-score";

describe("activity-score", () => {
  it("buckets OCS values into okay, good, great, and excellent", () => {
    expect(getOcsBucket(0)).toBe("okay");
    expect(getOcsBucket(29)).toBe("okay");
    expect(getOcsBucket(30)).toBe("good");
    expect(getOcsBucket(50)).toBe("good");
    expect(getOcsBucket(51)).toBe("great");
    expect(getOcsBucket(80)).toBe("great");
    expect(getOcsBucket(81)).toBe("excellent");
  });
});
