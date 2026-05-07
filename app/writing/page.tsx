"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { m } from "framer-motion";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import TabBar from "@/components/TabBar";
import WritingArticleCard from "@/components/WritingArticleCard";
import { SECTION_TABS } from "@/lib/section-tabs";
import { useArticles } from "@/lib/hooks/use-articles";
import { useSiteContent } from "@/lib/hooks/use-site-content";
import { fetchCachedJson } from "@/lib/client-cache";
import { trackEvent } from "@/lib/observability/client";
import type { Book, BookCategory, ReadingNote } from "@/lib/schema";

const ReaderOverlay = dynamic(() => import("@/components/ReaderOverlay"), { ssr: false });

function formatNoteDate(value: string | Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function richTextPreview(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export default function WritingPage() {
  const searchParams = useSearchParams();
  const { articles, isLoading } = useArticles("writing");
  const { writingTitle, writingDescription } = useSiteContent();
  const urlTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    SECTION_TABS.writing.some((tab) => tab.id === urlTab) ? urlTab! : "book-reviews"
  );
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [notes, setNotes] = useState<ReadingNote[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [notesLoading, setNotesLoading] = useState(true);
  const [reader, setReader] = useState<{
    title: string;
    meta?: string;
    html: string;
    href?: string;
  } | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadReadingNotes() {
      setNotesLoading(true);
      try {
        const [bookRows, noteRows, categoryRows] = await Promise.all([
          fetchCachedJson<unknown>("/api/books", []),
          fetchCachedJson<unknown>("/api/reading-notes", []),
          fetchCachedJson<unknown>("/api/book-categories", []),
        ]);
        if (cancelled) return;
        const nextBooks = Array.isArray(bookRows) ? bookRows : [];
        setBooks(nextBooks);
        setCategories(Array.isArray(categoryRows) ? categoryRows : []);
        setNotes(Array.isArray(noteRows) ? noteRows : []);
        setSelectedBookId((current) => current ?? nextBooks[0]?.id ?? null);
      } finally {
        if (!cancelled) setNotesLoading(false);
      }
    }

    loadReadingNotes();
    return () => { cancelled = true; };
  }, []);

  const booksWithNotesUnfiltered = useMemo(() => {
    const noteBookIds = new Set(notes.map((note) => note.bookId));
    return books.filter((book) => noteBookIds.has(book.id));
  }, [books, notes]);

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  const visibleCategories = useMemo(() => {
    const categoryIds = new Set(booksWithNotesUnfiltered.map((book) => book.categoryId).filter(Boolean));
    return categories.filter((category) => categoryIds.has(category.id));
  }, [booksWithNotesUnfiltered, categories]);

  const booksWithNotes = useMemo(() => {
    if (selectedCategoryId === "all") return booksWithNotesUnfiltered;
    return booksWithNotesUnfiltered.filter((book) => book.categoryId === selectedCategoryId);
  }, [booksWithNotesUnfiltered, selectedCategoryId]);

  useEffect(() => {
    if (selectedBookId && booksWithNotes.some((book) => book.id === selectedBookId)) return;
    const timer = window.setTimeout(() => {
      setSelectedBookId(booksWithNotes[0]?.id ?? null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [booksWithNotes, selectedBookId]);

  useEffect(() => {
    if (!selectedBookId) return;
    const carousel = carouselRef.current;
    const selected = carousel?.querySelector<HTMLElement>(`[data-book-id="${selectedBookId}"]`);
    selected?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [selectedBookId, selectedCategoryId, booksWithNotes]);

  const selectedBook = booksWithNotes.find((book) => book.id === selectedBookId) ?? null;
  const selectedNotes = notes.filter((note) => note.bookId === selectedBookId);
  const selectedCategoryLabel =
    selectedCategoryId === "all"
      ? "All"
      : categoriesById.get(selectedCategoryId)?.name ?? "Category";
  const filterSummary = selectedBook
    ? `${selectedCategoryLabel} · ${selectedBook.title}`
    : selectedCategoryLabel;

  function selectWritingTab(tabId: string) {
    setActiveTab(tabId);
    trackEvent({
      name: "public.writing_tab.changed",
      section: "writing",
      targetType: "writing_tab",
      targetId: tabId,
    });
  }

  function selectBook(bookId: number) {
    setSelectedBookId(bookId);
    trackEvent({
      name: "public.reading_notes.book_selected",
      section: "writing",
      targetType: "book",
      targetId: bookId,
    });
  }

  const readingNotesFilter = (visibleCategories.length > 0 || booksWithNotes.length > 0) && (
    <div className="border border-surface/10 bg-surface/[0.015]">
      <button
        type="button"
        onClick={() => setFiltersOpen((open) => !open)}
        aria-expanded={filtersOpen}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-surface/[0.025] transition-colors"
      >
        <span className="inline-flex items-center gap-2 min-w-0">
          <SlidersHorizontal size={14} className="text-accent shrink-0" />
          <span className="font-mono text-xs text-muted/45 uppercase tracking-widest shrink-0">
            Filters
          </span>
          <span className="font-mono text-xs text-surface/70 truncate">
            {filterSummary}
          </span>
        </span>
        <ChevronDown
          size={15}
          className={`text-muted/40 shrink-0 transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`}
        />
      </button>

      {filtersOpen && (
        <m.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.18 }}
          className="overflow-hidden border-t border-surface/[0.06]"
        >
          <div className="space-y-4 p-3">
            {visibleCategories.length > 0 && (
              <div>
                <p className="font-mono text-[10px] text-muted/35 uppercase tracking-widest mb-2">
                  Category
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId("all")}
                    className={`font-mono text-xs px-3 py-1.5 border transition-all ${
                      selectedCategoryId === "all"
                        ? "bg-accent text-base border-accent"
                        : "text-muted/50 border-surface/15 hover:border-accent/40"
                    }`}
                  >
                    All
                  </button>
                  {visibleCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(category.id)}
                      className={`font-mono text-xs px-3 py-1.5 border transition-all ${
                        selectedCategoryId === category.id
                          ? "bg-accent text-base border-accent"
                          : "text-muted/50 border-surface/15 hover:border-accent/40"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {booksWithNotes.length > 0 && (
              <div>
                <p className="font-mono text-[10px] text-muted/35 uppercase tracking-widest mb-2">
                  Book
                </p>
                <div className="relative -mx-3 sm:mx-0">
                  <div
                    ref={carouselRef}
                    className="flex gap-3 overflow-x-auto px-3 sm:px-0 pb-1 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {booksWithNotes.map((book) => {
                      const selected = book.id === selectedBookId;
                      return (
                        <button
                          key={book.id}
                          data-book-id={book.id}
                          type="button"
                          onClick={() => selectBook(book.id)}
                          className={`shrink-0 max-w-[16rem] text-left border px-3 py-2 transition-all duration-200 ${
                            selected
                              ? "border-accent bg-accent/10"
                              : "border-surface/10 bg-surface/[0.025] hover:border-accent/30"
                          }`}
                        >
                          <span className="block text-surface text-sm font-semibold leading-snug truncate">
                            {book.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </m.div>
      )}
    </div>
  );

  return (
    <main>
      <PageHeader
        eyebrow="03. Writing"
        title={writingTitle}
        description={writingDescription}
      />

      <section className="py-8 sm:py-14 px-5 sm:px-8 lg:px-16 max-w-6xl mx-auto">
        <TabBar tabs={SECTION_TABS.writing} activeId={activeTab} onChange={selectWritingTab} />

        <div className="pt-8 sm:pt-12">
          {activeTab === "book-reviews" && (
            <>
              {isLoading ? (
                <p className="font-mono text-xs text-muted/30">Loading…</p>
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

          {activeTab === "reading-notes" && (
            <section className="space-y-8">
              {notesLoading ? (
                <p className="font-mono text-xs text-muted/30">Loading…</p>
              ) : booksWithNotes.length === 0 ? (
                <div className="space-y-4">
                  {readingNotesFilter}
                  <p className="font-mono text-sm text-muted/30 py-16 text-center">
                    No reading notes in this category.
                  </p>
                </div>
              ) : (
                <>
                  {readingNotesFilter}

                  {selectedBook && (
                    <div className="max-w-3xl">
                      <div className="mb-6 border-b border-surface/10 pb-4">
                        <h2 className="text-2xl text-surface font-semibold leading-tight">
                          {selectedBook.title}
                        </h2>
                        <p className="mt-1 font-mono text-xs text-muted/40">
                          {selectedBook.author} · {selectedBook.yearPublished}
                        </p>
                        {selectedBook.categoryId && categoriesById.has(selectedBook.categoryId) && (
                          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-accent/70">
                            {categoriesById.get(selectedBook.categoryId)?.name}
                          </p>
                        )}
                      </div>

                      <div className="space-y-5">
                        {selectedNotes.map((note) => (
                          <article
                            key={note.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              trackEvent({
                                name: "public.reader.opened",
                                section: "writing",
                                targetType: "reading_note",
                                targetId: note.id,
                              });
                              setReader({
                                title: selectedBook.title,
                                meta: [selectedBook.author, String(selectedBook.yearPublished), formatNoteDate(note.createdAt)].join(" · "),
                                html: note.content,
                              });
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                trackEvent({
                                  name: "public.reader.opened",
                                  section: "writing",
                                  targetType: "reading_note",
                                  targetId: note.id,
                                });
                                setReader({
                                  title: selectedBook.title,
                                  meta: [selectedBook.author, String(selectedBook.yearPublished), formatNoteDate(note.createdAt)].join(" · "),
                                  html: note.content,
                                });
                              }
                            }}
                            className="group border border-surface/10 bg-surface/[0.02] p-5 sm:p-6 cursor-pointer hover:border-accent/25 hover:bg-surface/[0.035] transition-colors"
                          >
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <p className="font-mono text-xs text-muted/35">
                                {formatNoteDate(note.createdAt)}
                              </p>
                              <span className="font-mono text-[10px] uppercase tracking-widest text-accent/55 group-hover:text-accent transition-colors">
                                Read
                              </span>
                            </div>
                            <p className="text-muted/55 text-sm sm:text-base leading-relaxed overflow-hidden [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical]">
                              {richTextPreview(note.content)}
                            </p>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          )}
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
