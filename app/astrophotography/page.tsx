"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { MapPin } from "lucide-react";
import PageShell from "@/components/PageShell";
import type { Article } from "@/lib/schema";

const TAG_COLORS: Record<string, string> = {
  acquisition: "text-[#fc9e4f] bg-[#fc9e4f]/10 border-[#fc9e4f]/25",
  capture: "text-[#edd382] bg-[#edd382]/10 border-[#edd382]/25",
  processing: "text-[#f2f3ae]/70 bg-[#f2f3ae]/5 border-[#f2f3ae]/15",
};

const TABS = ["Articles", "Astro Calendar"] as const;
type Tab = (typeof TABS)[number];

export default function AstrophotographyPage() {
  const [tab, setTab] = useState<Tab>("Articles");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/articles?type=astrophotography")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setArticles(data); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell>
      <main>
        {/* Page header */}
        <section className="pt-40 pb-0 px-6 sm:px-16 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="font-mono text-[#fc9e4f] text-sm mb-4">02. Astrophotography</p>
            <h1 className="text-[clamp(36px,6vw,64px)] font-bold text-[#f2f3ae] leading-tight mb-6">
              Capturing the Night Sky
            </h1>
            <p className="text-[#edd382]/65 text-lg max-w-xl leading-relaxed mb-12">
              Session logs from Zurich and the Swiss Alps — acquisition planning,
              capture notes, and post-processing walkthroughs.
            </p>

            {/* Tab bar */}
            <div className="flex border-b border-[#f2f3ae]/10">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`relative font-mono text-sm px-5 py-3 transition-colors duration-200 ${
                    tab === t
                      ? "text-[#fc9e4f]"
                      : "text-[#edd382]/40 hover:text-[#edd382]/70"
                  }`}
                >
                  {t}
                  {tab === t && (
                    <motion.div
                      layoutId="astro-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-px bg-[#fc9e4f]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Tab content */}
        <section className="py-16 px-6 sm:px-16 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {tab === "Articles" && (
              <motion.div
                key="articles"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {loading ? (
                  <p className="font-mono text-xs text-[#edd382]/30">Loading…</p>
                ) : articles.length === 0 ? (
                  <p className="font-mono text-sm text-[#edd382]/30 py-16 text-center">
                    No sessions published yet.
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {articles.map((article, i) => {
                      const tags = article.tags
                        ? article.tags.split(",").map((t) => t.trim()).filter(Boolean)
                        : [];
                      return (
                        <motion.div
                          key={article.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06, duration: 0.4 }}
                        >
                          <Link href={`/astrophotography/${article.slug}`} className="group block h-full">
                            <article className="h-full bg-[#f2f3ae]/[0.025] border border-[#f2f3ae]/10 p-6 flex flex-col gap-4 hover:bg-[#f2f3ae]/[0.045] hover:border-[#fc9e4f]/25 hover:-translate-y-1 transition-all duration-300">
                              {tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
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
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {tab === "Astro Calendar" && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-full overflow-x-auto">
                  <iframe
                    src="https://calendar.google.com/calendar/embed?src=65fc31ff0683c8c738a8324e9fc397a558af6e82cda10d3e1bd785b90b9eeddc%40group.calendar.google.com&ctz=Europe%2FZurich"
                    style={{ border: 0, colorScheme: "normal" }}
                    width="800"
                    height="600"
                    frameBorder={0}
                    scrolling="no"
                    className="max-w-full"
                    title="Astro Calendar"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </PageShell>
  );
}
