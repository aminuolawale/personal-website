"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import {m} from "framer-motion";
import TagBadge from "@/components/TagBadge";
import { ASTRO_TAG_COLORS } from "@/lib/tag-colors";
import { splitTags } from "@/lib/utils";
import type { Article } from "@/lib/schema";

export default function AstroSessionPage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/articles/by-slug/${slug}?type=astrophotography`)
      .then((response) => {
        if (!response.ok) { setIsNotFound(true); return null; }
        return response.json();
      })
      .then((data) => { if (data) setArticle(data); })
      .finally(() => setIsLoading(false));
  }, [slug]);

  const tags = article ? splitTags(article.tags) : [];

  return (
    <main className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-6 sm:px-16 max-w-3xl mx-auto">
        <Link
          href="/astrophotography"
          className="inline-flex items-center gap-2 font-mono text-xs text-[#edd382]/40 hover:text-[#fc9e4f] transition-colors mb-12"
        >
          <ArrowLeft size={13} />
          All Sessions
        </Link>

        {isLoading && (
          <p className="font-mono text-xs text-[#edd382]/30">Loading…</p>
        )}

        {isNotFound && !isLoading && (
          <p className="font-mono text-sm text-[#edd382]/50">Session not found.</p>
        )}

        {article && (
          <m.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <header className="mb-12 pb-8 border-b border-[#f2f3ae]/10">
              <h1 className="text-[#f2f3ae] text-3xl sm:text-4xl font-bold leading-tight mb-6">
                {article.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4">
                <span className="font-mono text-xs text-[#edd382]/40">{article.date}</span>
                {article.location && (
                  <span className="flex items-center gap-1 font-mono text-xs text-[#edd382]/35">
                    <MapPin size={11} />
                    {article.location}
                  </span>
                )}
                {article.readTime && (
                  <span className="font-mono text-xs text-[#edd382]/30">{article.readTime}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <TagBadge key={tag} tag={tag} colorMap={ASTRO_TAG_COLORS} />
                ))}
              </div>
            </header>

            <div
              className="article-content"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </m.article>
        )}
      </main>
  );
}
