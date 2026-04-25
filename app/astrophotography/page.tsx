"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import TabBar from "@/components/TabBar";
import ArticlesTab from "@/components/astrophotography/ArticlesTab";
import CalendarTab from "@/components/astrophotography/CalendarTab";
import { useArticles } from "@/lib/hooks/use-articles";
import type { Article } from "@/lib/schema";

/**
 * To add a new tab:
 *  1. Create a component in components/astrophotography/
 *  2. Add one entry to ASTRO_TABS below.
 */
interface AstroTabConfig {
  id: string;
  label: string;
  renderContent: (articles: Article[], isLoading: boolean) => React.ReactNode;
}

const ASTRO_TABS: AstroTabConfig[] = [
  {
    id: "articles",
    label: "Articles",
    renderContent: (articles, isLoading) => (
      <ArticlesTab articles={articles} isLoading={isLoading} />
    ),
  },
  {
    id: "calendar",
    label: "Astro Calendar",
    renderContent: () => <CalendarTab />,
  },
];

export default function AstrophotographyPage() {
  const [activeTabId, setActiveTabId] = useState(ASTRO_TABS[0].id);
  const { articles, isLoading } = useArticles("astrophotography");

  const activeTab = ASTRO_TABS.find((tab) => tab.id === activeTabId)!;

  return (
    <main>
        <PageHeader
          eyebrow="02. Astrophotography"
          title="Capturing the Night Sky"
          description="Session logs from Zurich and the Swiss Alps — acquisition planning, capture notes, and post-processing walkthroughs."
        >
          <TabBar
            tabs={ASTRO_TABS}
            activeId={activeTabId}
            onChange={setActiveTabId}
            layoutId="astrophotography-tab-indicator"
          />
        </PageHeader>

        <section className="py-10 sm:py-16 px-6 sm:px-16 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTabId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab.renderContent(articles, isLoading)}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
  );
}
