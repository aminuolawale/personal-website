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
      <article className="bg-[#f2f3ae]/[0.025] border border-[#f2f3ae]/10 p-6 flex flex-col sm:flex-row sm:items-start gap-5 hover:bg-[#f2f3ae]/[0.045] hover:border-[#fc9e4f]/25 transition-all duration-300">
        <div className="shrink-0 sm:w-28">
          <p className="font-mono text-xs text-[#edd382]/35">{article.date}</p>
          {article.readTime && (
            <p className="font-mono text-xs text-[#edd382]/25 mt-0.5">
              {article.readTime}
            </p>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <h2 className="text-[#f2f3ae] font-semibold text-lg leading-snug group-hover:text-[#fc9e4f] transition-colors duration-200">
            {article.title}
          </h2>
          {article.summary && (
            <p className="text-[#edd382]/50 text-sm leading-relaxed">
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
