import Link from "next/link";
import TagBadge from "@/components/TagBadge";
import { WRITING_TAG_COLORS } from "@/lib/tag-colors";
import { splitTags } from "@/lib/utils";
import type { Article } from "@/lib/schema";

interface WritingArticleCardProps {
  article: Article;
  basePath?: string;
  onOpen?: (article: Article) => void;
}

function CardContent({ article }: { article: Article }) {
  const tags = splitTags(article.tags);

  return (
    <article className="article-card border p-6 flex flex-col sm:flex-row sm:items-start gap-5 transition-all duration-300">
      <div className="shrink-0 sm:w-28">
        <p className="font-mono text-xs article-card-meta">{article.date}</p>
        {article.readTime && (
          <p className="font-mono text-xs article-card-meta-subtle mt-0.5">
            {article.readTime}
          </p>
        )}
      </div>

      <div className="flex-1 space-y-3">
        <h2 className="article-card-title font-semibold text-lg leading-snug transition-colors duration-200">
          {article.title}
        </h2>
        {article.summary && (
          <p className="article-card-summary text-sm leading-relaxed">
            {article.summary}
          </p>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {tags.map((tag) => (
              <TagBadge key={tag} tag={tag} colorMap={WRITING_TAG_COLORS} />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export default function WritingArticleCard({ article, basePath = "/writing", onOpen }: WritingArticleCardProps) {
  if (onOpen) {
    return (
      <button
        type="button"
        onClick={() => onOpen(article)}
        className="group block w-full text-left"
      >
        <CardContent article={article} />
      </button>
    );
  }

  return (
    <Link href={`${basePath}/${article.slug}`} className="group block">
      <CardContent article={article} />
    </Link>
  );
}
