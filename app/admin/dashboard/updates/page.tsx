"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Pencil, Trash2, Check, X, ArrowLeft } from "lucide-react";
import type { SiteUpdate } from "@/lib/schema";

function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function AdminUpdatesPage() {
  const [updates, setUpdates] = useState<SiteUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/updates?admin=true");
      if (res.ok) setUpdates(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit(u: SiteUpdate) {
    setEditingId(u.id);
    setEditText(u.text);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }

  async function saveEdit(id: number) {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/updates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editText }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUpdates((prev) => prev.map((u) => (u.id === id ? updated : u)));
        setEditingId(null);
        setEditText("");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this update?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/updates/${id}`, { method: "DELETE" });
      setUpdates((prev) => prev.filter((u) => u.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#020122] text-[#edd382]">
      <div className="border-b border-[#f2f3ae]/10 bg-[#020122]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-4">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-1.5 font-mono text-xs text-[#edd382]/40 hover:text-[#fc9e4f] transition-colors"
          >
            <ArrowLeft size={13} />
            Dashboard
          </Link>
          <span className="font-mono text-xs text-[#edd382]/20">/</span>
          <span className="font-mono text-xs text-[#edd382]/60">Updates</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-mono text-[#fc9e4f] text-lg mb-8">Site Updates</h1>

        {loading ? (
          <p className="font-mono text-xs text-[#edd382]/30 text-center py-16">Loading…</p>
        ) : updates.length === 0 ? (
          <p className="font-mono text-xs text-[#edd382]/30 text-center py-16">No updates yet.</p>
        ) : (
          <div className="divide-y divide-[#f2f3ae]/[0.06]">
            {updates.map((u) => (
              <div
                key={u.id}
                className="py-4 flex items-start gap-4 hover:bg-[#f2f3ae]/[0.015] -mx-3 px-3 transition-colors"
              >
                <span className="font-mono text-[10px] text-[#edd382]/30 shrink-0 tabular-nums pt-0.5 w-14">
                  {timeAgo(u.createdAt)}
                </span>

                <div className="flex-1 min-w-0">
                  {editingId === u.id ? (
                    <div className="flex items-start gap-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={2}
                        className="flex-1 bg-[#f2f3ae]/5 border border-[#f2f3ae]/20 text-[#f2f3ae] text-sm px-2 py-1 resize-none font-sans focus:outline-none focus:border-[#fc9e4f]/50"
                        autoFocus
                      />
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => saveEdit(u.id)}
                          disabled={saving || !editText.trim()}
                          className="p-1.5 text-emerald-400 hover:text-emerald-300 disabled:opacity-40 transition-colors"
                          title="Save"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 text-[#edd382]/40 hover:text-[#edd382] transition-colors"
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[#f2f3ae]/75 text-sm leading-relaxed">{u.text}</p>
                  )}
                  {u.linkUrl && editingId !== u.id && (
                    <p className="font-mono text-[10px] text-[#edd382]/30 mt-0.5 truncate">{u.linkUrl}</p>
                  )}
                </div>

                {editingId !== u.id && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(u)}
                      className="p-2 text-[#edd382]/40 hover:text-[#fc9e4f] transition-colors"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      disabled={deletingId === u.id}
                      className="p-2 text-[#edd382]/40 hover:text-red-400 transition-colors disabled:opacity-40"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
