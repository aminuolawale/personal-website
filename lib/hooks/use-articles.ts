"use client";

import { useState, useEffect } from "react";
import type { Article } from "@/lib/schema";

interface UseArticlesResult {
  articles: Article[];
  isLoading: boolean;
}

export function useArticles(
  type: "writing" | "astrophotography" | "swe"
): UseArticlesResult {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/articles?type=${type}`)
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) setArticles(data);
      })
      .finally(() => setIsLoading(false));
  }, [type]);

  return { articles, isLoading };
}
