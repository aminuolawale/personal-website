"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function usePersistentTab(defaultTab: string, validTabIds: Set<string>) {
  const urlTab = useSearchParams().get("tab");
  const [userTab, setUserTab] = useState<string | null>(null);

  const activeTabId =
    (urlTab && validTabIds.has(urlTab) && urlTab) ||
    (userTab && validTabIds.has(userTab) && userTab) ||
    defaultTab;

  return [activeTabId, setUserTab] as const;
}
