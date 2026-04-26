"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Plus, Pencil, Trash2, LogOut, Eye, EyeOff } from "lucide-react";
import type { Article } from "@/lib/schema";

const TYPE_LABEL: Record<string, string> = {
  writing: "Writing",
  astrophotography: "Astro",
  swe: "SWE",
};

const TYPE_COLOR: Record<string, string> = {
  writing: "text-[#fc9e4f] bg-[#fc9e4f]/10 border-[#fc9e4f]/25",
  astrophotography: "text-[#edd382] bg-[#edd382]/10 border-[#edd382]/25",
  swe: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
};

type Section = "writing" | "swe" | "astrophotography";

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
    <div className="min-h-screen bg-[#020122] text-[#edd382]">
      {/* Header */}
      <div className="border-b border-[#f2f3ae]/10 bg-[#020122]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-mono text-[#fc9e4f] text-lg font-bold hover:opacity-75 transition-opacity">
              AO.
            </Link>
            <span className="font-mono text-xs text-[#edd382]/30 uppercase tracking-widest">CMS</span>
            <Link
              href="/admin/dashboard/settings"
              className="font-mono text-xs text-[#edd382]/40 hover:text-[#fc9e4f] transition-colors border border-[#f2f3ae]/10 px-2.5 py-1 hover:border-[#fc9e4f]/30"
            >
              Settings
            </Link>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 font-mono text-xs text-[#edd382]/40 hover:text-[#fc9e4f] transition-colors"
          >
            <LogOut size={13} />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Section tabs + context actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            {(["writing", "swe", "astrophotography"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSection(s)}
                className={`font-mono text-xs px-3 py-1.5 border transition-all capitalize ${
                  section === s
                    ? "bg-[#fc9e4f] text-[#020122] border-[#fc9e4f]"
                    : "text-[#edd382]/50 border-[#f2f3ae]/15 hover:border-[#fc9e4f]/40"
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
                  className="font-mono text-xs text-[#edd382]/40 hover:text-[#fc9e4f] transition-colors border border-[#f2f3ae]/10 px-2.5 py-2 hover:border-[#fc9e4f]/30"
                >
                  All Projects
                </Link>
                <Link
                  href="/admin/dashboard/projects/new"
                  className="flex items-center gap-2 font-mono text-xs text-[#fc9e4f] border border-[#fc9e4f] px-4 py-2 hover:bg-[#fc9e4f]/10 transition-all"
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
                  className="font-mono text-xs text-[#edd382]/40 hover:text-[#fc9e4f] transition-colors border border-[#f2f3ae]/10 px-2.5 py-2 hover:border-[#fc9e4f]/30"
                >
                  Gear Library
                </Link>
                <Link
                  href="/admin/dashboard/gallery"
                  className="font-mono text-xs text-[#edd382]/40 hover:text-[#fc9e4f] transition-colors border border-[#f2f3ae]/10 px-2.5 py-2 hover:border-[#fc9e4f]/30"
                >
                  All Photos
                </Link>
                <Link
                  href="/admin/dashboard/gallery/new"
                  className="flex items-center gap-2 font-mono text-xs text-[#fc9e4f] border border-[#fc9e4f] px-4 py-2 hover:bg-[#fc9e4f]/10 transition-all"
                >
                  <Plus size={13} />
                  New Photo
                </Link>
              </>
            )}
            <Link
              href={`/admin/dashboard/new?type=${section}`}
              className="flex items-center gap-2 font-mono text-xs text-[#fc9e4f] border border-[#fc9e4f] px-4 py-2 hover:bg-[#fc9e4f]/10 transition-all"
            >
              <Plus size={13} />
              New Article
            </Link>
          </div>
        </div>

        {/* Article list */}
        {loading ? (
          <p className="font-mono text-xs text-[#edd382]/30 text-center py-16">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 border border-[#f2f3ae]/10">
            <p className="font-mono text-sm text-[#edd382]/30">No articles yet.</p>
            <Link
              href={`/admin/dashboard/new?type=${section}`}
              className="inline-flex items-center gap-2 mt-4 font-mono text-xs text-[#fc9e4f] hover:underline"
            >
              <Plus size={12} /> Create your first article
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#f2f3ae]/[0.06]">
            {filtered.map((article) => (
              <div
                key={article.id}
                className="py-4 flex items-start justify-between gap-4 hover:bg-[#f2f3ae]/[0.015] -mx-3 px-3 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`font-mono text-[10px] uppercase tracking-widest px-1.5 py-0.5 border ${
                        TYPE_COLOR[article.type] ?? "text-[#f2f3ae]/50 border-[#f2f3ae]/15"
                      }`}
                    >
                      {TYPE_LABEL[article.type] ?? article.type}
                    </span>
                    {article.published ? (
                      <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-400/70">
                        <Eye size={10} /> Published
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-mono text-[10px] text-[#edd382]/30">
                        <EyeOff size={10} /> Draft
                      </span>
                    )}
                  </div>
                  <p className="text-[#f2f3ae] font-semibold truncate">{article.title}</p>
                  <p className="font-mono text-xs text-[#edd382]/35 mt-0.5">{article.date}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/admin/dashboard/${article.id}`}
                    className="p-2 text-[#edd382]/40 hover:text-[#fc9e4f] transition-colors"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </Link>
                  <button
                    onClick={() => handleDelete(article.id)}
                    disabled={deletingId === article.id}
                    className="p-2 text-[#edd382]/40 hover:text-red-400 transition-colors disabled:opacity-40"
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
