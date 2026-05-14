"use client";

import { useEffect, useState } from "react";

export function useFetchJson<T>(
  url: string,
  fallback: T,
  options?: RequestInit
): { data: T; isLoading: boolean } {
  const [data, setData] = useState<T>(fallback);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { ...options, signal: controller.signal })
      .then((r) => (r.ok ? r.json() : fallback))
      .then((json: T) => setData(Array.isArray(json) ? json : fallback))
      .catch(() => {})
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  // options is intentionally omitted from deps to avoid infinite loops when
  // callers pass an inline object literal.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return { data, isLoading };
}
