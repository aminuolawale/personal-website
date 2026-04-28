"use client";

import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import type { SiteUpdate } from "@/lib/schema";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { timeAgo } from "@/lib/utils";

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
    <div className="min-h-screen bg-base text-muted">
      <AdminPageHeader title="Updates" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <p className="font-mono text-xs text-muted/30 text-center py-16">Loading…</p>
        ) : updates.length === 0 ? (
          <p className="font-mono text-xs text-muted/30 text-center py-16">No updates yet.</p>
        ) : (
          <div className="divide-y divide-surface/[0.06]">
            {updates.map((u) => (
              <div
                key={u.id}
                className="py-4 flex items-start gap-4 hover:bg-surface/[0.015] -mx-3 px-3 transition-colors"
              >
                <span className="font-mono text-[10px] text-muted/30 shrink-0 tabular-nums pt-0.5 w-14">
                  {timeAgo(u.createdAt)}
                </span>

                <div className="flex-1 min-w-0">
                  {editingId === u.id ? (
                    <div className="flex items-start gap-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={2}
                        className="flex-1 bg-surface/5 border border-surface/20 text-surface text-sm px-2 py-1 resize-none font-sans focus:outline-none focus:border-accent/50"
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
                          className="p-1.5 text-muted/40 hover:text-muted transition-colors"
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-surface/75 text-sm leading-relaxed">{u.text}</p>
                  )}
                  {u.linkUrl && editingId !== u.id && (
                    <p className="font-mono text-[10px] text-muted/30 mt-0.5 truncate">{u.linkUrl}</p>
                  )}
                </div>

                {editingId !== u.id && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(u)}
                      className="p-2 text-muted/40 hover:text-accent transition-colors"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      disabled={deletingId === u.id}
                      className="p-2 text-muted/40 hover:text-red-400 transition-colors disabled:opacity-40"
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
