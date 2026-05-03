import { describe, expect, it } from "vitest";
import {
  DEFAULT_VISIBILITY,
  getVisibleSectionIds,
  getVisibleSectionNumber,
  type SectionVisibility,
} from "@/lib/section-visibility";

describe("section visibility helpers", () => {
  it("returns visible sections in canonical navigation order", () => {
    const visibility: SectionVisibility = {
      ...DEFAULT_VISIBILITY,
      swe: false,
      misc: false,
    };

    expect(getVisibleSectionIds(visibility)).toEqual(["astrophotography", "writing"]);
  });

  it("numbers visible sections after hidden sections are removed", () => {
    const visibility: SectionVisibility = {
      ...DEFAULT_VISIBILITY,
      swe: false,
    };

    expect(getVisibleSectionNumber("astrophotography", visibility)).toBe("01");
    expect(getVisibleSectionNumber("writing", visibility)).toBe("02");
  });

  it("returns null for hidden sections", () => {
    const visibility: SectionVisibility = {
      ...DEFAULT_VISIBILITY,
      astrophotography: false,
    };

    expect(getVisibleSectionNumber("astrophotography", visibility)).toBeNull();
  });
});
