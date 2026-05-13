"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { GitCommit, X, ExternalLink } from "lucide-react";
import { relativeTime } from "@/lib/utils";
import type { SweActivity } from "@/lib/schema";

function HighlightMessage({ message, repo }: { message: string; repo: string }) {
  const idx = message.indexOf(repo);
  if (idx === -1) return <>{message}</>;
  return (
    <>
      {message.slice(0, idx)}
      <span className="text-surface font-medium">{repo}</span>
      {message.slice(idx + repo.length)}
    </>
  );
}

function CommitDetailDialog({ item, onClose }: { item: SweActivity; onClose: () => void }) {
  const commitMetadata = item.commitMetadata;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handler);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[80vh] overflow-y-auto bg-base border border-surface/20 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {commitMetadata && (
              <span className="font-mono text-[10px] text-accent/60 uppercase tracking-wider">
                {commitMetadata.shortSha}
              </span>
            )}
            <p className="mt-1 text-sm text-muted leading-relaxed">{item.message}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-muted/30 hover:text-muted/60 transition-colors mt-0.5"
          >
            <X size={15} />
          </button>
        </div>

        {/* GitHub link */}
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] text-accent/60 hover:text-accent transition-colors border border-accent/20 px-2.5 py-1"
          >
            View on GitHub <ExternalLink size={10} />
          </a>
        )}

        {/* Commit metadata */}
        {commitMetadata && (
          <div className="font-mono text-[10px] text-muted/40 border border-surface/10 bg-surface/[0.015] px-3 py-2.5 space-y-1">
            <div>
              {commitMetadata.authorName}
              {commitMetadata.committedAt
                ? ` · ${new Date(commitMetadata.committedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`
                : ""}
            </div>
            {typeof commitMetadata.additions === "number" && typeof commitMetadata.deletions === "number" && (
              <div>
                <span className="text-emerald-400/60">+{commitMetadata.additions}</span>
                {" / "}
                <span className="text-rose-400/60">-{commitMetadata.deletions}</span>
                {commitMetadata.changedFiles ? ` · ${commitMetadata.changedFiles} files` : ""}
              </div>
            )}
          </div>
        )}

        {/* Note */}
        {item.note && (
          <p className="text-[13px] text-muted/50 italic border-l-2 border-accent/10 pl-3 leading-relaxed">
            {item.note}
          </p>
        )}
      </div>
    </div>
  );
}

function ActivityRow({ item, onOpen }: { item: SweActivity; onOpen?: () => void }) {
  const commitMetadata = item.commitMetadata;

  const inner = (
    <div className="flex gap-4 group cursor-pointer">
      <div className="mt-0.5 shrink-0 flex flex-col items-center">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-accent/40 text-accent bg-accent/5 group-hover:bg-accent/10 transition-colors">
          <GitCommit size={13} strokeWidth={1.75} />
        </span>
      </div>
      <div className="flex-1 pb-8 border-b border-surface/[0.06] last:border-0">
        <p className="text-sm text-muted leading-relaxed">
          <HighlightMessage message={item.message} repo={item.repo} />
        </p>

        <div className="mt-3 space-y-2.5">
          {item.note && (
            <p className="text-[13px] text-muted/50 italic border-l-2 border-accent/10 pl-3 leading-relaxed">
              {item.note}
            </p>
          )}

          {commitMetadata && (
            <div className="pt-1 font-mono text-[10px] text-muted/40">
              <div className="border border-surface/10 bg-surface/[0.015] px-3 py-2">
                <span className="text-accent/70">{commitMetadata.shortSha}</span>
                {commitMetadata.authorName ? ` · ${commitMetadata.authorName}` : ""}
                {commitMetadata.committedAt
                  ? ` · ${new Date(commitMetadata.committedAt).toLocaleDateString()}`
                  : ""}
                {commitMetadata.changedFiles ? ` · ${commitMetadata.changedFiles} files` : ""}
                {typeof commitMetadata.additions === "number" && typeof commitMetadata.deletions === "number"
                  ? ` · +${commitMetadata.additions}/-${commitMetadata.deletions}`
                  : ""}
              </div>
            </div>
          )}
        </div>

        <p className="mt-3 font-mono text-[11px] text-muted/35" suppressHydrationWarning>
          {relativeTime(item.timestamp.toString())}
          {" · "}
          <span className="text-accent/50">commit</span>
        </p>
      </div>
    </div>
  );

  return (
    <button type="button" className="block w-full text-left" onClick={onOpen}>
      {inner}
    </button>
  );
}

export default function ActivityTab() {
  const [items, setItems] = useState<SweActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState<string>("all");
  const [selectedActivity, setSelectedActivity] = useState<SweActivity | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/github-activity", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const repos = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => set.add(item.repo));
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => selectedRepo === "all" || item.repo === selectedRepo);
  }, [items, selectedRepo]);

  const handleClose = useCallback(() => setSelectedActivity(null), []);

  if (isLoading) {
    return (
      <p className="font-mono text-xs text-muted/30 text-center py-16">Loading…</p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="font-mono text-sm text-muted/30 text-center py-16">
        No recent activity found.
      </p>
    );
  }

  const FILTER_BTN = (active: boolean) =>
    `font-mono text-[11px] px-2.5 py-1 border transition-all ${
      active
        ? "bg-accent text-base border-accent"
        : "text-muted/50 border-surface/15 hover:border-accent/40"
    }`;

  return (
    <>
      {selectedActivity && (
        <CommitDetailDialog item={selectedActivity} onClose={handleClose} />
      )}
      <div className="max-w-2xl">
        <div className="mb-12 space-y-6">
          {repos.length > 1 && (
            <div>
              <p className="font-mono text-[10px] text-muted/35 uppercase tracking-widest mb-2.5">
                Filter by project
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRepo("all")}
                  className={FILTER_BTN(selectedRepo === "all")}
                >
                  All Projects
                </button>
                {repos.map((repo) => (
                  <button
                    key={repo}
                    type="button"
                    onClick={() => setSelectedRepo(repo)}
                    className={FILTER_BTN(selectedRepo === repo)}
                  >
                    {repo}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <p className="font-mono text-sm text-muted/20 py-16 text-center border border-dashed border-surface/10">
            No activity matches your filters.
          </p>
        ) : (
          <div className="space-y-0">
            {filteredItems.map((item) => (
              <ActivityRow
                key={item.id}
                item={item}
                onOpen={() => setSelectedActivity(item)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
