"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, X, Trash2 } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import type { Comment, Article } from "@/lib/schema";
import { timeAgo } from "@/lib/utils";

type CommentWithArticle = Comment & {
  article: Pick<Article, "id" | "title" | "slug" | "type"> | null;
};

export default function AdminCommentsPage() {
  const [items, setItems] = useState<CommentWithArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/comments?admin=true");
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function approve(id: number) {
    setActingId(id);
    await fetch(`/api/comments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: true }),
    });
    setItems((prev) => prev.map((c) => c.id === id ? { ...c, approved: true } : c));
    setActingId(null);
  }

  async function reject(id: number) {
    setActingId(id);
    await fetch(`/api/comments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: false }),
    });
    setItems((prev) => prev.map((c) => c.id === id ? { ...c, approved: false } : c));
    setActingId(null);
  }

  async function remove(id: number) {
    if (!confirm("Delete this comment?")) return;
    setActingId(id);
    await fetch(`/api/comments/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((c) => c.id !== id));
    setActingId(null);
  }

  const pending = items.filter((c) => !c.approved);
  const approved = items.filter((c) => c.approved);

  return (
    <div className="min-h-screen bg-base text-muted">
      <AdminPageHeader title="Comments" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {loading ? (
          <p className="font-mono text-xs text-muted/30 text-center py-16">Loading…</p>
        ) : items.length === 0 ? (
          <p className="font-mono text-xs text-muted/30 text-center py-16">No comments yet.</p>
        ) : (
          <>
            {pending.length > 0 && (
              <section>
                <h2 className="font-mono text-[10px] text-muted/40 uppercase tracking-widest mb-4">
                  Pending approval ({pending.length})
                </h2>
                <CommentList items={pending} actingId={actingId} onApprove={approve} onReject={reject} onDelete={remove} />
              </section>
            )}
            {approved.length > 0 && (
              <section>
                <h2 className="font-mono text-[10px] text-muted/40 uppercase tracking-widest mb-4">
                  Approved ({approved.length})
                </h2>
                <CommentList items={approved} actingId={actingId} onApprove={approve} onReject={reject} onDelete={remove} />
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CommentList({
  items,
  actingId,
  onApprove,
  onReject,
  onDelete,
}: {
  items: CommentWithArticle[];
  actingId: number | null;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="divide-y divide-surface/[0.06]">
      {items.map((c) => (
        <div key={c.id} className="py-4 hover:bg-surface/[0.015] -mx-3 px-3 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <span className="text-surface text-sm font-semibold">{c.readerName ?? c.readerEmail}</span>
                <span className="font-mono text-[10px] text-muted/30">{timeAgo(c.createdAt)}</span>
                {c.article && (
                  <span className="font-mono text-[10px] text-muted/30 truncate">
                    on: {c.article.title}
                  </span>
                )}
              </div>
              <p className="text-surface/70 text-sm leading-relaxed whitespace-pre-wrap">{c.content}</p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {!c.approved && (
                <button
                  onClick={() => onApprove(c.id)}
                  disabled={actingId === c.id}
                  className="p-2 text-emerald-400/60 hover:text-emerald-400 transition-colors disabled:opacity-40"
                  title="Approve"
                >
                  <Check size={14} />
                </button>
              )}
              {c.approved && (
                <button
                  onClick={() => onReject(c.id)}
                  disabled={actingId === c.id}
                  className="p-2 text-muted/40 hover:text-muted transition-colors disabled:opacity-40"
                  title="Unapprove"
                >
                  <X size={14} />
                </button>
              )}
              <button
                onClick={() => onDelete(c.id)}
                disabled={actingId === c.id}
                className="p-2 text-muted/40 hover:text-red-400 transition-colors disabled:opacity-40"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
