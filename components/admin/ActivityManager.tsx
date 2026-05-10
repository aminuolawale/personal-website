"use client";

import { useState, useEffect } from "react";
import { GitCommit, Upload, Trash2, Save, RefreshCw, ChevronDown, ChevronRight, Zap } from "lucide-react";
import type { SweActivity } from "@/lib/schema";
import type { CommitMetrics } from "@/lib/coding-agents/types";
import type { SweActivitySyncState } from "@/lib/swe-activity-sync";

/**
 * Zero-Sum Contribution Slider Component.
 */
function ContributionSlider({ 
  value, 
  onChange 
}: { 
  value: number; 
  onChange: (val: number) => void 
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-muted/50">
        <span>Mohammed ({value}%)</span>
        <span>AI Agent ({100 - value}%)</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 bg-surface/10 rounded-lg appearance-none cursor-pointer accent-accent"
      />
      <div className="h-1 w-full flex rounded-full overflow-hidden">
        <div className="bg-accent h-full transition-all duration-300" style={{ width: `${value}%` }} />
        <div className="bg-surface/20 h-full transition-all duration-300" style={{ width: `${100 - value}%` }} />
      </div>
    </div>
  );
}

function ScoreBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 border font-mono text-[10px] ${color}`}>
      <span className="opacity-50 uppercase tracking-wider">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function MetricsPanel({ activityId }: { activityId: number }) {
  const [open, setOpen] = useState(false);
  const [metrics, setMetrics] = useState<CommitMetrics | null | "loading" | "error">(null);
  const [recomputing, setRecomputing] = useState(false);

  async function load() {
    if (metrics !== null && metrics !== "error") return;
    setMetrics("loading");
    try {
      const res = await fetch(`/api/admin/swe-activity/${activityId}/metrics`);
      if (!res.ok) { setMetrics(null); return; }
      const data = await res.json();
      setMetrics(data.metrics ?? null);
    } catch {
      setMetrics("error");
    }
  }

  async function recompute() {
    setRecomputing(true);
    try {
      const res = await fetch(`/api/admin/swe-activity/${activityId}/metrics`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json();
      setMetrics(data.metrics ?? null);
    } catch {
      setMetrics("error");
    } finally {
      setRecomputing(false);
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) load();
  }

  const m = typeof metrics === "object" && metrics !== null ? metrics as CommitMetrics : null;

  return (
    <div className="border-t border-surface/10 mt-3 pt-3">
      <button onClick={toggle} className="flex items-center gap-1.5 font-mono text-[10px] text-muted/40 hover:text-accent transition-colors uppercase tracking-wider">
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        Commit Metrics
        {m && <span className="ml-2 text-accent">OCS {m.scores.ocs}</span>}
      </button>

      {open && (
        <div className="mt-3 space-y-4">
          {metrics === "loading" && <p className="font-mono text-[11px] text-muted/30">Loading…</p>}
          {metrics === "error" && <p className="font-mono text-[11px] text-red-400">Failed to load metrics.</p>}
          {metrics === null && !recomputing && (
            <div className="space-y-2">
              <p className="font-mono text-[11px] text-muted/30">No metrics yet for this commit.</p>
              <button onClick={recompute} className="flex items-center gap-1.5 font-mono text-[10px] text-accent border border-accent/20 px-2.5 py-1 hover:bg-accent/5 transition-colors">
                <Zap size={10} /> Compute now
              </button>
            </div>
          )}
          {recomputing && <p className="font-mono text-[11px] text-muted/30">Computing… (may take ~10s)</p>}

          {m && (
            <div className="space-y-4">
              {/* Scores */}
              <div className="flex flex-wrap gap-2">
                <ScoreBadge label="OCS" value={m.scores.ocs} color="border-accent/30 text-accent" />
                <ScoreBadge label="Specificity" value={m.foundationPrompt?.specificity.total ?? 0} color="border-surface/20 text-muted" />
              </div>

              {/* Tokens + LOC */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-[11px]">
                <div className="text-muted/40">Total tokens</div>
                <div className="text-surface">{m.tokenMetrics.totalTokens.toLocaleString()}</div>
                <div className="text-muted/40">Output tokens</div>
                <div className="text-surface">{m.tokenMetrics.outputTokens.toLocaleString()}</div>
                <div className="text-muted/40">Cached tokens</div>
                <div className="text-surface">{m.tokenMetrics.cachedTokens.toLocaleString()}</div>
                <div className="text-muted/40">Tokens / LOC</div>
                <div className="text-surface">{m.tokenMetrics.tokensPerLOC}</div>
                <div className="text-muted/40">Net LOC</div>
                <div className="text-surface">+{m.loc.additions} / -{m.loc.deletions} ({m.loc.filesChanged} files)</div>
              </div>

              {/* Per-agent */}
              {Object.keys(m.tokenMetrics.byAgent).length > 0 && (
                <div className="space-y-1">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted/30">By agent</p>
                  {Object.entries(m.tokenMetrics.byAgent).map(([agent, s]) => s && (
                    <div key={agent} className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-accent w-24">{agent}</span>
                      <span className="text-surface">{s.totalTokens.toLocaleString()} tokens</span>
                      <span className="text-muted/30">({s.sessionCount} session{s.sessionCount !== 1 ? "s" : ""})</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Foundation prompt */}
              {m.foundationPrompt && (
                <div className="space-y-2">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted/30">Foundation prompt</p>
                  <p className="text-[12px] text-muted/70 italic border-l border-surface/20 pl-3 line-clamp-3">
                    &ldquo;{m.foundationPrompt.text}&rdquo;
                  </p>
                  <div className="space-y-0.5 font-mono text-[10px] text-muted/40">
                    <div>Info density {m.foundationPrompt.specificity.components.informationDensity}/40 · Coherence {m.foundationPrompt.specificity.components.coherence}/30 · Language {m.foundationPrompt.specificity.components.languageQuality}/30</div>
                    <p className="text-[11px] text-muted/60 mt-1">{m.foundationPrompt.specificity.explanation}</p>
                  </div>
                </div>
              )}

              {/* CL Design */}
              {m.clDesign && (
                <div className="space-y-2">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted/30">
                    CL Design {m.clDesign.isPlanMode && <span className="text-accent ml-1">[plan mode]</span>}
                  </p>
                  <p className="text-[12px] text-muted/70 border-l border-surface/20 pl-3 line-clamp-4 whitespace-pre-line">
                    {m.clDesign.text.slice(0, 400)}{m.clDesign.text.length > 400 ? "…" : ""}
                  </p>
                  <p className="font-mono text-[10px] text-muted/30">{m.clDesign.outputTokens.toLocaleString()} output tokens</p>
                </div>
              )}

              {/* Recompute button */}
              <button onClick={recompute} disabled={recomputing} className="flex items-center gap-1.5 font-mono text-[10px] text-muted/30 hover:text-accent transition-colors border border-surface/10 px-2 py-1 disabled:opacity-40">
                <Zap size={9} /> {recomputing ? "Computing…" : "Recompute"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ActivityManager() {
  const [activities, setActivities] = useState<SweActivity[]>([]);
  const [syncState, setSyncState] = useState<SweActivitySyncState>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ message: string; note: string; scs: number }>({
    message: "",
    note: "",
    scs: 100
  });

  useEffect(() => {
    loadActivities();
  }, []);

  async function loadActivities() {
    setIsLoading(true);
    try {
      const data = await fetch("/api/admin/swe-activity").then(res => res.json());
      setActivities(Array.isArray(data.activities) ? data.activities : []);
      setSyncState(data.syncState ?? {});
    } finally {
      setIsLoading(false);
    }
  }

  async function triggerSync() {
    setIsSyncing(true);
    try {
      await fetch("/api/admin/swe-activity/sync", { method: "POST" });
      await loadActivities();
    } finally {
      setIsSyncing(false);
    }
  }

  function startEditing(activity: SweActivity) {
    setEditingId(activity.id);
    setEditForm({
      message: activity.message,
      note: activity.note,
      scs: activity.scs
    });
  }

  async function saveEdit(id: number) {
    try {
      const res = await fetch(`/api/admin/swe-activity/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setEditingId(null);
        await loadActivities();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteActivity(id: number) {
    if (!confirm("Are you sure you want to delete this activity?")) return;
    try {
      const res = await fetch(`/api/admin/swe-activity/${id}`, { method: "DELETE" });
      if (res.ok) await loadActivities();
    } catch (err) {
      console.error(err);
    }
  }

  if (isLoading) {
    return <p className="font-mono text-xs text-muted/30 p-8">Loading activities...</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-mono text-sm font-semibold uppercase tracking-widest text-surface">
            SWE Activity Feed
          </h3>
          <p className="mt-1 font-mono text-[10px] text-muted/35">
            {syncState.lastSuccessAt
              ? `Last synced ${new Date(syncState.lastSuccessAt).toLocaleString()}`
              : "Not synced yet"}
            {syncState.lastStats ? ` · ${syncState.lastStats.synced}/${syncState.lastStats.deduped} rows synced` : ""}
          </p>
        </div>
        <button
          onClick={triggerSync}
          disabled={isSyncing}
          className="flex items-center gap-2 font-mono text-[11px] px-3 py-1.5 border border-accent/30 text-accent hover:bg-accent/5 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
          {isSyncing ? "Syncing..." : "Sync from GitHub/Vercel"}
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div 
            key={activity.id} 
            className={`border p-4 transition-colors ${
              editingId === activity.id ? "border-accent bg-accent/[0.02]" : "border-surface/10 bg-surface/[0.01]"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="mt-1">
                {activity.type === "commit" ? (
                  <GitCommit size={14} className="text-accent" />
                ) : (
                  <Upload size={14} className="text-muted/40" />
                )}
              </div>

              <div className="flex-1 space-y-4">
                {editingId === activity.id ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label 
                        htmlFor={`msg-${activity.id}`}
                        className="block font-mono text-[10px] uppercase tracking-wider text-muted/40"
                      >
                        Display Message
                      </label>
                      <input
                        id={`msg-${activity.id}`}
                        value={editForm.message}
                        onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                        className="w-full bg-base border border-surface/20 px-3 py-2 text-sm focus:border-accent outline-none"
                      />
                    </div>

                    {activity.type === "commit" && (
                      <>
                        <div className="space-y-1.5">
                          <label className="block font-mono text-[10px] uppercase tracking-wider text-muted/40">
                            Mohammed vs AI Contribution
                          </label>
                          <ContributionSlider 
                            value={editForm.scs} 
                            onChange={(val) => setEditForm({ ...editForm, scs: val })} 
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label 
                            htmlFor={`note-${activity.id}`}
                            className="block font-mono text-[10px] uppercase tracking-wider text-muted/40"
                          >
                            Context Note (Optional)
                          </label>
                          <textarea
                            id={`note-${activity.id}`}
                            value={editForm.note}
                            onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                            placeholder="Add manual context about your vs the agent's work..."
                            className="w-full bg-base border border-surface/20 px-3 py-2 text-sm focus:border-accent outline-none h-20 resize-none"
                          />
                        </div>
                      </>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="font-mono text-[11px] text-muted/50 hover:text-muted"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveEdit(activity.id)}
                        className="flex items-center gap-2 font-mono text-[11px] bg-accent text-base px-4 py-1.5 hover:bg-accent/90 transition-colors"
                      >
                        <Save size={12} />
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-surface leading-snug">
                        {activity.message}
                      </p>
                      <p className="font-mono text-[11px] text-muted/30">
                        {new Date(activity.timestamp).toLocaleDateString()} · {activity.repo} · {activity.type}
                      </p>
                      {activity.scs < 100 && (
                        <div className="inline-flex items-center gap-2 mt-2 px-2 py-0.5 bg-surface/5 border border-surface/10 rounded font-mono text-[10px]">
                          <span className="text-accent">Mohammed {activity.scs}%</span>
                          <span className="text-muted/30">/</span>
                          <span className="text-muted/60">AI {100 - activity.scs}%</span>
                        </div>
                      )}
                      {activity.note && (
                        <p className="mt-2 text-[13px] text-muted/60 italic border-l border-surface/20 pl-3">
                          &ldquo;{activity.note}&rdquo;
                        </p>
                      )}
                      {activity.type === "commit" && (
                        <MetricsPanel activityId={activity.id} />
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => startEditing(activity)}
                        className="p-1.5 text-muted/40 hover:text-accent transition-colors"
                        title="Edit"
                      >
                        <Save size={14} />
                      </button>
                      <button
                        onClick={() => deleteActivity(activity.id)}
                        className="p-1.5 text-muted/40 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
