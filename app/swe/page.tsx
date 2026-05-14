"use client";

import { Suspense, useMemo } from "react";
import dynamic from "next/dynamic";
import PageHeader from "@/components/PageHeader";
import TabBar, { type TabConfig } from "@/components/TabBar";
import ArticlesTab from "@/components/swe/ArticlesTab";
import ActivityTab from "@/components/swe/ActivityTab";
import { useArticles } from "@/lib/hooks/use-articles";
import { useUrlPage } from "@/lib/hooks/use-url-page";
import { useTabConfig } from "@/lib/hooks/use-tab-config";
import { usePersistentTab } from "@/lib/hooks/use-persistent-tab";
import { useSiteContent } from "@/lib/hooks/use-site-content";
import { useSectionVisibility } from "@/lib/hooks/use-section-visibility";
import { getVisibleSectionNumber } from "@/lib/section-visibility";
import { SECTION_TABS } from "@/lib/section-tabs";
import type { Article } from "@/lib/schema";

const Projects = dynamic(() => import("@/components/Projects"), {
  loading: () => <p className="font-mono text-xs text-muted/30">Loading projects…</p>,
});
const About = dynamic(() => import("@/components/About"), { loading: () => null });
const Experience = dynamic(() => import("@/components/Experience"), { loading: () => null });

type SweTab = TabConfig & {
  renderContent: (
    articles: Article[],
    isLoading: boolean,
    pagination: { page: number; totalPages: number; setPage: (page: number) => void }
  ) => React.ReactNode;
};

const SWE_TABS: SweTab[] = [
  {
    ...SECTION_TABS.swe[0],
    renderContent: (articles, isLoading, pagination) => (
      <ArticlesTab articles={articles} isLoading={isLoading} {...pagination} />
    ),
  },
  {
    ...SECTION_TABS.swe[1],
    renderContent: () => <Projects />,
  },
  {
    ...SECTION_TABS.swe[2],
    renderContent: () => <div><About /><Experience /></div>,
  },
  {
    ...SECTION_TABS.swe[3],
    renderContent: () => <ActivityTab />,
  },
];

const TAB_IDS_SET = new Set(SWE_TABS.map((t) => t.id));

function SweContent() {
  const visibilityConfig = useSectionVisibility();
  const sectionNumber = getVisibleSectionNumber("swe", visibilityConfig);
  const eyebrow = sectionNumber ? `${sectionNumber}. Engineering` : "Engineering";

  const { order, labels, visibility } = useTabConfig("swe", SWE_TABS);
  const orderedTabs = useMemo(() => order
    .map((id) => SWE_TABS.find((t) => t.id === id)!)
    .filter(Boolean)
    .filter((t) => visibility[t.id] !== false)
    .map((t) => ({ ...t, label: labels[t.id] ?? t.label })),
  [order, labels, visibility]);

  const [activeTabId, setActiveTabId] = usePersistentTab(orderedTabs[0]?.id ?? SWE_TABS[0].id, TAB_IDS_SET);
  const { page, setPage, resetPage } = useUrlPage();
  const { articles, isLoading, totalPages } = useArticles("swe", { page, pageSize: 10 });
  const { sweTitle, sweDescription } = useSiteContent();

  const activeTab = orderedTabs.find((tab) => tab.id === activeTabId) ?? orderedTabs[0] ?? SWE_TABS[0];

  function selectTab(tabId: string) {
    setActiveTabId(tabId);
    resetPage();
  }

  return (
    <main>
      <PageHeader
        eyebrow={eyebrow}
        title={sweTitle}
        description={sweDescription}
      >
        <TabBar
          tabs={orderedTabs}
          activeId={activeTab.id}
          onChange={selectTab}
        />
      </PageHeader>

      <section className="py-10 sm:py-16 px-6 sm:px-16 max-w-6xl mx-auto">
        {activeTab.renderContent(articles, isLoading, { page, totalPages, setPage })}
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
