"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
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

export default function UpdatesPage() {
  const [updates, setUpdates] = useState<SiteUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/updates")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setUpdates(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="py-16 sm:py-24 px-6 sm:px-16 max-w-4xl mx-auto">
      <m.div
        className="flex items-center gap-6 mb-12"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-mono text-accent text-2xl whitespace-nowrap">All Updates</h1>
        <div className="h-px bg-surface/15 flex-1 max-w-xs" />
      </m.div>

      {loading ? (
        <p className="font-mono text-xs text-muted/30 text-center py-16">Loading…</p>
      ) : updates.length === 0 ? (
        <p className="font-mono text-xs text-muted/30 text-center py-16">No updates yet.</p>
      ) : (
        <div className="divide-y divide-surface/[0.07]">
          {updates.map((u, i) => (
            <m.div
              key={u.id}
              className="py-5 flex items-start justify-between gap-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <div className="flex items-baseline gap-4 min-w-0">
                <span className="font-mono text-[10px] text-muted/30 shrink-0 tabular-nums w-16">
                  {timeAgo(u.createdAt)}
                </span>
                <p className="text-muted/70 text-sm leading-relaxed">{u.text}</p>
              </div>
              {u.linkUrl && (
                <Link
                  href={u.linkUrl}
                  className="flex items-center gap-1 font-mono text-xs text-accent/60 hover:text-accent transition-colors shrink-0"
                >
                  View
                  <ArrowRight size={11} />
                </Link>
              )}
            </m.div>
          ))}
        </div>
      )}
    </main>
  );
}
