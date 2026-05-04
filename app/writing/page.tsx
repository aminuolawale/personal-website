"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { m } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import TabBar from "@/components/TabBar";
import WritingArticleCard from "@/components/WritingArticleCard";
import { useArticles } from "@/lib/hooks/use-articles";
import { useSiteContent } from "@/lib/hooks/use-site-content";
import type { Book, BookCategory, ReadingNote } from "@/lib/schema";

const WRITING_TABS = [
  { id: "book-reviews", label: "Book reviews" },
  { id: "reading-notes", label: "Reading notes" },
];

function formatNoteDate(value: string | Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function WritingPage() {
  const { articles, isLoading } = useArticles("writing");
  const { writingTitle, writingDescription } = useSiteContent();
  const [activeTab, setActiveTab] = useState("book-reviews");
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [notes, setNotes] = useState<ReadingNote[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">("all");
  const [notesLoading, setNotesLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadReadingNotes() {
      setNotesLoading(true);
      try {
        const [bookRes, noteRes] = await Promise.all([
          fetch("/api/books"),
          fetch("/api/reading-notes"),
        ]);
        const categoryRes = await fetch("/api/book-categories");
        const [bookRows, noteRows, categoryRows] = await Promise.all([
          bookRes.json(),
          noteRes.json(),
          categoryRes.json(),
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
    setSelectedBookId(booksWithNotes[0]?.id ?? null);
  }, [booksWithNotes, selectedBookId]);

  useEffect(() => {
    if (!selectedBookId) return;
    const carousel = carouselRef.current;
    const selected = carousel?.querySelector<HTMLElement>(`[data-book-id="${selectedBookId}"]`);
    selected?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [selectedBookId, selectedCategoryId, booksWithNotes]);

  const selectedBook = booksWithNotes.find((book) => book.id === selectedBookId) ?? null;
  const selectedNotes = notes.filter((note) => note.bookId === selectedBookId);

  return (
    <main>
      <PageHeader
        eyebrow="03. Writing"
        title={writingTitle}
        description={writingDescription}
      />

      <section className="py-8 sm:py-14 px-5 sm:px-8 lg:px-16 max-w-6xl mx-auto">
        <TabBar tabs={WRITING_TABS} activeId={activeTab} onChange={setActiveTab} />

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
                      <WritingArticleCard article={article} />
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
                  {visibleCategories.length > 0 && (
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
                  )}
                  <p className="font-mono text-sm text-muted/30 py-16 text-center">
                    No reading notes in this category.
                  </p>
                </div>
              ) : (
                <>
                  {visibleCategories.length > 0 && (
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
                  )}
                  <div className="relative -mx-6 sm:mx-0">
                    <div
                      ref={carouselRef}
                      className="flex gap-3 overflow-x-auto px-5 sm:px-0 pb-3 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                      {booksWithNotes.map((book) => {
                        const selected = book.id === selectedBookId;
                        return (
                          <button
                            key={book.id}
                            data-book-id={book.id}
                            type="button"
                            onClick={() => setSelectedBookId(book.id)}
                            className={`shrink-0 w-[78vw] max-w-[20rem] sm:w-72 text-left border p-4 transition-all duration-200 ${
                              selected
                                ? "border-accent bg-accent/10"
                                : "border-surface/10 bg-surface/[0.025] hover:border-accent/30"
                            }`}
                          >
                            <span className="block text-surface font-semibold leading-snug">
                              {book.title}
                            </span>
                            <span className="mt-2 block font-mono text-xs text-muted/40">
                              {book.author} · {book.yearPublished}
                            </span>
                            {book.categoryId && categoriesById.has(book.categoryId) && (
                              <span className="mt-3 inline-block font-mono text-[10px] uppercase tracking-widest text-accent/70">
                                {categoriesById.get(book.categoryId)?.name}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

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
                            className="border border-surface/10 bg-surface/[0.02] p-5 sm:p-6"
                          >
                            <p className="font-mono text-xs text-muted/35 mb-4">
                              {formatNoteDate(note.createdAt)}
                            </p>
                            <div
                              className="article-content text-[0.98rem]"
                              dangerouslySetInnerHTML={{ __html: note.content }}
                            />
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
    </main>
  );
}
