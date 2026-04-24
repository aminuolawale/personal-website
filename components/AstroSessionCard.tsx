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
      <article className="h-full bg-[#f2f3ae]/[0.025] border border-[#f2f3ae]/10 p-6 flex flex-col gap-4 hover:bg-[#f2f3ae]/[0.045] hover:border-[#fc9e4f]/25 hover:-translate-y-1 transition-all duration-300">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <TagBadge key={tag} tag={tag} colorMap={ASTRO_TAG_COLORS} />
            ))}
          </div>
        )}

        <h2 className="text-[#f2f3ae] font-semibold text-base leading-snug group-hover:text-[#fc9e4f] transition-colors duration-200">
          {article.title}
        </h2>

        {article.summary && (
          <p className="text-[#edd382]/50 text-sm leading-relaxed flex-1">
            {article.summary}
          </p>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-[#f2f3ae]/[0.06]">
          <div>
            <p className="font-mono text-xs text-[#edd382]/40">{article.date}</p>
            {article.location && (
              <p className="flex items-center gap-1 font-mono text-xs text-[#edd382]/30 mt-0.5">
                <MapPin size={10} />
                {article.location}
              </p>
            )}
          </div>
          {article.readTime && (
            <span className="font-mono text-xs text-[#edd382]/30">
              {article.readTime}
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}
