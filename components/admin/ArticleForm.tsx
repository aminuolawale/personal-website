"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
import dynamic from "next/dynamic";
import ThemeToggle from "@/components/ThemeToggle";
import type { Article } from "@/lib/schema";
import { slugify } from "@/lib/utils";

const TiptapEditor = dynamic(() => import("@/components/TiptapEditor"), { ssr: false });

interface ArticleFormProps {
  article?: Article;
  defaultType?: "writing" | "astrophotography" | "swe" | "misc";
}

const INPUT =
  "w-full bg-surface/[0.04] border border-surface/15 px-3 py-2 text-muted font-mono text-sm focus:outline-none focus:border-accent/60 placeholder-muted/25 transition-colors";

const LABEL = "block font-mono text-xs text-muted/50 uppercase tracking-widest mb-1.5";

export default function ArticleForm({ article, defaultType = "writing" }: ArticleFormProps) {
  const router = useRouter();
  const isNew = !article;

  const [type, setType] = useState<"writing" | "astrophotography" | "swe" | "misc">(
    (article?.type as "writing" | "astrophotography" | "swe" | "misc") ?? defaultType
  );
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [summary, setSummary] = useState(article?.summary ?? "");
  const [tags, setTags] = useState(article?.tags ?? "");
  const [date, setDate] = useState(article?.date ?? "");
  const [readTime, setReadTime] = useState(article?.readTime ?? "");
  const [location, setLocation] = useState(article?.location ?? "");
  const [published, setPublished] = useState(article?.published ?? false);
  const [content, setContent] = useState(article?.content ?? "");
  const [publishAsUpdate, setPublishAsUpdate] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      type, title, slug, summary, tags, date, readTime,
      location: location || null, published, content,
      ...(isNew ? { publishAsUpdate } : {}),
    };

    try {
      const res = await fetch(
        isNew ? "/api/articles" : `/api/articles/${article.id}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Save failed");
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-base text-muted">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-surface/10 bg-base/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2 font-mono text-xs text-muted/50 hover:text-accent transition-colors"
            >
              <ArrowLeft size={14} />
              Dashboard
            </Link>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-3">
            {isNew && (
              <button
                type="button"
                onClick={() => setPublishAsUpdate((v) => !v)}
                className={`font-mono text-xs px-3 py-1.5 border transition-all duration-200 ${
                  publishAsUpdate
                    ? "text-base bg-muted border-muted"
                    : "text-muted/50 border-surface/15 hover:border-muted/40"
                }`}
              >
                + Update
              </button>
            )}
            <button
              type="button"
              onClick={() => setPublished((v) => !v)}
              className={`flex items-center gap-2 font-mono text-xs px-3 py-1.5 border transition-all duration-200 ${
                published
                  ? "text-base bg-accent border-accent"
                  : "text-muted/60 border-surface/20 hover:border-accent/40"
              }`}
            >
              {published ? <Eye size={13} /> : <EyeOff size={13} />}
              {published ? "Published" : "Draft"}
            </button>

            <button
              type="submit"
              form="article-form"
              disabled={saving}
              className="flex items-center gap-2 font-mono text-xs text-accent border border-accent px-4 py-1.5 hover:bg-accent/10 transition-all disabled:opacity-50"
            >
              <Save size={13} />
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <form id="article-form" onSubmit={handleSubmit} className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {error && (
          <p className="font-mono text-xs text-red-400 border border-red-400/30 bg-red-400/5 px-4 py-2">
            {error}
          </p>
        )}

        {/* Type selector — only on new */}
        {isNew && (
          <div>
            <label className={LABEL}>Article type</label>
            <div className="flex gap-2">
              {(["writing", "astrophotography", "swe", "misc"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`font-mono text-xs px-4 py-2 border transition-all duration-200 capitalize ${
                    type === t
                      ? "bg-accent text-base border-accent"
                      : "text-muted/60 border-surface/20 hover:border-accent/40"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label className={LABEL}>Title</label>
          <input
            className="w-full bg-transparent border-b border-surface/15 pb-2 text-surface text-3xl font-bold focus:outline-none focus:border-accent/60 placeholder-muted/20 transition-colors"
            placeholder="Article title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Slug */}
        <div>
          <label className={LABEL}>Slug</label>
          <input
            className={INPUT}
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
            placeholder="url-slug"
            required
          />
        </div>

        {/* Summary */}
        <div>
          <label className={LABEL}>Summary</label>
          <textarea
            className={`${INPUT} resize-none`}
            rows={2}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Short description shown on the listing page"
          />
        </div>

        {/* Row: date, read time, location (astro only) */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className={LABEL}>Date</label>
            <input
              className={INPUT}
              placeholder="April 2025"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className={LABEL}>Read time</label>
            <input
              className={INPUT}
              placeholder="8 min"
              value={readTime}
              onChange={(e) => setReadTime(e.target.value)}
            />
          </div>
          {type === "astrophotography" && (
            <div>
              <label className={LABEL}>Location</label>
              <input
                className={INPUT}
                placeholder="Uetliberg, Zurich"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className={LABEL}>
            Tags{type === "astrophotography" ? " — acquisition, capture, processing" : " — comma-separated"}
          </label>
          <input
            className={INPUT}
            placeholder={type === "astrophotography" ? "acquisition, capture, processing" : "essay, astronomy, personal"}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        {/* Editor */}
        <div>
          <label className={LABEL}>Content</label>
          <TiptapEditor
            content={content}
            onChange={setContent}
            placeholder="Write your article here…"
          />
        </div>
      </form>
    </div>
  );
}
