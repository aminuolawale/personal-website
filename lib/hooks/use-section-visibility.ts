"use client";

import { useState, useEffect } from "react";
import { DEFAULT_VISIBILITY, type SectionVisibility } from "@/lib/section-visibility";

export function useSectionVisibility(): SectionVisibility {
  const [visibility, setVisibility] = useState<SectionVisibility>(DEFAULT_VISIBILITY);

  useEffect(() => {
    fetch("/api/config?key=section-visibility")
      .then((r) => (r.ok ? r.json() : { value: null }))
      .then(({ value }) => {
        if (value && typeof value === "object") {
          setVisibility({ ...DEFAULT_VISIBILITY, ...value });
        }
      })
      .catch(() => {});
  }, []);

  return visibility;
}
