"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { Bookmark } from "lucide-react";

interface Props {
  articleId: number;
}

export default function BookmarkButton({ articleId }: Props) {
  const { data: session } = useSession();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch("/api/bookmarks")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBookmarked(data.some((b) => b.articleId === articleId));
      })
      .catch(() => {});
  }, [session, articleId]);

  async function toggle() {
    if (!session) {
      signIn("google", { callbackUrl: window.location.href });
      return;
    }
    const was = bookmarked;
    setBookmarked(!was);
    setLoading(true);
    try {
      if (was) {
        await fetch(`/api/bookmarks?articleId=${articleId}`, { method: "DELETE" });
      } else {
        await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleId }),
        });
      }
    } catch {
      setBookmarked(was);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={bookmarked ? "Remove bookmark" : "Bookmark this article"}
      className={`flex items-center gap-1.5 font-mono text-xs transition-colors disabled:opacity-40 ${
        bookmarked ? "text-accent" : "text-muted/40 hover:text-accent"
      }`}
    >
      <Bookmark size={14} fill={bookmarked ? "currentColor" : "none"} strokeWidth={1.5} />
      {bookmarked ? "Saved" : "Save"}
    </button>
  );
}
