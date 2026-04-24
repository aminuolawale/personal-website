"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
import dynamic from "next/dynamic";
import type { Article } from "@/lib/schema";
import { slugify } from "@/lib/utils";

const TiptapEditor = dynamic(() => import("@/components/TiptapEditor"), { ssr: false });

interface ArticleFormProps {
  article?: Article;
}

const INPUT =
  "w-full bg-[#f2f3ae]/[0.04] border border-[#f2f3ae]/15 px-3 py-2 text-[#edd382] font-mono text-sm focus:outline-none focus:border-[#fc9e4f]/60 placeholder-[#edd382]/25 transition-colors";

const LABEL = "block font-mono text-xs text-[#edd382]/50 uppercase tracking-widest mb-1.5";

export default function ArticleForm({ article }: ArticleFormProps) {
  const router = useRouter();
  const isNew = !article;

  const [type, setType] = useState<"writing" | "astrophotography">(
    (article?.type as "writing" | "astrophotography") ?? "writing"
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

    const payload = { type, title, slug, summary, tags, date, readTime, location: location || null, published, content };

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
    <div className="min-h-screen bg-[#020122] text-[#edd382]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-[#f2f3ae]/10 bg-[#020122]/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 font-mono text-xs text-[#edd382]/50 hover:text-[#fc9e4f] transition-colors"
          >
            <ArrowLeft size={14} />
            Dashboard
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPublished((v) => !v)}
              className={`flex items-center gap-2 font-mono text-xs px-3 py-1.5 border transition-all duration-200 ${
                published
                  ? "text-[#020122] bg-[#fc9e4f] border-[#fc9e4f]"
                  : "text-[#edd382]/60 border-[#f2f3ae]/20 hover:border-[#fc9e4f]/40"
              }`}
            >
              {published ? <Eye size={13} /> : <EyeOff size={13} />}
              {published ? "Published" : "Draft"}
            </button>

            <button
              type="submit"
              form="article-form"
              disabled={saving}
              className="flex items-center gap-2 font-mono text-xs text-[#fc9e4f] border border-[#fc9e4f] px-4 py-1.5 hover:bg-[#fc9e4f]/10 transition-all disabled:opacity-50"
            >
              <Save size={13} />
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <form id="article-form" onSubmit={handleSubmit} className="max-w-5xl mx-auto px-6 py-10 space-y-8">
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
              {(["writing", "astrophotography"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`font-mono text-xs px-4 py-2 border transition-all duration-200 capitalize ${
                    type === t
                      ? "bg-[#fc9e4f] text-[#020122] border-[#fc9e4f]"
                      : "text-[#edd382]/60 border-[#f2f3ae]/20 hover:border-[#fc9e4f]/40"
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
            className="w-full bg-transparent border-b border-[#f2f3ae]/15 pb-2 text-[#f2f3ae] text-3xl font-bold focus:outline-none focus:border-[#fc9e4f]/60 placeholder-[#edd382]/20 transition-colors"
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
