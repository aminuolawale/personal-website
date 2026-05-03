"use client";

import { useState, useEffect } from "react";
import type { Article } from "@/lib/schema";

interface UseArticlesResult {
  articles: Article[];
  isLoading: boolean;
}

export function useArticles(
  type: "writing" | "astrophotography" | "swe" | "misc",
  admin = false
): UseArticlesResult {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const url = `/api/articles?type=${type}${admin ? "&admin=true" : ""}`;
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) setArticles(data);
      })
      .finally(() => setIsLoading(false));
  }, [type]);

  return { articles, isLoading };
}
