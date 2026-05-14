"use client";

import { useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export function usePersistentTab(defaultTab: string, validTabIds: Set<string>) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlTab = searchParams.get("tab");
  const activeTabId = (urlTab && validTabIds.has(urlTab) && urlTab) || defaultTab;

  const setActiveTabId = useCallback((tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    params.delete("page"); // reset pagination in the same navigation to avoid a race
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  return [activeTabId, setActiveTabId] as const;
}
