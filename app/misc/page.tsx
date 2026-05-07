"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import RichTextContent from "@/components/RichTextContent";
import TabBar, { type TabConfig } from "@/components/TabBar";
import TagBadge from "@/components/TagBadge";
import { useArticles } from "@/lib/hooks/use-articles";
import { useSiteContent } from "@/lib/hooks/use-site-content";
import { fetchCachedJson } from "@/lib/client-cache";
import { WRITING_TAG_COLORS } from "@/lib/tag-colors";
import { splitTags } from "@/lib/utils";
import type { Article, MiscSeries, MiscTab } from "@/lib/schema";

const ReaderOverlay = dynamic(() => import("@/components/ReaderOverlay"), { ssr: false });

type DisplayTab = TabConfig & {
  description?: string;
  miscTabId?: number;
  legacyArticle?: Article;
  unassigned?: boolean;
};

function MiscContent() {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");

  const { articles, isLoading } = useArticles("misc");
  const { miscTitle, miscDescription } = useSiteContent();
  const [tabs, setTabs] = useState<MiscTab[]>([]);
  const [seriesList, setSeriesList] = useState<MiscSeries[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | "all">("all");
  const [reader, setReader] = useState<{ title: string; meta?: string; html: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchCachedJson<unknown>("/api/misc-tabs", []),
      fetchCachedJson<unknown>("/api/misc-series", []),
    ]).then(([tabRows, seriesRows]) => {
      if (cancelled) return;
      setTabs(Array.isArray(tabRows) ? tabRows : []);
      setSeriesList(Array.isArray(seriesRows) ? seriesRows : []);
    });
    return () => { cancelled = true; };
  }, []);

  const displayTabs = useMemo<DisplayTab[]>(() => {
    if (tabs.length > 0) {
      const assignedTabIds = new Set(tabs.map((tab) => tab.id));
      const unassignedArticles = articles.filter((article) => !article.miscTabId || !assignedTabIds.has(article.miscTabId));
      return [
        ...tabs.map((tab) => ({
          id: tab.slug,
          label: tab.title,
          description: tab.description,
          miscTabId: tab.id,
        })),
        ...(unassignedArticles.length > 0
          ? [{ id: "unassigned", label: "Unassigned", unassigned: true }]
          : []),
      ];
    }

    return articles.map((article) => ({
      id: article.slug,
      label: article.title,
      legacyArticle: article,
    }));
  }, [tabs, articles]);

  useEffect(() => {
    if (displayTabs.length === 0) return;
    if (activeTabId && displayTabs.some((tab) => tab.id === activeTabId)) return;
    const validUrlTab = urlTab && displayTabs.some((tab) => tab.id === urlTab) ? urlTab : null;
    setActiveTabId(validUrlTab || displayTabs[0].id);
  }, [displayTabs, activeTabId, urlTab]);

  useEffect(() => {
    setSelectedSeriesId("all");
  }, [activeTabId]);

  const activeTab = displayTabs.find((tab) => tab.id === activeTabId) ?? displayTabs[0];
  const activeArticles = useMemo(() => {
    if (!activeTab) return [];
    if (activeTab.legacyArticle) return [activeTab.legacyArticle];
    if (activeTab.unassigned) return articles.filter((article) => !article.miscTabId);
    return articles.filter((article) => article.miscTabId === activeTab.miscTabId);
  }, [activeTab, articles]);

  const seriesById = useMemo(
    () => new Map(seriesList.map((series) => [series.id, series])),
    [seriesList]
  );

  const visibleSeries = useMemo(() => {
    const ids = new Set(activeArticles.map((article) => article.seriesId).filter(Boolean));
    return seriesList.filter((series) => ids.has(series.id));
  }, [activeArticles, seriesList]);

  const filteredArticles = selectedSeriesId === "all"
    ? activeArticles
    : activeArticles.filter((article) => article.seriesId === selectedSeriesId);

  return (
    <main>
      <PageHeader
        eyebrow="04. Miscellaneous"
        title={miscTitle}
        description={miscDescription}
      >
        {displayTabs.length > 0 && (
          <TabBar
            tabs={displayTabs}
            activeId={activeTab?.id}
            onChange={setActiveTabId}
          />
        )}
      </PageHeader>

      <section className="py-10 sm:py-16 px-6 sm:px-16 max-w-4xl mx-auto">
        {isLoading ? (
          <p className="font-mono text-xs text-muted/30">Loading articles…</p>
        ) : displayTabs.length === 0 ? (
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
                className="space-y-6"
              >
                {activeTab.description && (
                  <p className="text-muted/55 leading-relaxed max-w-2xl">{activeTab.description}</p>
                )}

                {activeTab.legacyArticle ? (
                  <RichTextContent html={activeTab.legacyArticle.content} />
                ) : (
                  <>
                    {visibleSeries.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedSeriesId("all")}
                          className={`font-mono text-xs px-3 py-1.5 border transition-all ${
                            selectedSeriesId === "all"
                              ? "bg-accent text-base border-accent"
                              : "text-muted/50 border-surface/15 hover:border-accent/40"
                          }`}
                        >
                          All series
                        </button>
                        {visibleSeries.map((series) => (
                          <button
                            key={series.id}
                            type="button"
                            onClick={() => setSelectedSeriesId(series.id)}
                            className={`font-mono text-xs px-3 py-1.5 border transition-all ${
                              selectedSeriesId === series.id
                                ? "bg-accent text-base border-accent"
                                : "text-muted/50 border-surface/15 hover:border-accent/40"
                            }`}
                          >
                            {series.title}
                          </button>
                        ))}
                      </div>
                    )}

                    {filteredArticles.length === 0 ? (
                      <p className="font-mono text-sm text-muted/30 py-12 text-center border border-surface/10">
                        No articles in this tab yet.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {filteredArticles.map((article) => {
                          const tags = splitTags(article.tags);
                          const series = article.seriesId ? seriesById.get(article.seriesId) : null;
                          return (
                            <button
                              key={article.id}
                              type="button"
                              onClick={() => setReader({
                                title: article.title,
                                meta: [article.date, series?.title, article.readTime].filter(Boolean).join(" · "),
                                html: article.content,
                              })}
                              className="group block w-full text-left border border-surface/10 bg-surface/[0.02] p-5 hover:border-accent/25 hover:bg-surface/[0.04] transition-colors"
                            >
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                {series && (
                                  <span className="font-mono text-[10px] uppercase tracking-widest text-accent/70 border border-accent/20 px-2 py-0.5">
                                    {series.title}
                                  </span>
                                )}
                                {article.date && <span className="font-mono text-xs text-muted/35">{article.date}</span>}
                              </div>
                              <h2 className="text-surface font-semibold text-lg leading-snug group-hover:text-accent transition-colors">
                                {article.title}
                              </h2>
                              {article.summary && <p className="text-muted/50 text-sm leading-relaxed mt-2">{article.summary}</p>}
                              {tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-3">
                                  {tags.map((tag) => (
                                    <TagBadge key={tag} tag={tag} colorMap={WRITING_TAG_COLORS} />
                                  ))}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </m.div>
            )}
          </AnimatePresence>
        )}
      </section>

      <ReaderOverlay
        open={Boolean(reader)}
        title={reader?.title ?? ""}
        meta={reader?.meta}
        html={reader?.html ?? ""}
        onClose={() => setReader(null)}
      />
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
