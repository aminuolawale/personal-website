"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
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

export default function WritingPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/articles?type=writing")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setArticles(data); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell>
      <main>
        <section className="pt-40 pb-4 px-6 sm:px-16 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="font-mono text-[#fc9e4f] text-sm mb-4">03. Writing</p>
            <h1 className="text-[clamp(36px,6vw,64px)] font-bold text-[#f2f3ae] leading-tight mb-6">
              Essays & Reflections
            </h1>
            <p className="text-[#edd382]/65 text-lg max-w-xl leading-relaxed">
              On technology, the cosmos, and the occasional personal dispatch from
              life in Zurich.
            </p>
          </motion.div>
        </section>

        <section className="py-20 px-6 sm:px-16 max-w-6xl mx-auto">
          {loading ? (
            <p className="font-mono text-xs text-[#edd382]/30">Loading…</p>
          ) : articles.length === 0 ? (
            <p className="font-mono text-sm text-[#edd382]/30 py-16 text-center">
              No articles published yet.
            </p>
          ) : (
            <div className="flex flex-col gap-4 max-w-3xl">
              {articles.map((article, i) => {
                const tags = article.tags
                  ? article.tags.split(",").map((t) => t.trim()).filter(Boolean)
                  : [];
                return (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.4 }}
                  >
                    <Link href={`/writing/${article.slug}`} className="group block">
                      <article className="bg-[#f2f3ae]/[0.025] border border-[#f2f3ae]/10 p-6 flex flex-col sm:flex-row sm:items-start gap-5 hover:bg-[#f2f3ae]/[0.045] hover:border-[#fc9e4f]/25 transition-all duration-300">
                        <div className="shrink-0 sm:w-28">
                          <p className="font-mono text-xs text-[#edd382]/35">{article.date}</p>
                          {article.readTime && (
                            <p className="font-mono text-xs text-[#edd382]/25 mt-0.5">{article.readTime}</p>
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
                                <span
                                  key={tag}
                                  className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 border rounded-sm ${
                                    TAG_COLORS[tag] ?? "text-[#f2f3ae]/50 bg-[#f2f3ae]/5 border-[#f2f3ae]/15"
                                  }`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </article>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </PageShell>
  );
}
