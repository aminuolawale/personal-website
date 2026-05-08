"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchCachedJson } from "@/lib/client-cache";

export interface TabConfigResult {
  order: string[];
  labels: Record<string, string>;
  visibility: Record<string, boolean>;
}

export function useTabConfig(
  section: string,
  tabs: Array<{ id: string; label: string }>
): TabConfigResult {
  const defaults = useMemo(() => ({
    order: tabs.map((t) => t.id),
    labels: Object.fromEntries(tabs.map((t) => [t.id, t.label])),
    visibility: Object.fromEntries(tabs.map((t) => [t.id, true])),
  }), [tabs]);

  const [config, setConfig] = useState<TabConfigResult>({
    order: defaults.order,
    labels: defaults.labels,
    visibility: defaults.visibility,
  });

  useEffect(() => {
    if (tabs.length === 0) {
      return;
    }

    const keys = [
      `tab-order-${section}`,
      `tab-labels-${section}`,
      `tab-visibility-${section}`,
    ].join(",");

    let cancelled = false;
    fetchCachedJson<{ values: Record<string, unknown> }>(`/api/config?keys=${keys}`, { values: {} })
      .then(({ values }: { values: Record<string, unknown> }) => {
        if (cancelled) return;
        const savedOrder = values[`tab-order-${section}`];
        const savedLabels = values[`tab-labels-${section}`];
        const savedVisibility = values[`tab-visibility-${section}`];

        const savedIds = Array.isArray(savedOrder) ? (savedOrder as string[]) : [];
        const knownIds = new Set(defaults.order);
        const orderedKnownIds = savedIds.filter((id) => knownIds.has(id));
        const missingIds = defaults.order.filter((id) => !orderedKnownIds.includes(id));
        const order = [...orderedKnownIds, ...missingIds];

        const labels =
          savedLabels && typeof savedLabels === "object" && !Array.isArray(savedLabels)
            ? { ...defaults.labels, ...(savedLabels as Record<string, string>) }
            : defaults.labels;

        const visibility =
          savedVisibility && typeof savedVisibility === "object" && !Array.isArray(savedVisibility)
            ? { ...defaults.visibility, ...(savedVisibility as Record<string, boolean>) }
            : defaults.visibility;
        setConfig({ order, labels, visibility });
      });
    return () => { cancelled = true; };
  }, [defaults, section, tabs.length]);

  return tabs.length === 0 ? { order: [], labels: {}, visibility: {} } : config;
}
