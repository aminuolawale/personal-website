"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {m, AnimatePresence} from "framer-motion";
import PageHeader from "@/components/PageHeader";
import TabBar, { type TabConfig } from "@/components/TabBar";
import ArticlesTab from "@/components/astrophotography/ArticlesTab";
import CalendarTab from "@/components/astrophotography/CalendarTab";
import GalleryTab from "@/components/astrophotography/GalleryTab";
import GearTab from "@/components/astrophotography/GearTab";
import NightSkyMap from "@/components/astrophotography/NightSkyMap";
import { useTabOrder } from "@/lib/hooks/use-tab-order";
import { useArticles } from "@/lib/hooks/use-articles";
import { useSiteContent } from "@/lib/hooks/use-site-content";
import type { Article } from "@/lib/schema";

type AstroTab = TabConfig & {
  renderContent: (articles: Article[], isLoading: boolean) => React.ReactNode;
};

const ASTRO_TABS: AstroTab[] = [
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
  {
    id: "gallery",
    label: "Gallery",
    renderContent: () => <GalleryTab />,
  },
  {
    id: "gear",
    label: "Gear",
    renderContent: () => <GearTab />,
  },
  {
    id: "sky",
    label: "Night Sky",
    renderContent: () => <NightSkyMap />,
  },
];

const TAB_IDS = new Set(ASTRO_TABS.map((t) => t.id));

function AstrophotographyContent() {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");
  const validUrlTab = urlTab && TAB_IDS.has(urlTab) ? urlTab : null;

  const tabOrder = useTabOrder("astrophotography", ASTRO_TABS.map((t) => t.id));
  const orderedTabs = tabOrder.map((id) => ASTRO_TABS.find((t) => t.id === id)!).filter(Boolean);

  const [activeTabId, setActiveTabId] = useState<string | null>(validUrlTab);
  const { articles, isLoading } = useArticles("astrophotography");
  const { astroTitle, astroDescription } = useSiteContent();

  const activeTab = orderedTabs.find((tab) => tab.id === activeTabId) ?? orderedTabs[0];

  return (
    <main>
      <PageHeader
        eyebrow="02. Astrophotography"
        title={astroTitle}
        description={astroDescription}
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

export default function AstrophotographyPage() {
  return (
    <Suspense>
      <AstrophotographyContent />
    </Suspense>
  );
}
