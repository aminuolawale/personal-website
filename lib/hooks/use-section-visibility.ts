"use client";

import { useState, useEffect } from "react";
import { DEFAULT_VISIBILITY, type SectionVisibility } from "@/lib/section-visibility";
import { fetchCachedJson } from "@/lib/client-cache";

export function useSectionVisibility(): SectionVisibility {
  const [visibility, setVisibility] = useState<SectionVisibility>(DEFAULT_VISIBILITY);

  useEffect(() => {
    fetchCachedJson<{ value: unknown }>("/api/config?key=section-visibility", { value: null })
      .then(({ value }) => {
        if (value && typeof value === "object") {
          setVisibility({ ...DEFAULT_VISIBILITY, ...value });
        }
      });
  }, []);

  return visibility;
}
