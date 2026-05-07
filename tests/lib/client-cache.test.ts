// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

async function loadModule() {
  vi.resetModules();
  return import("@/lib/client-cache");
}

describe("fetchCachedJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.PUBLIC_CLIENT_CACHE_TEST_MODE;
  });

  it("coalesces concurrent requests for the same URL outside tests", async () => {
    process.env.PUBLIC_CLIENT_CACHE_TEST_MODE = "enabled";
    const { fetchCachedJson } = await loadModule();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ value: 1 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const [first, second] = await Promise.all([
      fetchCachedJson("/api/config?key=site-content", { value: null }),
      fetchCachedJson("/api/config?key=site-content", { value: null }),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).toEqual({ value: 1 });
    expect(second).toEqual({ value: 1 });
  });

  it("serves a completed request from memory outside tests", async () => {
    process.env.PUBLIC_CLIENT_CACHE_TEST_MODE = "enabled";
    const { fetchCachedJson } = await loadModule();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(["cached"]),
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchCachedJson("/api/articles?type=writing", []);
    const second = await fetchCachedJson("/api/articles?type=writing", []);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second).toEqual(["cached"]);
  });

  it("bypasses memory cache in test mode", async () => {
    const { fetchCachedJson } = await loadModule();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({ value: 1 }) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({ value: 2 }) });
    vi.stubGlobal("fetch", fetchMock);

    const first = await fetchCachedJson("/api/config?key=site-content", { value: null });
    const second = await fetchCachedJson("/api/config?key=site-content", { value: null });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(first).toEqual({ value: 1 });
    expect(second).toEqual({ value: 2 });
  });
});
