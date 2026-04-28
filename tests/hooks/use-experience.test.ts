import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useExperience, DEFAULT_EXPERIENCES } from "@/lib/hooks/use-experience";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const customExperiences = [
  {
    id: "acme",
    company: "Acme Corp",
    role: "Engineer",
    startDate: "2023-01",
    endDate: "Present",
    location: "Remote",
    responsibilities: ["Built things"],
  },
];

describe("useExperience", () => {
  it("returns DEFAULT_EXPERIENCES immediately before fetch resolves", () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as any);
    const { result } = renderHook(() => useExperience());
    expect(result.current).toEqual(DEFAULT_EXPERIENCES);
  });

  it("replaces experiences with API data after fetch", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ value: customExperiences }),
    } as any);

    const { result } = renderHook(() => useExperience());
    await waitFor(() => expect(result.current[0].company).toBe("Acme Corp"));
    expect(result.current).toHaveLength(1);
  });

  it("keeps defaults when API returns null", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ value: null }),
    } as any);

    const { result } = renderHook(() => useExperience());
    await waitFor(() => {});
    expect(result.current).toEqual(DEFAULT_EXPERIENCES);
  });

  it("keeps defaults when API returns empty array", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ value: [] }),
    } as any);

    const { result } = renderHook(() => useExperience());
    await waitFor(() => {});
    expect(result.current).toEqual(DEFAULT_EXPERIENCES);
  });

  it("keeps defaults when fetch throws", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useExperience());
    await waitFor(() => {});
    expect(result.current).toEqual(DEFAULT_EXPERIENCES);
  });
});
