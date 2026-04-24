"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";
import type { Article } from "@/lib/schema";

const TAG_COLORS: Record<string, string> = {
  essay: "text-[#fc9e4f] bg-[#fc9e4f]/10 border-[#fc9e4f]/25",
  personal: "text-[#edd382] bg-[#edd382]/10 border-[#edd382]/25",
  guide: "text-[#f2f3ae]/70 bg-[#f2f3ae]/5 border-[#f2f3ae]/15",
  astronomy: "text-[#fc9e4f] bg-[#fc9e4f]/10 border-[#fc9e4f]/25",
  software: "text-[#edd382] bg-[#edd382]/10 border-[#edd382]/25",
  astrophotography: "text-[#f2f3ae]/70 bg-[#f2f3ae]/5 border-[#f2f3ae]/15",
  career: "text-[#f2f3ae]/70 bg-[#f2f3ae]/5 border-[#f2f3ae]/15",
  craft: "text-[#edd382] bg-[#edd382]/10 border-[#edd382]/25",
  life: "text-[#fc9e4f] bg-[#fc9e4f]/10 border-[#fc9e4f]/25",
};

export default function WritingArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/articles/by-slug/${slug}?type=writing`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => { if (data) setArticle(data); })
      .finally(() => setLoading(false));
  }, [slug]);

  const tags = article?.tags ? article.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  return (
    <PageShell>
      <main className="pt-32 pb-24 px-6 sm:px-16 max-w-3xl mx-auto">
        <Link
          href="/writing"
          className="inline-flex items-center gap-2 font-mono text-xs text-[#edd382]/40 hover:text-[#fc9e4f] transition-colors mb-12"
        >
          <ArrowLeft size={13} />
          All Writing
        </Link>

        {loading && (
          <p className="font-mono text-xs text-[#edd382]/30">Loading…</p>
        )}

        {notFound && !loading && (
          <p className="font-mono text-sm text-[#edd382]/50">Article not found.</p>
        )}

        {article && (
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <header className="mb-12 pb-8 border-b border-[#f2f3ae]/10">
              <h1 className="text-[#f2f3ae] text-3xl sm:text-4xl font-bold leading-tight mb-6">
                {article.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4">
                <span className="font-mono text-xs text-[#edd382]/40">{article.date}</span>
                {article.readTime && (
                  <span className="font-mono text-xs text-[#edd382]/30">{article.readTime}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 border ${
                      TAG_COLORS[tag] ?? "text-[#f2f3ae]/50 border-[#f2f3ae]/15 bg-transparent"
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </header>

            {/* Content */}
            <div
              className="article-content"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </motion.article>
        )}
      </main>
    </PageShell>
  );
}
