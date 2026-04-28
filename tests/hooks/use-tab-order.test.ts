import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTabOrder } from "@/lib/hooks/use-tab-order";

const DEFAULT = ["articles", "projects", "about"];

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useTabOrder", () => {
  it("returns defaultOrder immediately before fetch resolves", () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as any);
    const { result } = renderHook(() => useTabOrder("swe", DEFAULT));
    expect(result.current).toEqual(DEFAULT);
  });

  it("applies a valid saved order from the API", async () => {
    const reordered = ["about", "articles", "projects"];
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ value: reordered }),
    } as any);

    const { result } = renderHook(() => useTabOrder("swe", DEFAULT));
    await waitFor(() => expect(result.current[0]).toBe("about"));
    expect(result.current).toEqual(reordered);
  });

  it("falls back to default when saved order has wrong length", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ value: ["articles", "projects"] }), // missing "about"
    } as any);

    const { result } = renderHook(() => useTabOrder("swe", DEFAULT));
    await waitFor(() => {});
    expect(result.current).toEqual(DEFAULT);
  });

  it("falls back to default when saved order has unknown tab IDs", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ value: ["articles", "projects", "unknown-tab"] }),
    } as any);

    const { result } = renderHook(() => useTabOrder("swe", DEFAULT));
    await waitFor(() => {});
    expect(result.current).toEqual(DEFAULT);
  });

  it("falls back to default when API returns null", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ value: null }),
    } as any);

    const { result } = renderHook(() => useTabOrder("swe", DEFAULT));
    await waitFor(() => {});
    expect(result.current).toEqual(DEFAULT);
  });

  it("falls back to default when fetch throws", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useTabOrder("swe", DEFAULT));
    await waitFor(() => {});
    expect(result.current).toEqual(DEFAULT);
  });

  it("includes the section in the fetch URL", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ value: null }),
    } as any);

    renderHook(() => useTabOrder("astrophotography", DEFAULT));
    await waitFor(() => {});
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining("tab-order-astrophotography")
    );
  });
});
