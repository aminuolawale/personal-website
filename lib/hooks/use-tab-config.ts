"use client";

import { useState, useEffect } from "react";

export interface TabConfigResult {
  order: string[];
  labels: Record<string, string>;
  visibility: Record<string, boolean>;
}

export function useTabConfig(
  section: string,
  tabs: Array<{ id: string; label: string }>
): TabConfigResult {
  const defaultOrder = tabs.map((t) => t.id);
  const defaultLabels = Object.fromEntries(tabs.map((t) => [t.id, t.label]));
  const defaultVisibility = Object.fromEntries(tabs.map((t) => [t.id, true]));

  const [config, setConfig] = useState<TabConfigResult>({
    order: defaultOrder,
    labels: defaultLabels,
    visibility: defaultVisibility,
  });

  useEffect(() => {
    const keys = [
      `tab-order-${section}`,
      `tab-labels-${section}`,
      `tab-visibility-${section}`,
    ].join(",");

    fetch(`/api/config?keys=${keys}`)
      .then((r) => (r.ok ? r.json() : { values: {} }))
      .then(({ values }: { values: Record<string, unknown> }) => {
        const savedOrder = values[`tab-order-${section}`];
        const savedLabels = values[`tab-labels-${section}`];
        const savedVisibility = values[`tab-visibility-${section}`];

        const order =
          Array.isArray(savedOrder) &&
          savedOrder.length === defaultOrder.length &&
          defaultOrder.every((id) => (savedOrder as string[]).includes(id))
            ? (savedOrder as string[])
            : defaultOrder;

        const labels =
          savedLabels && typeof savedLabels === "object" && !Array.isArray(savedLabels)
            ? { ...defaultLabels, ...(savedLabels as Record<string, string>) }
            : defaultLabels;

        const visibility =
          savedVisibility && typeof savedVisibility === "object" && !Array.isArray(savedVisibility)
            ? { ...defaultVisibility, ...(savedVisibility as Record<string, boolean>) }
            : defaultVisibility;

        setConfig({ order, labels, visibility });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  return config;
}
