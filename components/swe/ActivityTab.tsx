"use client";

import { useMemo, useState, useEffect } from "react";
import { GitCommit, Upload, User, Bot } from "lucide-react";
import { fetchCachedJson } from "@/lib/client-cache";
import { relativeTime } from "@/lib/github-activity";
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

function ActivityRow({ item }: { item: SweActivity }) {
  const isCommit = item.type === "commit";
  const Icon = isCommit ? GitCommit : Upload;

  const inner = (
    <div className="flex gap-4 group">
      <div className="mt-0.5 shrink-0 flex flex-col items-center">
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full border ${
            isCommit
              ? "border-accent/40 text-accent bg-accent/5 group-hover:bg-accent/10"
              : "border-surface/20 text-muted/50 bg-surface/5 group-hover:bg-surface/10"
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
            {/* Contribution Score Visualization */}
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-[140px] h-1 bg-surface/10 rounded-full overflow-hidden flex">
                <div 
                  className="bg-accent h-full transition-all duration-500" 
                  style={{ width: `${item.scs}%` }} 
                  title={`Mohammed: ${item.scs}%`}
                />
                <div 
                  className="bg-surface/20 h-full transition-all duration-500" 
                  style={{ width: `${100 - item.scs}%` }} 
                  title={`AI Agent: ${100 - item.scs}%`}
                />
              </div>
              <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-wider text-muted/30">
                <span className="flex items-center gap-1.5">
                  <User size={10} className={item.scs > 50 ? "text-accent/60" : "text-muted/20"} />
                  {item.scs}%
                </span>
                <span className="flex items-center gap-1.5">
                  <Bot size={10} className={item.scs < 50 ? "text-surface/60" : "text-muted/20"} />
                  {100 - item.scs}%
                </span>
              </div>
            </div>

            {item.note && (
              <p className="text-[13px] text-muted/50 italic border-l-2 border-accent/10 pl-3 leading-relaxed">
                {item.note}
              </p>
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

  return item.url ? (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
      {inner}
    </a>
  ) : (
    <div className="block">{inner}</div>
  );
}

export default function ActivityTab() {
  const [items, setItems] = useState<SweActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<"all" | "commit" | "deployment">("all");

  useEffect(() => {
    fetchCachedJson<SweActivity[]>("/api/github-activity", [])
      .then(setItems)
      .finally(() => setIsLoading(false));
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
              VCS Activity
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
            <ActivityRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
