import { describe, expect, it } from "vitest";
import { SECTION_TABS } from "@/lib/section-tabs";

describe("SECTION_TABS", () => {
  it("keeps built-in section tabs in one shared shape", () => {
    expect(SECTION_TABS.swe.map((tab) => tab.id)).toEqual(["articles", "projects", "about", "activity"]);
    expect(SECTION_TABS.astrophotography.map((tab) => tab.id)).toEqual([
      "articles",
      "calendar",
      "gallery",
      "gear",
      "sky",
    ]);
    expect(SECTION_TABS.writing.map((tab) => tab.id)).toEqual(["book-reviews", "reading-notes"]);
    expect(Object.values(SECTION_TABS).flat().every((tab) => tab.id && tab.label)).toBe(true);
  });
});
