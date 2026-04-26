import Link from "next/link";
import { MapPin } from "lucide-react";
import TagBadge from "@/components/TagBadge";
import { ASTRO_TAG_COLORS } from "@/lib/tag-colors";
import { splitTags } from "@/lib/utils";
import type { Article } from "@/lib/schema";

interface AstroSessionCardProps {
  article: Article;
}

export default function AstroSessionCard({ article }: AstroSessionCardProps) {
  const tags = splitTags(article.tags);

  return (
    <Link href={`/astrophotography/${article.slug}`} className="group block h-full">
      <article className="h-full bg-surface/[0.025] border border-surface/10 p-6 flex flex-col gap-4 hover:bg-surface/[0.045] hover:border-accent/25 hover:-translate-y-1 transition-all duration-300">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <TagBadge key={tag} tag={tag} colorMap={ASTRO_TAG_COLORS} />
            ))}
          </div>
        )}

        <h2 className="text-surface font-semibold text-base leading-snug group-hover:text-accent transition-colors duration-200">
          {article.title}
        </h2>

        {article.summary && (
          <p className="text-muted/50 text-sm leading-relaxed flex-1">
            {article.summary}
          </p>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-surface/[0.06]">
          <div>
            <p className="font-mono text-xs text-muted/40">{article.date}</p>
            {article.location && (
              <p className="flex items-center gap-1 font-mono text-xs text-muted/30 mt-0.5">
                <MapPin size={10} />
                {article.location}
              </p>
            )}
          </div>
          {article.readTime && (
            <span className="font-mono text-xs text-muted/30">
              {article.readTime}
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}
