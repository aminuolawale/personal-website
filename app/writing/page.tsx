"use client";

import dynamic from "next/dynamic";
import { m } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import TabBar from "@/components/TabBar";
import WritingArticleCard from "@/components/WritingArticleCard";
import { useArticles } from "@/lib/hooks/use-articles";
import { useSiteContent } from "@/lib/hooks/use-site-content";
import { useTabConfig } from "@/lib/hooks/use-tab-config";
import { trackEvent } from "@/lib/observability/client";
import { SECTION_TABS } from "@/lib/section-tabs";

const ReaderOverlay = dynamic(() => import("@/components/ReaderOverlay"), { ssr: false });
const ReadingNotesTab = dynamic(() => import("@/components/writing/ReadingNotesTab"), {
  loading: () => <p className="font-mono text-xs text-muted/30">Loading reading notes...</p>,
});

export default function WritingPage() {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    SECTION_TABS.writing.some((tab) => tab.id === urlTab) ? urlTab! : "book-reviews"
  );
  const [reader, setReader] = useState<{
    title: string;
    meta?: string;
    html: string;
    href?: string;
  } | null>(null);

  const { articles, isLoading } = useArticles("writing");
  const { writingTitle, writingDescription } = useSiteContent();
  const { order, labels, visibility } = useTabConfig("writing", SECTION_TABS.writing);
  const orderedTabs = order
    .map((id) => SECTION_TABS.writing.find((tab) => tab.id === id)!)
    .filter(Boolean)
    .filter((tab) => visibility[tab.id] !== false)
    .map((tab) => ({ ...tab, label: labels[tab.id] ?? tab.label }));
  const activeVisibleTab = orderedTabs.some((tab) => tab.id === activeTab)
    ? activeTab
    : orderedTabs[0]?.id ?? "book-reviews";

  function selectWritingTab(tabId: string) {
    setActiveTab(tabId);
    trackEvent({
      name: "public.writing_tab.changed",
      section: "writing",
      targetType: "writing_tab",
      targetId: tabId,
    });
  }

  return (
    <main>
      <PageHeader
        eyebrow="03. Writing"
        title={writingTitle}
        description={writingDescription}
      />

      <section className="py-8 sm:py-14 px-5 sm:px-8 lg:px-16 max-w-6xl mx-auto">
        {orderedTabs.length > 0 && (
          <TabBar tabs={orderedTabs} activeId={activeVisibleTab} onChange={selectWritingTab} />
        )}

        <div className="pt-8 sm:pt-12">
          {activeVisibleTab === "book-reviews" && (
            <>
              {isLoading ? (
                <p className="font-mono text-xs text-muted/30">Loading...</p>
              ) : articles.length === 0 ? (
                <p className="font-mono text-sm text-muted/30 py-16 text-center">
                  No book reviews published yet.
                </p>
              ) : (
                <div className="flex flex-col gap-4 max-w-3xl">
                  {articles.map((article, index) => (
                    <m.div
                      key={article.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06, duration: 0.4 }}
                    >
                      <WritingArticleCard
                        article={article}
                        onOpen={(selectedArticle) => {
                          trackEvent({
                            name: "public.reader.opened",
                            section: "writing",
                            targetType: "article",
                            targetId: selectedArticle.slug,
                          });
                          setReader({
                            title: selectedArticle.title,
                            meta: [selectedArticle.date, selectedArticle.readTime].filter(Boolean).join(" · "),
                            html: selectedArticle.content,
                            href: `/writing/${selectedArticle.slug}`,
                          });
                        }}
                      />
                    </m.div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeVisibleTab === "reading-notes" && <ReadingNotesTab />}
        </div>
      </section>

      <ReaderOverlay
        open={Boolean(reader)}
        title={reader?.title ?? ""}
        meta={reader?.meta}
        html={reader?.html ?? ""}
        href={reader?.href}
        onClose={() => setReader(null)}
      />
    </main>
  );
}
