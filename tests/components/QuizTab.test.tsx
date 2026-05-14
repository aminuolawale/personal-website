import { describe, expect, it } from "vitest";
import { quizShareUrl, quizStoryDisplayUrl } from "@/components/astrophotography/QuizTab";

describe("QuizTab sharing", () => {
  it("builds a direct quiz URL that can be reused by native share targets", () => {
    expect(quizShareUrl(42, "https://example.com")).toBe("https://example.com/astrophotography?tab=quiz&quiz=42");
  });

  it("shortens the URL displayed on story preview cards", () => {
    expect(quizStoryDisplayUrl("https://example.com/astrophotography?tab=quiz&quiz=42")).toBe("example.com/astro?quiz=42");
  });
});
