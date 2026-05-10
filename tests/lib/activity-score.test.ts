import { describe, expect, it } from "vitest";
import { getOcsBucket } from "@/lib/activity-score";

describe("activity-score", () => {
  it("buckets OCS values into good, great, and excellent", () => {
    expect(getOcsBucket(0)).toBe("good");
    expect(getOcsBucket(29)).toBe("good");
    expect(getOcsBucket(30)).toBe("great");
    expect(getOcsBucket(50)).toBe("great");
    expect(getOcsBucket(51)).toBe("excellent");
  });
});
