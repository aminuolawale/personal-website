"use client";

import { Suspense, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import TabBar, { type TabConfig } from "@/components/TabBar";
import ArticlesTab from "@/components/astrophotography/ArticlesTab";
import dynamic from "next/dynamic";
import { useTabConfig } from "@/lib/hooks/use-tab-config";
import { usePersistentTab } from "@/lib/hooks/use-persistent-tab";

const CalendarTab = dynamic(() => import("@/components/astrophotography/CalendarTab"));
const GalleryTab = dynamic(() => import("@/components/astrophotography/GalleryTab"), {
  loading: () => <p className="font-mono text-xs text-muted/30">Loading gallery…</p>,
});
const GearTab = dynamic(() => import("@/components/astrophotography/GearTab"), {
  loading: () => <p className="font-mono text-xs text-muted/30">Loading gear…</p>,
});
const NightSkyMap = dynamic(() => import("@/components/astrophotography/NightSkyMap"), { ssr: false });
import { useArticles } from "@/lib/hooks/use-articles";
import { useUrlPage } from "@/lib/hooks/use-url-page";
import { useSiteContent } from "@/lib/hooks/use-site-content";
import { useSectionVisibility } from "@/lib/hooks/use-section-visibility";
import { getVisibleSectionNumber } from "@/lib/section-visibility";
import { SECTION_TABS } from "@/lib/section-tabs";
import type { Article } from "@/lib/schema";

type AstroTab = TabConfig & {
  renderContent: (
    articles: Article[],
    isLoading: boolean,
    pagination: { page: number; totalPages: number; setPage: (page: number) => void }
  ) => React.ReactNode;
};

const ASTRO_TABS: AstroTab[] = [
  {
    ...SECTION_TABS.astrophotography[0],
    renderContent: (articles, isLoading, pagination) => (
      <ArticlesTab articles={articles} isLoading={isLoading} {...pagination} />
    ),
  },
  {
    ...SECTION_TABS.astrophotography[1],
    renderContent: () => <CalendarTab />,
  },
  {
    ...SECTION_TABS.astrophotography[2],
    renderContent: () => <GalleryTab />,
  },
  {
    ...SECTION_TABS.astrophotography[3],
    renderContent: () => <GearTab />,
  },
  {
    ...SECTION_TABS.astrophotography[4],
    renderContent: () => <NightSkyMap />,
  },
];

const TAB_IDS_SET = new Set(ASTRO_TABS.map((t) => t.id));

function AstrophotographyContent() {
  const visibilityConfig = useSectionVisibility();
  const sectionNumber = getVisibleSectionNumber("astrophotography", visibilityConfig);
  const eyebrow = sectionNumber ? `${sectionNumber}. Astrophotography` : "Astrophotography";

  const { order, labels, visibility } = useTabConfig("astrophotography", ASTRO_TABS);
  const orderedTabs = useMemo(() => order
    .map((id) => ASTRO_TABS.find((t) => t.id === id)!)
    .filter(Boolean)
    .filter((t) => visibility[t.id] !== false)
    .map((t) => ({ ...t, label: labels[t.id] ?? t.label })),
  [order, labels, visibility]);

  const [activeTabId, setActiveTabId] = usePersistentTab("astrophotography", orderedTabs[0]?.id ?? ASTRO_TABS[0].id, TAB_IDS_SET);
  const { page, setPage, resetPage } = useUrlPage();
  const { articles, isLoading, totalPages } = useArticles("astrophotography", { page, pageSize: 9 });
  const { astroTitle, astroDescription } = useSiteContent();

  const activeTab = orderedTabs.find((tab) => tab.id === activeTabId) ?? orderedTabs[0] ?? ASTRO_TABS[0];

  function selectTab(tabId: string) {
    setActiveTabId(tabId);
    resetPage();
  }

  return (
    <main>
      <PageHeader
        eyebrow={eyebrow}
        title={astroTitle}
        description={astroDescription}
      >
        <button
          onClick={() => selectTab("sky")}
          className="mb-8 font-mono text-sm text-accent hover:text-accent/70 transition-colors"
        >
          See the night sky →
        </button>
        <TabBar
          tabs={orderedTabs}
          activeId={activeTab.id}
          onChange={selectTab}
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
            {activeTab.renderContent(articles, isLoading, { page, totalPages, setPage })}
          </m.div>
        </AnimatePresence>
      </section>
    </main>
  );
}

export default function AstrophotographyPage() {
  return (
    <Suspense>
      <AstrophotographyContent />
    </Suspense>
  );
}
