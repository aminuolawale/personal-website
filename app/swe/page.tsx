"use client";

import { useState } from "react";
import {m, AnimatePresence} from "framer-motion";
import PageHeader from "@/components/PageHeader";
import TabBar from "@/components/TabBar";
import ArticlesTab from "@/components/swe/ArticlesTab";
import ProjectsTab from "@/components/swe/ProjectsTab";
import AboutMeTab from "@/components/swe/AboutMeTab";
import { useArticles } from "@/lib/hooks/use-articles";
import { useTabOrder } from "@/lib/hooks/use-tab-order";
import type { Article } from "@/lib/schema";

/**
 * To add a new tab:
 *  1. Create a component in components/swe/
 *  2. Add one entry to SWE_TABS below.
 */
interface SweTabConfig {
  id: string;
  label: string;
  renderContent: (articles: Article[], isLoading: boolean) => React.ReactNode;
}

const SWE_TABS: SweTabConfig[] = [
  {
    id: "articles",
    label: "Articles",
    renderContent: (articles, isLoading) => (
      <ArticlesTab articles={articles} isLoading={isLoading} />
    ),
  },
  {
    id: "projects",
    label: "Projects",
    renderContent: () => <ProjectsTab />,
  },
  {
    id: "about",
    label: "About Me",
    renderContent: () => <AboutMeTab />,
  },
];

export default function SwePage() {
  const tabOrder = useTabOrder("swe", SWE_TABS.map((t) => t.id));
  const orderedTabs = tabOrder.map((id) => SWE_TABS.find((t) => t.id === id)!).filter(Boolean);

  const [activeTabId, setActiveTabId] = useState(SWE_TABS[0].id);
  const { articles, isLoading } = useArticles("swe");

  const activeTab = orderedTabs.find((tab) => tab.id === activeTabId) ?? orderedTabs[0];;

  return (
    <main>
        <PageHeader
          eyebrow="01. Engineering"
          title="Software Engineering"
          description="Building software since 2019 — web applications, APIs, microservices, and the tools that tie them together."
        >
          <TabBar
            tabs={orderedTabs}
            activeId={activeTabId}
            onChange={setActiveTabId}
            layoutId="swe-tab-indicator"
          />
        </PageHeader>

        <section className="py-10 sm:py-16 px-6 sm:px-16 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <m.div
              key={activeTabId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab.renderContent(articles, isLoading)}
            </m.div>
          </AnimatePresence>
        </section>
      </main>
  );
}
