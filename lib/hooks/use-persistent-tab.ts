"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function usePersistentTab(defaultTab: string, validTabIds: Set<string>) {
  const urlTab = useSearchParams().get("tab");
  const [manualTab, setManualTab] = useState<string | null>(null);

  const activeTabId =
    (urlTab && validTabIds.has(urlTab) && urlTab) ||
    (manualTab && validTabIds.has(manualTab) && manualTab) ||
    defaultTab;

  return [activeTabId, setManualTab] as const;
}
