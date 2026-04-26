import Link from "next/link";
import TagBadge from "@/components/TagBadge";
import { WRITING_TAG_COLORS } from "@/lib/tag-colors";
import { splitTags } from "@/lib/utils";
import type { Article } from "@/lib/schema";

interface WritingArticleCardProps {
  article: Article;
  basePath?: string;
}

export default function WritingArticleCard({ article, basePath = "/writing" }: WritingArticleCardProps) {
  const tags = splitTags(article.tags);

  return (
    <Link href={`${basePath}/${article.slug}`} className="group block">
      <article className="bg-surface/[0.025] border border-surface/10 p-6 flex flex-col sm:flex-row sm:items-start gap-5 hover:bg-surface/[0.045] hover:border-accent/25 transition-all duration-300">
        <div className="shrink-0 sm:w-28">
          <p className="font-mono text-xs text-muted/35">{article.date}</p>
          {article.readTime && (
            <p className="font-mono text-xs text-muted/25 mt-0.5">
              {article.readTime}
            </p>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <h2 className="text-surface font-semibold text-lg leading-snug group-hover:text-accent transition-colors duration-200">
            {article.title}
          </h2>
          {article.summary && (
            <p className="text-muted/50 text-sm leading-relaxed">
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
    </Link>
  );
}
