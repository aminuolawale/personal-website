import { describe, expect, it } from "vitest";
import { getOcsBucket } from "@/lib/activity-score";

describe("activity-score", () => {
  it("buckets OCS values into poor, good, and great", () => {
    expect(getOcsBucket(0)).toBe("poor");
    expect(getOcsBucket(29)).toBe("poor");
    expect(getOcsBucket(30)).toBe("good");
    expect(getOcsBucket(79)).toBe("good");
    expect(getOcsBucket(80)).toBe("great");
  });
});
