import { describe, it, expect } from "vitest";
import { slugify, splitTags, timeAgo } from "@/lib/utils";

describe("slugify", () => {
  it("lowercases input", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugify("hello world foo")).toBe("hello-world-foo");
  });

  it("removes special characters", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });

  it("collapses consecutive hyphens", () => {
    expect(slugify("hello---world")).toBe("hello-world");
  });

  it("strips trailing hyphen", () => {
    expect(slugify("hello world-")).toBe("hello-world");
  });

  it("preserves existing hyphens", () => {
    expect(slugify("server-side rendering")).toBe("server-side-rendering");
  });

  it("truncates to 80 characters", () => {
    expect(slugify("a".repeat(100)).length).toBeLessThanOrEqual(80);
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("handles string with only special characters", () => {
    expect(slugify("!!! ???")).toBe("");
  });
});

describe("splitTags", () => {
  it("splits comma-separated tags", () => {
    expect(splitTags("react,typescript,go")).toEqual(["react", "typescript", "go"]);
  });

  it("trims whitespace from each tag", () => {
    expect(splitTags("  react  ,  go  ")).toEqual(["react", "go"]);
  });

  it("filters empty entries from consecutive commas", () => {
    expect(splitTags("react,,go")).toEqual(["react", "go"]);
  });

  it("returns empty array for empty string", () => {
    expect(splitTags("")).toEqual([]);
  });

  it("returns single-element array for one tag", () => {
    expect(splitTags("react")).toEqual(["react"]);
  });
});

describe("timeAgo", () => {
  it("returns 'just now' for under 60 seconds", () => {
    expect(timeAgo(new Date(Date.now() - 30_000))).toBe("just now");
  });

  it("returns minutes ago", () => {
    expect(timeAgo(new Date(Date.now() - 5 * 60_000))).toBe("5m ago");
  });

  it("returns hours ago", () => {
    expect(timeAgo(new Date(Date.now() - 3 * 60 * 60_000))).toBe("3h ago");
  });

  it("returns days ago", () => {
    expect(timeAgo(new Date(Date.now() - 10 * 24 * 60 * 60_000))).toBe("10d ago");
  });

  it("returns months ago", () => {
    expect(timeAgo(new Date(Date.now() - 3 * 30 * 24 * 60 * 60_000))).toBe("3mo ago");
  });

  it("returns years ago", () => {
    expect(timeAgo(new Date(Date.now() - 2 * 365 * 24 * 60 * 60_000))).toBe("2y ago");
  });

  it("accepts an ISO string", () => {
    expect(timeAgo(new Date(Date.now() - 5 * 60_000).toISOString())).toBe("5m ago");
  });
});
