"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/**
 * Manages the active tab state for a section.
 * Behavior:
 * 1. If a 'tab' URL parameter exists and is valid, it takes precedence.
 * 2. Otherwise, the defaultTab (first in order) is always used on load.
 */
export function usePersistentTab(defaultTab: string, validTabIds: Set<string>) {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");

  const [activeTabId, setActiveTabId] = useState<string>(() => {
    if (urlTab && validTabIds.has(urlTab)) {
      return urlTab;
    }
    return defaultTab;
  });

  // Keep state in sync with URL changes (e.g. back/forward navigation)
  useEffect(() => {
    if (urlTab && validTabIds.has(urlTab) && urlTab !== activeTabId) {
      setActiveTabId(urlTab);
    }
  }, [urlTab, validTabIds, activeTabId]);

  // When validTabIds is first populated (async tabs like misc), reset to defaultTab
  // if the current activeTabId is not yet a valid tab.
  useEffect(() => {
    if (validTabIds.size > 0 && !validTabIds.has(activeTabId)) {
      setActiveTabId(defaultTab);
    }
  }, [validTabIds, activeTabId, defaultTab]);

  const setActiveTab = useCallback((id: string) => {
    setActiveTabId(id);
  }, []);

  return [activeTabId, setActiveTab] as const;
}
