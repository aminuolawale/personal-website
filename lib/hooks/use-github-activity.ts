"use client";

import { useState, useEffect } from "react";
import { fetchCachedJson } from "@/lib/client-cache";
import type { ActivityItem } from "@/lib/vercel-activity";

interface UseGithubActivityResult {
  items: ActivityItem[];
  isLoading: boolean;
}

export function useGithubActivity(): UseGithubActivityResult {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCachedJson<ActivityItem[]>("/api/github-activity", [])
      .then(setItems)
      .finally(() => setIsLoading(false));
  }, []);

  return { items, isLoading };
}
