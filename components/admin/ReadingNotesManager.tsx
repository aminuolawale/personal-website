"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { BookOpen, Pencil, Plus, Save, Trash2 } from "lucide-react";
import type { Book, BookCategory, ReadingNote } from "@/lib/schema";

const TiptapEditor = dynamic(() => import("@/components/TiptapEditor"), { ssr: false });

const INPUT =
  "w-full bg-surface/[0.04] border border-surface/15 px-3 py-2 text-muted font-mono text-sm focus:outline-none focus:border-accent/60 placeholder-muted/25 transition-colors";

const LABEL = "block font-mono text-xs text-muted/50 uppercase tracking-widest mb-1.5";

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function bookLabel(book: Book) {
  return `${book.title} — ${book.author} (${book.yearPublished})`;
}

export default function ReadingNotesManager() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [notes, setNotes] = useState<ReadingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [yearPublished, setYearPublished] = useState("");
  const [bookCategoryId, setBookCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bookRes, noteRes] = await Promise.all([
        fetch("/api/books?admin=true"),
        fetch("/api/reading-notes?admin=true"),
      ]);
      const categoryRes = await fetch("/api/book-categories?admin=true");
      if (bookRes.status === 401 || noteRes.status === 401 || categoryRes.status === 401) {
        router.push("/admin");
        return;
      }
      const [bookRows, noteRows, categoryRows] = await Promise.all([
        bookRes.json(),
        noteRes.json(),
        categoryRes.json(),
      ]);
      const nextBooks = Array.isArray(bookRows) ? bookRows : [];
      setBooks(nextBooks);
      setNotes(Array.isArray(noteRows) ? noteRows : []);
      const nextCategories = Array.isArray(categoryRows) ? categoryRows : [];
      setCategories(nextCategories);
      setBookCategoryId((current) => current || String(nextCategories[0]?.id ?? ""));
      setSelectedBookId((current) => current || String(nextBooks[0]?.id ?? ""));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const booksById = useMemo(() => new Map(books.map((book) => [book.id, book])), [books]);
  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  async function createBook(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      let categoryId = bookCategoryId;
      const categoryName = newCategoryName.trim();
      if (categoryName) {
        const existingCategory = categories.find(
          (category) => category.name.toLowerCase() === categoryName.toLowerCase()
        );
        if (existingCategory) {
          categoryId = String(existingCategory.id);
        } else {
          const categoryRes = await fetch("/api/book-categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: categoryName }),
          });
          const category = await categoryRes.json();
          if (!categoryRes.ok) throw new Error(category.error ?? "Category save failed");
          categoryId = String(category.id);
        }
      }
      if (!categoryId) throw new Error("Book category is required");

      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: bookTitle, author: bookAuthor, yearPublished, categoryId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Book save failed");

      setBookTitle("");
      setBookAuthor("");
      setYearPublished("");
      setNewCategoryName("");
      setBookCategoryId(categoryId);
      setSelectedBookId(String(data.id));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Book save failed");
    } finally {
      setSaving(false);
    }
  }

  async function createNote(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/reading-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: Number(selectedBookId), content: noteContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Note save failed");

      setNoteContent("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Note save failed");
    } finally {
      setSaving(false);
    }
  }

  async function updateNote(id: number) {
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/reading-notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editingContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Note update failed");

      setEditingId(null);
      setEditingContent("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Note update failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote(id: number) {
    if (!confirm("Delete this reading note?")) return;
    setSaving(true);
    await fetch(`/api/reading-notes/${id}`, { method: "DELETE" });
    setSaving(false);
    await load();
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="font-mono text-xs text-red-400 border border-red-400/30 bg-red-400/5 px-4 py-2">
          {error}
        </p>
      )}

      <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-6">
        <form onSubmit={createBook} className="border border-surface/10 bg-surface/[0.02] p-5 space-y-4">
          <div className="flex items-center gap-2 text-surface font-semibold">
            <BookOpen size={16} />
            Book entry
          </div>
          <div>
            <label className={LABEL}>Book title</label>
            <input className={INPUT} value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} required />
          </div>
          <div>
            <label className={LABEL}>Author</label>
            <input className={INPUT} value={bookAuthor} onChange={(e) => setBookAuthor(e.target.value)} required />
          </div>
          <div>
            <label className={LABEL}>Year published</label>
            <input
              className={INPUT}
              type="number"
              min="0"
              step="1"
              value={yearPublished}
              onChange={(e) => setYearPublished(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={LABEL}>Category</label>
            <select
              className={INPUT}
              value={bookCategoryId}
              onChange={(e) => setBookCategoryId(e.target.value)}
              disabled={Boolean(newCategoryName.trim())}
              required={!newCategoryName.trim()}
            >
              <option value="" disabled>Create or choose a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>New category</label>
            <input
              className={INPUT}
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Optional: create and assign"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 font-mono text-xs text-accent border border-accent px-4 py-2 hover:bg-accent/10 transition-all disabled:opacity-50"
          >
            <Plus size={13} />
            Add Book
          </button>
        </form>

        <form onSubmit={createNote} className="border border-surface/10 bg-surface/[0.02] p-5 space-y-4">
          <div className="flex items-center gap-2 text-surface font-semibold">
            <Pencil size={16} />
            Reading note
          </div>
          <div>
            <label className={LABEL}>Book</label>
            <select
              className={INPUT}
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              required
            >
              <option value="" disabled>Add a book first</option>
              {books.map((book) => (
                <option key={book.id} value={book.id}>{bookLabel(book)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>Note text</label>
            <TiptapEditor
              content={noteContent}
              onChange={setNoteContent}
              placeholder="Add the reading note…"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !selectedBookId}
            className="inline-flex items-center gap-2 font-mono text-xs text-accent border border-accent px-4 py-2 hover:bg-accent/10 transition-all disabled:opacity-50"
          >
            <Save size={13} />
            Save Note
          </button>
        </form>
      </div>

      <section>
        <h2 className="font-mono text-xs text-muted/50 uppercase tracking-widest mb-3">
          Existing reading notes
        </h2>
        {loading ? (
          <p className="font-mono text-xs text-muted/30 text-center py-12">Loading…</p>
        ) : notes.length === 0 ? (
          <p className="font-mono text-sm text-muted/30 text-center py-16 border border-surface/10">
            No reading notes yet.
          </p>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => {
              const book = booksById.get(note.bookId);
              const editing = editingId === note.id;
              return (
                <article key={note.id} className="border border-surface/10 bg-surface/[0.015] p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-surface font-semibold">
                        {book ? book.title : `Book #${note.bookId}`}
                      </p>
                      <p className="font-mono text-xs text-muted/35 mt-1">
                        {book ? `${book.author} · ${book.yearPublished}` : "Book entry missing"} · {formatDate(note.createdAt)}
                      </p>
                      {book?.categoryId && categoriesById.has(book.categoryId) && (
                        <p className="font-mono text-[10px] text-accent/65 uppercase tracking-widest mt-2">
                          {categoriesById.get(book.categoryId)?.name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => { setEditingId(note.id); setEditingContent(note.content); }}
                        className="p-2 text-muted/40 hover:text-accent transition-colors"
                        title="Edit note text"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteNote(note.id)}
                        disabled={saving}
                        className="p-2 text-muted/40 hover:text-red-400 transition-colors disabled:opacity-40"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {editing ? (
                    <div className="space-y-3">
                      <TiptapEditor
                        content={editingContent}
                        onChange={setEditingContent}
                        placeholder="Edit the note text…"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateNote(note.id)}
                          disabled={saving}
                          className="inline-flex items-center gap-2 font-mono text-xs text-accent border border-accent px-4 py-2 hover:bg-accent/10 transition-all disabled:opacity-50"
                        >
                          <Save size={13} />
                          Save Text
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingId(null); setEditingContent(""); }}
                          className="font-mono text-xs text-muted/40 hover:text-muted transition-colors px-3 py-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="article-content text-[0.98rem]" dangerouslySetInnerHTML={{ __html: note.content }} />
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
