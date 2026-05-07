"use client";

const jsonCache = new Map<string, unknown>();
const inFlight = new Map<string, Promise<unknown>>();

export async function fetchCachedJson<T>(url: string, fallback: T): Promise<T> {
  if (process.env.NODE_ENV === "test" && process.env.PUBLIC_CLIENT_CACHE_TEST_MODE !== "enabled") {
    return fetch(url)
      .then((response) => (response.ok ? response.json() : fallback))
      .catch(() => fallback);
  }

  if (jsonCache.has(url)) return jsonCache.get(url) as T;
  if (inFlight.has(url)) return inFlight.get(url) as Promise<T>;

  const request = fetch(url)
    .then((response) => (response.ok ? response.json() : fallback))
    .then((data) => {
      jsonCache.set(url, data);
      inFlight.delete(url);
      return data as T;
    })
    .catch(() => {
      inFlight.delete(url);
      return fallback;
    });

  inFlight.set(url, request);
  return request;
}
