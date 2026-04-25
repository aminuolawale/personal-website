"use client";

import { useState, useEffect } from "react";

export function useTabOrder(section: string, defaultOrder: string[]): string[] {
  const [order, setOrder] = useState<string[]>(defaultOrder);

  useEffect(() => {
    fetch(`/api/config?key=tab-order-${section}`)
      .then((r) => (r.ok ? r.json() : { value: null }))
      .then(({ value }) => {
        if (Array.isArray(value) && value.length === defaultOrder.length) {
          // Only apply if it covers all the same IDs
          const valid = defaultOrder.every((id) => value.includes(id));
          if (valid) setOrder(value);
        }
      })
      .catch(() => {/* keep default */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  return order;
}
