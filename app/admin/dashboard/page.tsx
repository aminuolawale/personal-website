"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Plus, Pencil, Trash2, LogOut, Eye, EyeOff } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import type { Article } from "@/lib/schema";

const TYPE_LABEL: Record<string, string> = {
  writing: "Book Review",
  astrophotography: "Astro",
  swe: "SWE",
  misc: "Misc",
};

const TYPE_COLOR: Record<string, string> = {
  writing: "text-accent bg-accent/10 border-accent/25",
  astrophotography: "text-muted bg-muted/10 border-muted/25",
  swe: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
  misc: "text-surface bg-surface/10 border-surface/25",
};

type Section = "writing" | "swe" | "astrophotography" | "misc";

export default function AdminDashboard() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [section, setSection] = useState<Section>("writing");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/articles?admin=true");
      if (res.status === 401) { router.push("/admin"); return; }
      setArticles(await res.json());
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const filtered = articles.filter((a) => a.type === section);

  async function handleDelete(id: number) {
    if (!confirm("Delete this article?")) return;
    setDeletingId(id);
    await fetch(`/api/articles/${id}`, { method: "DELETE" });
    setDeletingId(null);
    load();
  }

  async function handleLogout() {
    await signOut({ callbackUrl: "/admin" });
  }

  return (
    <div className="min-h-screen bg-base text-muted">
      {/* Header */}
      <div className="border-b border-surface/10 bg-base">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-mono text-accent text-lg font-bold hover:opacity-75 transition-opacity">
              AO.
            </Link>
            <span className="font-mono text-xs text-muted/30 uppercase tracking-widest">CMS</span>
            <Link
              href="/admin/dashboard/updates"
              className="font-mono text-xs text-muted/40 hover:text-accent transition-colors border border-surface/10 px-2.5 py-1 hover:border-accent/30"
            >
              Updates
            </Link>
            <Link
              href="/admin/dashboard/settings"
              className="font-mono text-xs text-muted/40 hover:text-accent transition-colors border border-surface/10 px-2.5 py-1 hover:border-accent/30"
            >
              Settings
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 font-mono text-xs text-muted/40 hover:text-accent transition-colors"
            >
              <LogOut size={13} />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Section tabs + context actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            {(["writing", "swe", "astrophotography", "misc"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSection(s)}
                className={`font-mono text-xs px-3 py-1.5 border transition-all capitalize ${
                  section === s
                    ? "bg-accent text-base border-accent"
                    : "text-muted/50 border-surface/15 hover:border-accent/40"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {section === "swe" && (
              <>
                <Link
                  href="/admin/dashboard/projects"
                  className="font-mono text-xs text-muted/40 hover:text-accent transition-colors border border-surface/10 px-2.5 py-2 hover:border-accent/30"
                >
                  All Projects
                </Link>
                <Link
                  href="/admin/dashboard/projects/new"
                  className="flex items-center gap-2 font-mono text-xs text-accent border border-accent px-4 py-2 hover:bg-accent/10 transition-all"
                >
                  <Plus size={13} />
                  New Project
                </Link>
              </>
            )}
            {section === "astrophotography" && (
              <>
                <Link
                  href="/admin/dashboard/astro-gear"
                  className="font-mono text-xs text-muted/40 hover:text-accent transition-colors border border-surface/10 px-2.5 py-2 hover:border-accent/30"
                >
                  Gear Library
                </Link>
                <Link
                  href="/admin/dashboard/gallery"
                  className="font-mono text-xs text-muted/40 hover:text-accent transition-colors border border-surface/10 px-2.5 py-2 hover:border-accent/30"
                >
                  All Photos
                </Link>
                <Link
                  href="/admin/dashboard/gallery/new"
                  className="flex items-center gap-2 font-mono text-xs text-accent border border-accent px-4 py-2 hover:bg-accent/10 transition-all"
                >
                  <Plus size={13} />
                  New Photo
                </Link>
                <Link
                  href="/admin/dashboard/astro-sessions"
                  className="flex items-center gap-2 font-mono text-xs text-accent border border-accent px-4 py-2 hover:bg-accent/10 transition-all"
                >
                  <Plus size={13} />
                  New Session
                </Link>
              </>
            )}
            {section === "writing" && (
              <Link
                href="/admin/dashboard/reading-notes"
                className="font-mono text-xs text-muted/40 hover:text-accent transition-colors border border-surface/10 px-2.5 py-2 hover:border-accent/30"
              >
                Reading Notes
              </Link>
            )}
            <Link
              href={`/admin/dashboard/new?type=${section}`}
              className="flex items-center gap-2 font-mono text-xs text-accent border border-accent px-4 py-1.5 hover:bg-accent/10 transition-all"
            >
              <Plus size={13} />
              {section === "writing" ? "New Book Review" : "New Article"}
            </Link>
          </div>
        </div>

        {/* Article list */}
        {loading ? (
          <p className="font-mono text-xs text-muted/30 text-center py-16">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 border border-surface/10">
            <p className="font-mono text-sm text-muted/30">No articles yet.</p>
            <Link
              href={`/admin/dashboard/new?type=${section}`}
              className="inline-flex items-center gap-2 mt-4 font-mono text-xs text-accent hover:underline"
            >
              <Plus size={12} /> Create your first {section === "writing" ? "book review" : "article"}
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-surface/[0.06]">
            {filtered.map((article) => (
              <div
                key={article.id}
                className="py-4 flex items-start justify-between gap-4 hover:bg-surface/[0.015] -mx-3 px-3 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`font-mono text-[10px] uppercase tracking-widest px-1.5 py-0.5 border ${
                        TYPE_COLOR[article.type] ?? "text-surface/50 border-surface/15"
                      }`}
                    >
                      {TYPE_LABEL[article.type] ?? article.type}
                    </span>
                    {article.published ? (
                      <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-400/70">
                        <Eye size={10} /> Published
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-mono text-[10px] text-muted/30">
                        <EyeOff size={10} /> Draft
                      </span>
                    )}
                  </div>
                  <p className="text-surface font-semibold truncate">{article.title}</p>
                  <p className="font-mono text-xs text-muted/35 mt-0.5">{article.date}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/admin/dashboard/${article.id}`}
                    className="p-2 text-muted/40 hover:text-accent transition-colors"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </Link>
                  <button
                    onClick={() => handleDelete(article.id)}
                    disabled={deletingId === article.id}
                    className="p-2 text-muted/40 hover:text-red-400 transition-colors disabled:opacity-40"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
