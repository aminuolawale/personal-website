"use client";

import { useState, useEffect } from "react";

// Fetches the saved tab order for a section from the config API and returns it.
// Falls back to `defaultOrder` if no config is saved or if the saved order no
// longer matches the current tab IDs (which happens when a new tab is added
// after the order was last saved — we'd rather show the default than hide tabs).
export function useTabOrder(section: string, defaultOrder: string[]): string[] {
  const [order, setOrder] = useState<string[]>(defaultOrder);

  useEffect(() => {
    fetch(`/api/config?key=tab-order-${section}`)
      .then((r) => (r.ok ? r.json() : { value: null }))
      .then(({ value }) => {
        if (Array.isArray(value) && value.length === defaultOrder.length) {
          // Only apply if every current tab ID is represented in the saved order.
          const valid = defaultOrder.every((id) => value.includes(id));
          if (valid) setOrder(value);
        }
      })
      .catch(() => {/* keep default */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  return order;
}
