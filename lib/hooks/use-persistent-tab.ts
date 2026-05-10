"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/**
 * Manages the active tab state for a section with persistence.
 * Behavior:
 * 1. If a 'tab' URL parameter exists, it takes precedence.
 * 2. If returning from a deep link (and no URL param), the last active tab in the session is used.
 * 3. Otherwise, the provided defaultTab (usually the first one) is used.
 */
export function usePersistentTab(section: string, defaultTab: string, validTabIds: Set<string>) {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");
  const storageKey = `last-tab-${section}`;

  const [activeTabId, setActiveTabId] = useState<string>(() => {
    // 1. Check URL
    if (urlTab && validTabIds.has(urlTab)) {
      return urlTab;
    }

    // 2. Check Session Storage (only if we're in the browser)
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(storageKey);
        if (saved && validTabIds.has(saved)) {
          return saved;
        }
      } catch (e) {
        // Ignore storage errors
      }
    }

    // 3. Fallback to default
    return defaultTab;
  });

  // Keep state in sync with URL changes (e.g. back/forward navigation)
  useEffect(() => {
    if (urlTab && validTabIds.has(urlTab) && urlTab !== activeTabId) {
      setActiveTabId(urlTab);
    }
  }, [urlTab, validTabIds, activeTabId]);

  // Update session storage when the tab changes
  const setPersistedActiveTabId = useCallback((id: string) => {
    setActiveTabId(id);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(storageKey, id);
      } catch (e) {
        // Ignore storage errors
      }
    }
  }, [storageKey]);

  return [activeTabId, setPersistedActiveTabId] as const;
}
