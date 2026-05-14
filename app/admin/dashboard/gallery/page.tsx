"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import type { GalleryPhoto } from "@/lib/schema";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminResourceDropdown from "@/components/admin/AdminResourceDropdown";

export default function GalleryDashboard() {
  const router = useRouter();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gallery?admin=true");
      if (res.status === 401) { router.push("/admin"); return; }
      const data = await res.json();
      setPhotos(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function handleDelete(id: number) {
    if (!confirm("Delete this photo?")) return;
    setDeletingId(id);
    await fetch(`/api/gallery/${id}`, { method: "DELETE" });
    setDeletingId(null);
    load();
  }

  return (
    <div className="min-h-screen bg-base text-muted">
      <AdminPageHeader
        title="Gallery"
        actions={
          <AdminResourceDropdown
            actions={[{
              href: "/admin/dashboard/gallery/new",
              label: "Gallery Photo",
              description: "Create a gallery image with acquisition metadata.",
            }]}
          />
        }
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {loading ? (
          <p className="font-mono text-xs text-muted/30 text-center py-16">Loading…</p>
        ) : photos.length === 0 ? (
          <div className="text-center py-24 border border-surface/10">
            <p className="font-mono text-sm text-muted/30">No photos yet.</p>
            <div className="mt-4 inline-flex">
              <AdminResourceDropdown
                label="Create first"
                actions={[{
                  href: "/admin/dashboard/gallery/new",
                  label: "Gallery Photo",
                  description: "Create a gallery image with acquisition metadata.",
                }]}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((p) => (
              <div key={p.id} className="group relative border border-surface/10 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-auto block"
                />
                <div className="absolute inset-0 bg-base/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-[10px] ${p.published ? "text-emerald-400/80" : "text-muted/40"}`}>
                      {p.published ? "Published" : "Draft"}
                    </span>
                    <div className="flex gap-1">
                      <Link
                        href={`/admin/dashboard/gallery/${p.id}`}
                        className="p-1.5 text-muted/50 hover:text-accent transition-colors"
                      >
                        <Pencil size={13} />
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deletingId === p.id}
                        className="p-1.5 text-muted/50 hover:text-red-400 transition-colors disabled:opacity-40"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <p className="text-surface text-xs font-semibold truncate">{p.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
