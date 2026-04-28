import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useSiteContent, DEFAULT_CONTENT } from "@/lib/hooks/use-site-content";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useSiteContent", () => {
  it("returns DEFAULT_CONTENT on first render before fetch resolves", () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as any);
    const { result } = renderHook(() => useSiteContent());
    expect(result.current).toEqual(DEFAULT_CONTENT);
  });

  it("merges API response over defaults after fetch", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ value: { greeting: "Hey there", name: "Custom." } }),
    } as any);

    const { result } = renderHook(() => useSiteContent());
    await waitFor(() => expect(result.current.greeting).toBe("Hey there"));

    expect(result.current.name).toBe("Custom.");
    expect(result.current.roles).toBe(DEFAULT_CONTENT.roles); // untouched key uses default
  });

  it("keeps defaults when API returns null value", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ value: null }),
    } as any);

    const { result } = renderHook(() => useSiteContent());
    await waitFor(() => {});
    expect(result.current).toEqual(DEFAULT_CONTENT);
  });

  it("keeps defaults when API returns a non-object value", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ value: "bad" }),
    } as any);

    const { result } = renderHook(() => useSiteContent());
    await waitFor(() => {});
    expect(result.current).toEqual(DEFAULT_CONTENT);
  });

  it("keeps defaults when fetch throws", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useSiteContent());
    await waitFor(() => {});
    expect(result.current).toEqual(DEFAULT_CONTENT);
  });
});
