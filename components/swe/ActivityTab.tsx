"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { GitCommit, Upload, X, ExternalLink } from "lucide-react";
import { relativeTime } from "@/lib/vercel-activity";
import type { SweActivity } from "@/lib/schema";
import type { CommitMetrics } from "@/lib/coding-agents/types";
import {
  OCS_BUCKET_CLASSES,
  OCS_BUCKET_LABELS,
  getOcsBucket,
  formatTokens,
  getDominantAgent,
} from "@/lib/activity-score";

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
  const metrics = item.metrics as CommitMetrics | null;
  const commitMetadata = item.commitMetadata;
  const ocs = metrics?.scores.ocs ?? null;
  const bucket = ocs !== null ? getOcsBucket(ocs) : null;
  const specificity = metrics?.conversationScore?.specificity ?? null;
  const dominantAgent = metrics ? getDominantAgent(metrics.tokenMetrics.byAgent) : "AI";
  const [conversationExpanded, setConversationExpanded] = useState(false);
  const conversationRef = useRef<HTMLDivElement>(null);
  const CONVERSATION_PREVIEW_LEN = 300;

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

        {/* Human Contribution Rating + zero-sum slider */}
        {ocs !== null && bucket && (
          <div className="space-y-2.5">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 border font-mono text-[10px] uppercase tracking-wider ${OCS_BUCKET_CLASSES[bucket]}`}>
              Human Contribution Rating {ocs}
              <span className="opacity-60">·</span>
              {OCS_BUCKET_LABELS[bucket]}
            </span>
            <div className="space-y-1.5">
              <div className="flex h-2 w-full overflow-hidden">
                <div style={{ width: `${ocs}%` }} className="bg-accent/50" />
                <div style={{ width: `${100 - ocs}%` }} className="bg-surface/20" />
              </div>
              <div className="flex justify-between font-mono text-[10px] text-muted/40">
                <span>Mohammed <span className="text-accent/60">{ocs}%</span></span>
                <span>{dominantAgent} <span className="text-muted/30">{100 - ocs}%</span></span>
              </div>
            </div>
          </div>
        )}

        {/* Conversation */}
        {metrics?.conversation && (
          <div className="border border-surface/10 bg-surface/[0.015] px-3 py-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] text-muted/25 uppercase tracking-wider">Conversation</p>
              {metrics.conversation.length > CONVERSATION_PREVIEW_LEN && (
                <button
                  onClick={() => setConversationExpanded((v) => !v)}
                  className="font-mono text-[10px] text-accent/50 hover:text-accent/80 transition-colors"
                >
                  {conversationExpanded ? "Collapse" : "Expand"}
                </button>
              )}
            </div>
            <div ref={conversationRef}>
              <p className="text-[11px] text-muted/50 leading-relaxed whitespace-pre-wrap font-mono">
                {conversationExpanded
                  ? metrics.conversation
                  : metrics.conversation.slice(0, CONVERSATION_PREVIEW_LEN) + (metrics.conversation.length > CONVERSATION_PREVIEW_LEN ? "…" : "")}
              </p>
            </div>
          </div>
        )}

        {/* Conversation quality */}
        {specificity && (
          <div className="border border-surface/10 bg-surface/[0.015] px-3 py-2.5 space-y-2.5">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider">
              <span className="text-muted/35">Conversation Quality</span>
              <span className={`px-1.5 py-0.5 border ${OCS_BUCKET_CLASSES[getOcsBucket(specificity.total)]}`}>
                {specificity.total}
              </span>
            </div>
            <div className="space-y-1.5 font-mono text-[10px] text-muted/35">
              <div className="flex justify-between">
                <span>Information Density</span>
                <span>
                  {specificity.components.informationDensity}
                  <span className="text-muted/20">/40</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span>Coherence</span>
                <span>
                  {specificity.components.coherence}
                  <span className="text-muted/20">/30</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span>Language Quality</span>
                <span>
                  {specificity.components.languageQuality}
                  <span className="text-muted/20">/30</span>
                </span>
              </div>
            </div>
            {specificity.explanation && (
              <p className="text-[11px] text-muted/45 leading-relaxed border-t border-surface/10 pt-2.5">
                {specificity.explanation}
              </p>
            )}
          </div>
        )}

        {/* Token usage */}
        {metrics && (
          <div className="border border-surface/10 bg-surface/[0.015] px-3 py-2.5">
            <p className="font-mono text-[10px] text-muted/25 uppercase tracking-wider mb-2">Token Usage</p>
            <div className="font-mono text-[10px] text-muted/40 space-y-1">
              <div className="flex justify-between">
                <span>Total</span>
                <span className="text-accent/60">{formatTokens(metrics.tokenMetrics.totalTokens)}</span>
              </div>
              <div className="flex justify-between">
                <span>Input</span>
                <span>{formatTokens(metrics.tokenMetrics.inputTokens)}</span>
              </div>
              <div className="flex justify-between">
                <span>Output</span>
                <span>{formatTokens(metrics.tokenMetrics.outputTokens)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cached</span>
                <span>{formatTokens(metrics.tokenMetrics.cachedTokens)}</span>
              </div>
            </div>
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
  const isCommit = item.type === "commit";
  const Icon = isCommit ? GitCommit : Upload;
  const metrics = item.metrics as CommitMetrics | null;
  const commitMetadata = item.commitMetadata;
  const ocs = metrics?.scores.ocs ?? null;
  const bucket = ocs !== null ? getOcsBucket(ocs) : null;
  const dominantAgent = metrics ? getDominantAgent(metrics.tokenMetrics.byAgent) : "AI";

  const inner = (
    <div className={`flex gap-4 group ${isCommit ? "cursor-pointer" : ""}`}>
      <div className="mt-0.5 shrink-0 flex flex-col items-center">
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full border ${
            isCommit
              ? "border-accent/40 text-accent bg-accent/5 group-hover:bg-accent/10"
              : "border-surface/20 text-muted/50 bg-surface/5"
          } transition-colors`}
        >
          <Icon size={13} strokeWidth={1.75} />
        </span>
      </div>
      <div className="flex-1 pb-8 border-b border-surface/[0.06] last:border-0">
        <p className="text-sm text-muted leading-relaxed">
          <HighlightMessage message={item.message} repo={item.repo} />
        </p>

        {isCommit && (
          <div className="mt-3 space-y-2.5">
            {metrics && ocs !== null && bucket && (
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wider">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 border ${OCS_BUCKET_CLASSES[bucket]}`}>
                    HCR {ocs}
                    <span className="opacity-60">·</span>
                    {OCS_BUCKET_LABELS[bucket]}
                  </span>
                </div>
                <div className="space-y-1 max-w-[220px]">
                  <div className="flex h-1.5 w-full overflow-hidden">
                    <div style={{ width: `${ocs}%` }} className="bg-accent/40" />
                    <div style={{ width: `${100 - ocs}%` }} className="bg-surface/15" />
                  </div>
                  <div className="flex justify-between font-mono text-[9px] text-muted/30">
                    <span>Mohammed {ocs}%</span>
                    <span>{dominantAgent} {100 - ocs}%</span>
                  </div>
                </div>
              </div>
            )}

            {item.note && (
              <p className="text-[13px] text-muted/50 italic border-l-2 border-accent/10 pl-3 leading-relaxed">
                {item.note}
              </p>
            )}

            {(commitMetadata || metrics) && (
              <div className="grid gap-2 pt-1 font-mono text-[10px] text-muted/40 sm:grid-cols-2">
                {commitMetadata && (
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
                )}
                {metrics && (
                  <div className="border border-surface/10 bg-surface/[0.015] px-3 py-2">
                    HCR <span className="text-accent/70">{metrics.scores.ocs}</span>
                    {" · "}
                    {formatTokens(metrics.tokenMetrics.totalTokens)} tokens
                    {" · "}
                    {metrics.loc.filesChanged} files
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <p className="mt-3 font-mono text-[11px] text-muted/35" suppressHydrationWarning>
          {relativeTime(item.timestamp.toString())}
          {" · "}
          <span className={isCommit ? "text-accent/50" : "text-muted/30"}>
            {isCommit ? "commit" : "deployment"}
          </span>
        </p>
      </div>
    </div>
  );

  if (isCommit) {
    return (
      <button type="button" className="block w-full text-left" onClick={onOpen}>
        {inner}
      </button>
    );
  }

  return <div className="block">{inner}</div>;
}

export default function ActivityTab() {
  const [items, setItems] = useState<SweActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<"all" | "commit" | "deployment">("all");
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
    return items.filter((item) => {
      const repoMatch = selectedRepo === "all" || item.repo === selectedRepo;
      const typeMatch = selectedType === "all" || item.type === selectedType;
      return repoMatch && typeMatch;
    });
  }, [items, selectedRepo, selectedType]);

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

          <div>
            <p className="font-mono text-[10px] text-muted/35 uppercase tracking-widest mb-2.5">
              Activity type
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedType("all")}
                className={FILTER_BTN(selectedType === "all")}
              >
                Everything
              </button>
              <button
                type="button"
                onClick={() => setSelectedType("commit")}
                className={FILTER_BTN(selectedType === "commit")}
              >
                Git
              </button>
              <button
                type="button"
                onClick={() => setSelectedType("deployment")}
                className={FILTER_BTN(selectedType === "deployment")}
              >
                Deployments
              </button>
            </div>
          </div>
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
                onOpen={item.type === "commit" ? () => setSelectedActivity(item) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
