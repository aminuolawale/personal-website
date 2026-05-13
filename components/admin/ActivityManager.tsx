"use client";

import { useState, useEffect } from "react";
import { GitCommit, Trash2, Save, RefreshCw } from "lucide-react";
import type { SweActivity } from "@/lib/schema";

export default function ActivityManager() {
  const [activities, setActivities] = useState<SweActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ message: string; note: string }>({
    message: "",
    note: ""
  });

  useEffect(() => {
    loadActivities();
  }, []);

  async function loadActivities() {
    setIsLoading(true);
    try {
      const data = await fetch("/api/admin/swe-activity").then(res => res.json());
      setActivities(Array.isArray(data.activities) ? data.activities : []);
    } finally {
      setIsLoading(false);
    }
  }

  async function syncLatestCommits() {
    setIsSyncing(true);
    setSyncMessage("");
    try {
      const res = await fetch("/api/admin/swe-activity/sync", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSyncMessage(data.error ?? "GitHub sync failed.");
        return;
      }
      setSyncMessage(`Synced ${data.synced ?? 0} latest commits from ${data.repo ?? "GitHub"}.`);
      await loadActivities();
    } catch {
      setSyncMessage("GitHub sync failed.");
    } finally {
      setIsSyncing(false);
    }
  }

  function startEditing(activity: SweActivity) {
    setEditingId(activity.id);
    setEditForm({
      message: activity.message,
      note: activity.note
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h3 className="font-mono text-sm font-semibold uppercase tracking-widest text-surface">
            SWE Activity Feed
          </h3>
          {syncMessage && (
            <p className="font-mono text-[11px] text-muted/50">{syncMessage}</p>
          )}
        </div>
        <button
          onClick={syncLatestCommits}
          disabled={isSyncing}
          className="inline-flex items-center justify-center gap-2 border border-surface/15 px-3 py-1.5 font-mono text-[11px] text-muted/60 transition-colors hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
          {isSyncing ? "Syncing..." : "Sync GitHub"}
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
                <GitCommit size={14} className="text-accent" />
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
                          placeholder="Add manual context about this activity..."
                          className="w-full bg-base border border-surface/20 px-3 py-2 text-sm focus:border-accent outline-none h-20 resize-none"
                        />
                      </div>
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
                      {activity.note && (
                        <p className="mt-2 text-[13px] text-muted/60 italic border-l border-surface/20 pl-3">
                          &ldquo;{activity.note}&rdquo;
                        </p>
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
