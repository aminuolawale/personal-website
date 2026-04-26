"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { GitHubIcon } from "@/components/icons";
import type { Project } from "@/lib/schema";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default function ProjectsDashboard() {
  const router = useRouter();
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/projects?admin=true");
      if (res.status === 401) { router.push("/admin"); return; }
      const data = await res.json();
      setProjectList(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: number) {
    if (!confirm("Delete this project?")) return;
    setDeletingId(id);
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    setDeletingId(null);
    load();
  }

  return (
    <div className="min-h-screen bg-[#020122] text-[#edd382]">
      <AdminPageHeader
        title="Projects"
        actions={
          <Link
            href="/admin/dashboard/projects/new"
            className="flex items-center gap-2 font-mono text-xs text-[#fc9e4f] border border-[#fc9e4f] px-4 py-2 hover:bg-[#fc9e4f]/10 transition-all"
          >
            <Plus size={13} />
            New Project
          </Link>
        }
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {loading ? (
          <p className="font-mono text-xs text-[#edd382]/30 text-center py-16">Loading…</p>
        ) : projectList.length === 0 ? (
          <div className="text-center py-24 border border-[#f2f3ae]/10">
            <p className="font-mono text-sm text-[#edd382]/30">No projects yet.</p>
            <Link
              href="/admin/dashboard/projects/new"
              className="inline-flex items-center gap-2 mt-4 font-mono text-xs text-[#fc9e4f] hover:underline"
            >
              <Plus size={12} /> Add your first project
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#f2f3ae]/[0.06]">
            {projectList.map((p) => (
              <div
                key={p.id}
                className="py-4 flex items-center justify-between gap-4 hover:bg-[#f2f3ae]/[0.015] -mx-3 px-3 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] text-[#fc9e4f]/60 border border-[#fc9e4f]/20 px-1.5 py-0.5">
                      pos {p.position}
                    </span>
                    <span className={`font-mono text-[10px] ${p.published ? "text-emerald-400/70" : "text-[#edd382]/30"}`}>
                      {p.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="text-[#f2f3ae] font-semibold truncate">{p.title}</p>
                  {p.description && (
                    <p className="font-mono text-xs text-[#edd382]/35 mt-0.5 truncate">{p.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    {p.githubUrl && (
                      <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="text-[#edd382]/30 hover:text-[#fc9e4f] transition-colors">
                        <GitHubIcon size={13} />
                      </a>
                    )}
                    {p.websiteUrl && (
                      <a href={p.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-[#edd382]/30 hover:text-[#fc9e4f] transition-colors">
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/admin/dashboard/projects/${p.id}`}
                    className="p-2 text-[#edd382]/40 hover:text-[#fc9e4f] transition-colors"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
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
