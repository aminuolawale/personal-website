import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { m } from "framer-motion";
import Pagination from "@/components/Pagination";
import AstroSessionCard from "@/components/AstroSessionCard";
import type { Article } from "@/lib/schema";

const ReaderOverlay = dynamic(() => import("@/components/ReaderOverlay"), { ssr: false });

interface ArticlesTabProps {
  articles: Article[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}

export default function ArticlesTab({ articles, isLoading, page, totalPages, setPage }: ArticlesTabProps) {
  const [readerArticle, setReaderArticle] = useState<Article | null>(null);
  const closeReader = useCallback(() => setReaderArticle(null), []);

  if (isLoading) {
    return <p className="font-mono text-xs text-muted/30">Loading…</p>;
  }

  if (articles.length === 0) {
    return (
      <p className="font-mono text-sm text-muted/30 py-16 text-center">
        No sessions published yet.
      </p>
    );
  }

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {articles.map((article, index) => (
          <m.div
            key={article.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.4 }}
          >
            <AstroSessionCard article={article} onOpen={setReaderArticle} />
          </m.div>
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-8" />
      <ReaderOverlay
        open={Boolean(readerArticle)}
        title={readerArticle?.title ?? ""}
        meta={[readerArticle?.date, readerArticle?.location, readerArticle?.readTime].filter(Boolean).join(" · ")}
        html={readerArticle?.content ?? ""}
        href={readerArticle ? `/astrophotography/${readerArticle.slug}` : undefined}
        onClose={closeReader}
      />
    </>
  );
}
