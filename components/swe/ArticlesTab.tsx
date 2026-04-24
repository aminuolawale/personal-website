import WritingArticleCard from "@/components/WritingArticleCard";
import type { Article } from "@/lib/schema";

interface ArticlesTabProps {
  articles: Article[];
  isLoading: boolean;
}

export default function ArticlesTab({ articles, isLoading }: ArticlesTabProps) {
  if (isLoading) {
    return (
      <p className="font-mono text-xs text-[#edd382]/30 text-center py-16">
        Loading…
      </p>
    );
  }

  if (articles.length === 0) {
    return (
      <p className="font-mono text-sm text-[#edd382]/30 text-center py-16">
        No articles published yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <WritingArticleCard key={article.id} article={article} basePath="/swe" />
      ))}
    </div>
  );
}
