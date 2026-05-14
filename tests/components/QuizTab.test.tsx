import { describe, expect, it } from "vitest";
import { quizShareUrl } from "@/components/astrophotography/QuizTab";

describe("QuizTab sharing", () => {
  it("builds a direct quiz URL that can be reused by native share targets", () => {
    expect(quizShareUrl(42, "https://example.com")).toBe("https://example.com/astrophotography?tab=quiz&quiz=42");
  });
});
