"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import TabBar from "@/components/TabBar";
import { useArticles } from "@/lib/hooks/use-articles";
import { useTabConfig } from "@/lib/hooks/use-tab-config";
import { useSiteContent } from "@/lib/hooks/use-site-content";
import type { Article } from "@/lib/schema";

function MiscContent() {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");

  const { articles, isLoading } = useArticles("misc");
  const { miscTitle, miscDescription } = useSiteContent();

  // Map articles to tab objects
  const articleTabs = articles.map((article) => ({
    id: article.slug,
    label: article.title,
    content: article.content,
  }));

  const { order, labels, visibility } = useTabConfig("misc", articleTabs);

  // Apply config (order, label overrides, visibility)
  const orderedTabs = order
    .map((id) => articleTabs.find((t) => t.id === id)!)
    .filter(Boolean)
    .filter((t) => visibility[t.id] !== false)
    .map((t) => ({ ...t, label: labels[t.id] ?? t.label }));

  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  useEffect(() => {
    if (orderedTabs.length > 0 && !activeTabId) {
      const validUrlTab = urlTab && orderedTabs.some((t) => t.id === urlTab) ? urlTab : null;
      setActiveTabId(validUrlTab || orderedTabs[0].id);
    }
  }, [orderedTabs, activeTabId, urlTab]);

  const activeTab = orderedTabs.find((tab) => tab.id === activeTabId) ?? orderedTabs[0];

  return (
    <main>
      <PageHeader
        eyebrow="04. Miscellaneous"
        title={miscTitle}
        description={miscDescription}
      >
        {orderedTabs.length > 0 && (
          <TabBar
            tabs={orderedTabs}
            activeId={activeTab?.id}
            onChange={setActiveTabId}
          />
        )}
      </PageHeader>

      <section className="py-10 sm:py-16 px-6 sm:px-16 max-w-4xl mx-auto">
        {isLoading ? (
          <p className="font-mono text-xs text-muted/30">Loading articles…</p>
        ) : orderedTabs.length === 0 ? (
          <div className="py-20 text-center border border-surface/10 bg-surface/[0.02]">
            <p className="font-mono text-sm text-muted/40 uppercase tracking-widest">
              No articles found in this section yet.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab && (
              <m.div
                key={activeTab.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <article className="article-content" dangerouslySetInnerHTML={{ __html: activeTab.content }} />
              </m.div>
            )}
          </AnimatePresence>
        )}
      </section>
    </main>
  );
}

export default function MiscPage() {
  return (
    <Suspense>
      <MiscContent />
    </Suspense>
  );
}
