"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { parsePositiveInt } from "@/lib/pagination";

export function useUrlPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parsePositiveInt(searchParams.get("page"), 1);

  const setPage = useCallback((nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const resetPage = useCallback(() => setPage(1), [setPage]);

  return useMemo(() => ({ page, setPage, resetPage }), [page, resetPage, setPage]);
}
