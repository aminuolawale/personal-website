"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ArticleForm from "@/components/admin/ArticleForm";

const VALID_TYPES = ["writing", "astrophotography", "swe"] as const;
type ArticleType = (typeof VALID_TYPES)[number];

function NewArticleContent() {
  const params = useSearchParams();
  const raw = params.get("type");
  const defaultType: ArticleType = VALID_TYPES.find((t) => t === raw) ?? "writing";
  return <ArticleForm defaultType={defaultType} />;
}

export default function NewArticlePage() {
  return (
    <Suspense>
      <NewArticleContent />
    </Suspense>
  );
}
