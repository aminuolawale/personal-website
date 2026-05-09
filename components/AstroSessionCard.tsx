import Link from "next/link";
import { MapPin } from "lucide-react";
import TagBadge from "@/components/TagBadge";
import { ASTRO_TAG_COLORS } from "@/lib/tag-colors";
import { splitTags } from "@/lib/utils";
import type { Article } from "@/lib/schema";

interface AstroSessionCardProps {
  article: Article;
  onOpen?: (article: Article) => void;
}

function CardContent({ article }: { article: Article }) {
  const tags = splitTags(article.tags);

  return (
    <article className="article-card h-full border p-6 flex flex-col gap-4 hover:-translate-y-1 transition-all duration-300">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <TagBadge key={tag} tag={tag} colorMap={ASTRO_TAG_COLORS} />
          ))}
        </div>
      )}

      <h2 className="article-card-title font-semibold text-base leading-snug transition-colors duration-200">
        {article.title}
      </h2>

      {article.summary && (
        <p className="article-card-summary text-sm leading-relaxed flex-1">
          {article.summary}
        </p>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-surface/[0.06]">
        <div>
          <p className="font-mono text-xs article-card-meta">{article.date}</p>
          {article.location && (
            <p className="flex items-center gap-1 font-mono text-xs article-card-meta-subtle mt-0.5">
              <MapPin size={10} />
              {article.location}
            </p>
          )}
        </div>
        {article.readTime && (
          <span className="font-mono text-xs article-card-meta-subtle">
            {article.readTime}
          </span>
        )}
      </div>
    </article>
  );
}

export default function AstroSessionCard({ article, onOpen }: AstroSessionCardProps) {
  if (onOpen) {
    return (
      <button
        type="button"
        onClick={() => onOpen(article)}
        className="group block h-full w-full text-left"
      >
        <CardContent article={article} />
      </button>
    );
  }

  return (
    <Link href={`/astrophotography/${article.slug}`} className="group block h-full">
      <CardContent article={article} />
    </Link>
  );
}
