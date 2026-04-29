"use client";

import { useState, useEffect } from "react";

export function useTabVisibility(section: string, tabIds: string[]): Record<string, boolean> {
  const [visibility, setVisibility] = useState<Record<string, boolean>>(
    Object.fromEntries(tabIds.map((id) => [id, true]))
  );

  useEffect(() => {
    fetch(`/api/config?key=tab-visibility-${section}`)
      .then((r) => (r.ok ? r.json() : { value: null }))
      .then(({ value }) => {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          setVisibility((prev) => ({ ...prev, ...value }));
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  return visibility;
}
