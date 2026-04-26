"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Bookmark } from "lucide-react";
import type { Article } from "@/lib/schema";

interface BookmarkWithArticle {
  id: number;
  articleId: number;
  createdAt: string;
  article: Article | null;
}

function articleHref(article: Article): string {
  return `/${article.type}/${article.slug}`;
}

const SECTION_LABEL: Record<string, string> = {
  swe: "SWE",
  writing: "Writing",
  astrophotography: "Astrophotography",
};

export default function BookmarksPage() {
  const { data: session, status } = useSession();
  const [bookmarks, setBookmarks] = useState<BookmarkWithArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { setLoading(false); return; }
    if (status !== "authenticated") return;
    fetch("/api/bookmarks")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setBookmarks(data); })
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <main className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-6 sm:px-16 max-w-3xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 font-mono text-xs text-muted/40 hover:text-accent transition-colors mb-12"
      >
        <ArrowLeft size={13} />
        Home
      </Link>

      <div className="flex items-center gap-3 mb-10">
        <Bookmark size={18} className="text-accent" />
        <h1 className="text-surface text-2xl font-bold">My Bookmarks</h1>
      </div>

      {status === "unauthenticated" && (
        <div className="text-center py-16 border border-surface/10">
          <p className="font-mono text-sm text-muted/40 mb-4">Sign in to view your bookmarks</p>
          <button
            onClick={() => signIn("google", { callbackUrl: "/bookmarks" })}
            className="font-mono text-xs text-accent border border-accent/30 px-4 py-2 hover:bg-accent/10 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      )}

      {loading && <p className="font-mono text-xs text-muted/30 py-8 text-center">Loading…</p>}

      {!loading && session && bookmarks.length === 0 && (
        <p className="font-mono text-xs text-muted/30 py-16 text-center">
          No bookmarks yet — save articles while reading and they&apos;ll appear here.
        </p>
      )}

      {!loading && bookmarks.length > 0 && (
        <div className="divide-y divide-surface/10">
          {bookmarks.map(({ id, article }) => {
            if (!article) return null;
            return (
              <div key={id} className="py-5">
                <Link href={articleHref(article)} className="group block">
                  <span className="font-mono text-[10px] text-muted/30 uppercase tracking-widest">
                    {SECTION_LABEL[article.type] ?? article.type}
                  </span>
                  <h2 className="text-surface font-semibold mt-1 group-hover:text-accent transition-colors">
                    {article.title}
                  </h2>
                  {article.summary && (
                    <p className="font-mono text-xs text-muted/40 mt-1 line-clamp-2">{article.summary}</p>
                  )}
                  <p className="font-mono text-[10px] text-muted/25 mt-2">{article.date}</p>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
