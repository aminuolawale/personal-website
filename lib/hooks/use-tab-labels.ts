"use client";

import { useState, useEffect } from "react";

// Fetches custom tab labels for a section from the config API.
// Returns a map of tab id → display label, merged with defaults so any
// unconfigured tab always has its original label.
export function useTabLabels(
  section: string,
  defaults: Array<{ id: string; label: string }>
): Record<string, string> {
  const defaultMap = Object.fromEntries(defaults.map((t) => [t.id, t.label]));
  const [labels, setLabels] = useState<Record<string, string>>(defaultMap);

  useEffect(() => {
    fetch(`/api/config?key=tab-labels-${section}`)
      .then((r) => (r.ok ? r.json() : { value: null }))
      .then(({ value }) => {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          setLabels({ ...defaultMap, ...value });
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  return labels;
}
