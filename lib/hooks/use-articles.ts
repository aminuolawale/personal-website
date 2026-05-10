"use client";

import { useState, useEffect } from "react";
import type { Article } from "@/lib/schema";
import { fetchCachedJson } from "@/lib/client-cache";
import type { PaginatedResponse } from "@/lib/pagination";

interface UseArticlesResult {
  articles: Article[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export function useArticles(
  type: "writing" | "astrophotography" | "swe" | "misc",
  options: { admin?: boolean; all?: boolean; page?: number; pageSize?: number } = {}
): UseArticlesResult {
  const { admin = false, all = false, page = 1, pageSize } = options;
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [meta, setMeta] = useState({
    page,
    pageSize: pageSize ?? 10,
    totalItems: 0,
    totalPages: 1,
  });

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      const params = new URLSearchParams({ type, page: String(page) });
      if (admin) params.set("admin", "true");
      if (all) params.set("all", "true");
      if (pageSize) params.set("pageSize", String(pageSize));
      const url = `/api/articles?${params.toString()}`;
      fetchCachedJson<PaginatedResponse<Article>>(url, {
        items: [],
        page,
        pageSize: pageSize ?? 10,
        totalItems: 0,
        totalPages: 1,
      })
        .then((data) => {
          if (cancelled) return;
          setArticles(Array.isArray(data.items) ? data.items : []);
          setMeta({
            page: data.page,
            pageSize: data.pageSize,
            totalItems: data.totalItems,
            totalPages: data.totalPages,
          });
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [admin, all, page, pageSize, type]);

  return { articles, isLoading, ...meta };
}
