import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTabConfig } from "@/lib/hooks/use-tab-config";

const DEFAULT_TABS = [
  { id: "articles", label: "Articles" },
  { id: "projects", label: "Projects" },
  { id: "about", label: "About Me" },
];
const DEFAULT_ORDER = DEFAULT_TABS.map((t) => t.id);

function mockValues(values: Record<string, unknown>) {
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    json: async () => ({ values }),
  } as Response);
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useTabConfig", () => {
  it("returns defaults immediately before fetch resolves", () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
    const { result } = renderHook(() => useTabConfig("swe", DEFAULT_TABS));
    expect(result.current.order).toEqual(DEFAULT_ORDER);
    expect(result.current.labels).toEqual({ articles: "Articles", projects: "Projects", about: "About Me" });
    expect(result.current.visibility).toEqual({ articles: true, projects: true, about: true });
  });

  it("applies a valid saved order from the API", async () => {
    const reordered = ["about", "articles", "projects"];
    mockValues({ "tab-order-swe": reordered });
    const { result } = renderHook(() => useTabConfig("swe", DEFAULT_TABS));
    await waitFor(() => expect(result.current.order[0]).toBe("about"));
    expect(result.current.order).toEqual(reordered);
  });

  it("falls back to default order when saved order has wrong length", async () => {
    mockValues({ "tab-order-swe": ["articles", "projects"] });
    const { result } = renderHook(() => useTabConfig("swe", DEFAULT_TABS));
    await waitFor(() => {});
    expect(result.current.order).toEqual(DEFAULT_ORDER);
  });

  it("falls back to default order when saved order has unknown tab IDs", async () => {
    mockValues({ "tab-order-swe": ["articles", "projects", "unknown-tab"] });
    const { result } = renderHook(() => useTabConfig("swe", DEFAULT_TABS));
    await waitFor(() => {});
    expect(result.current.order).toEqual(DEFAULT_ORDER);
  });

  it("applies saved labels merged with defaults", async () => {
    mockValues({ "tab-labels-swe": { articles: "Blog" } });
    const { result } = renderHook(() => useTabConfig("swe", DEFAULT_TABS));
    await waitFor(() => expect(result.current.labels.articles).toBe("Blog"));
    expect(result.current.labels.projects).toBe("Projects");
  });

  it("applies saved visibility", async () => {
    mockValues({ "tab-visibility-swe": { projects: false } });
    const { result } = renderHook(() => useTabConfig("swe", DEFAULT_TABS));
    await waitFor(() => expect(result.current.visibility.projects).toBe(false));
    expect(result.current.visibility.articles).toBe(true);
  });

  it("falls back to defaults when fetch throws", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useTabConfig("swe", DEFAULT_TABS));
    await waitFor(() => {});
    expect(result.current.order).toEqual(DEFAULT_ORDER);
  });

  it("includes the section in the fetch URL", async () => {
    mockValues({});
    renderHook(() => useTabConfig("astrophotography", DEFAULT_TABS));
    await waitFor(() => {});
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining("astrophotography")
    );
  });
});
