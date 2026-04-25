"use client";

import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import WritingArticleCard from "@/components/WritingArticleCard";
import { useArticles } from "@/lib/hooks/use-articles";

export default function WritingPage() {
  const { articles, isLoading } = useArticles("writing");

  return (
    <main>
        <PageHeader
          eyebrow="03. Writing"
          title="Essays & Reflections"
          description="On technology, the cosmos, and the occasional personal dispatch from life in Zurich."
        />

        <section className="py-10 sm:py-20 px-6 sm:px-16 max-w-6xl mx-auto">
          {isLoading ? (
            <p className="font-mono text-xs text-[#edd382]/30">Loading…</p>
          ) : articles.length === 0 ? (
            <p className="font-mono text-sm text-[#edd382]/30 py-16 text-center">
              No articles published yet.
            </p>
          ) : (
            <div className="flex flex-col gap-4 max-w-3xl">
              {articles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.4 }}
                >
                  <WritingArticleCard article={article} />
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>
  );
}
