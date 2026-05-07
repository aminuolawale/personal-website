import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import WritingArticleCard from "@/components/WritingArticleCard";
import type { Article } from "@/lib/schema";

const ReaderOverlay = dynamic(() => import("@/components/ReaderOverlay"), { ssr: false });

interface ArticlesTabProps {
  articles: Article[];
  isLoading: boolean;
}

export default function ArticlesTab({ articles, isLoading }: ArticlesTabProps) {
  const [readerArticle, setReaderArticle] = useState<Article | null>(null);
  const closeReader = useCallback(() => setReaderArticle(null), []);

  if (isLoading) {
    return (
      <p className="font-mono text-xs text-muted/30 text-center py-16">
        Loading…
      </p>
    );
  }

  if (articles.length === 0) {
    return (
      <p className="font-mono text-sm text-muted/30 text-center py-16">
        No articles published yet.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {articles.map((article) => (
          <WritingArticleCard
            key={article.id}
            article={article}
            basePath="/swe"
            onOpen={setReaderArticle}
          />
        ))}
      </div>
      <ReaderOverlay
        open={Boolean(readerArticle)}
        title={readerArticle?.title ?? ""}
        meta={[readerArticle?.date, readerArticle?.readTime].filter(Boolean).join(" · ")}
        html={readerArticle?.content ?? ""}
        href={readerArticle ? `/swe/${readerArticle.slug}` : undefined}
        onClose={closeReader}
      />
    </>
  );
}
