"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {m, AnimatePresence} from "framer-motion";
import PageHeader from "@/components/PageHeader";
import TabBar, { type TabConfig } from "@/components/TabBar";
import ArticlesTab from "@/components/swe/ArticlesTab";
import Projects from "@/components/Projects";
import About from "@/components/About";
import Experience from "@/components/Experience";
import { useArticles } from "@/lib/hooks/use-articles";
import { useTabConfig } from "@/lib/hooks/use-tab-config";
import { useSiteContent } from "@/lib/hooks/use-site-content";
import type { Article } from "@/lib/schema";

type SweTab = TabConfig & {
  renderContent: (articles: Article[], isLoading: boolean) => React.ReactNode;
};

const SWE_TABS: SweTab[] = [
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
    renderContent: () => <Projects />,
  },
  {
    id: "about",
    label: "About Me",
    renderContent: () => <div><About /><Experience /></div>,
  },
];

const TAB_IDS = new Set(SWE_TABS.map((t) => t.id));

function SweContent() {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");
  const validUrlTab = urlTab && TAB_IDS.has(urlTab) ? urlTab : null;

  const { order, labels, visibility } = useTabConfig("swe", SWE_TABS);
  const orderedTabs = order
    .map((id) => SWE_TABS.find((t) => t.id === id)!)
    .filter(Boolean)
    .filter((t) => visibility[t.id] !== false)
    .map((t) => ({ ...t, label: labels[t.id] ?? t.label }));

  const [activeTabId, setActiveTabId] = useState<string | null>(validUrlTab);
  const { articles, isLoading } = useArticles("swe");
  const { sweTitle, sweDescription } = useSiteContent();

  const activeTab = orderedTabs.find((tab) => tab.id === activeTabId) ?? orderedTabs[0];

  return (
    <main>
      <PageHeader
        eyebrow="01. Engineering"
        title={sweTitle}
        description={sweDescription}
      >
        <TabBar
          tabs={orderedTabs}
          activeId={activeTab.id}
          onChange={setActiveTabId}
        />
      </PageHeader>

      <section className="py-10 sm:py-16 px-6 sm:px-16 max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          <m.div
            key={activeTab.id}
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

export default function SwePage() {
  return (
    <Suspense>
      <SweContent />
    </Suspense>
  );
}
