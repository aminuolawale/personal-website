"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Image from "next/image";
import type { Comment } from "@/lib/schema";
import { timeAgo } from "@/lib/utils";

interface Props {
  articleId: number;
}

export default function CommentSection({ articleId }: Props) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingNotice, setPendingNotice] = useState(false);

  useEffect(() => {
    fetch(`/api/comments?articleId=${articleId}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setComments(data); })
      .catch(() => {});
  }, [articleId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, content: content.trim() }),
      });
      if (res.ok) {
        setContent("");
        setPendingNotice(true);
        setTimeout(() => setPendingNotice(false), 8000);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-16 pt-12 border-t border-surface/10">
      <h2 className="font-mono text-xs text-muted/40 uppercase tracking-widest mb-8">
        {comments.length > 0 ? `Comments (${comments.length})` : "Comments"}
      </h2>

      {/* Comment form or sign-in prompt */}
      {session ? (
        <form onSubmit={submit} className="mb-10">
          <div className="flex gap-3">
            {session.user?.image ? (
              <Image
                src={session.user.image}
                alt=""
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover shrink-0 mt-1"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center font-mono text-xs text-accent shrink-0 mt-1">
                {session.user?.name?.[0] ?? "?"}
              </div>
            )}
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share a thought…"
                rows={3}
                className="w-full bg-surface/5 border border-surface/15 px-3 py-2 text-sm text-surface placeholder:text-muted/25 focus:outline-none focus:border-accent/40 resize-none"
              />
              <div className="flex items-center justify-between mt-2 min-h-[24px]">
                {pendingNotice && (
                  <p className="font-mono text-xs text-accent/60">Your comment is awaiting approval.</p>
                )}
                <button
                  type="submit"
                  disabled={submitting || !content.trim()}
                  className="ml-auto font-mono text-xs text-base bg-accent px-4 py-1.5 hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {submitting ? "Posting…" : "Post"}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-10 border border-surface/10 p-4 text-center">
          <p className="font-mono text-xs text-muted/40 mb-3">Sign in to leave a comment</p>
          <button
            onClick={() => signIn("google", { callbackUrl: window.location.href })}
            className="font-mono text-xs text-accent border border-accent/30 px-4 py-1.5 hover:bg-accent/10 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      )}

      {/* Approved comments */}
      {comments.length === 0 ? (
        <p className="font-mono text-xs text-muted/30 text-center py-6">No comments yet. Be the first.</p>
      ) : (
        <div className="space-y-8">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              {comment.readerAvatarUrl ? (
                <Image
                  src={comment.readerAvatarUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center font-mono text-xs text-accent shrink-0">
                  {comment.readerName?.[0] ?? "?"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-surface text-sm font-semibold">
                    {comment.readerName ?? "Reader"}
                  </span>
                  <span className="font-mono text-[10px] text-muted/30">
                    {timeAgo(comment.createdAt)}
                  </span>
                </div>
                <p className="text-surface/75 text-sm leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
