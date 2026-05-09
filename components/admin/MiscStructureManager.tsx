"use client";

import { useCallback, useEffect, useState } from "react";
import { useUnsavedChangesGuard } from "@/lib/hooks/use-unsaved-changes-guard";
import { useRouter } from "next/navigation";
import { Layers, ListPlus, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import type { MiscSeries, MiscTab } from "@/lib/schema";
import { slugify } from "@/lib/utils";

const INPUT =
  "w-full bg-surface/[0.04] border border-surface/15 px-3 py-2 text-muted font-mono text-sm focus:outline-none focus:border-accent/60 placeholder-muted/25 transition-colors";
const LABEL = "block font-mono text-xs text-muted/50 uppercase tracking-widest mb-1.5";

export default function MiscStructureManager() {
  const router = useRouter();
  const [tabs, setTabs] = useState<MiscTab[]>([]);
  const [seriesList, setSeriesList] = useState<MiscSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tabTitle, setTabTitle] = useState("");
  const [tabSlug, setTabSlug] = useState("");
  const [tabDescription, setTabDescription] = useState("");
  const [tabPosition, setTabPosition] = useState("99");
  const [seriesTitle, setSeriesTitle] = useState("");
  const [seriesDescription, setSeriesDescription] = useState("");
  const [editingTabId, setEditingTabId] = useState<number | null>(null);
  const [editingTabTitle, setEditingTabTitle] = useState("");
  const [editingTabSlug, setEditingTabSlug] = useState("");
  const [editingTabDescription, setEditingTabDescription] = useState("");
  const [editingTabPosition, setEditingTabPosition] = useState("99");
  const [editingSeriesId, setEditingSeriesId] = useState<number | null>(null);
  const [editingSeriesTitle, setEditingSeriesTitle] = useState("");
  const [editingSeriesDescription, setEditingSeriesDescription] = useState("");
  const { clearDirty } = useUnsavedChangesGuard([
    tabTitle, tabSlug, tabDescription, tabPosition, seriesTitle, seriesDescription,
    editingTabTitle, editingTabSlug, editingTabDescription, editingTabPosition,
    editingSeriesTitle, editingSeriesDescription,
  ]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tabRes, seriesRes] = await Promise.all([
        fetch("/api/misc-tabs?admin=true"),
        fetch("/api/misc-series?admin=true"),
      ]);
      if (tabRes.status === 401 || seriesRes.status === 401) {
        router.push("/admin");
        return;
      }
      const [tabRows, seriesRows] = await Promise.all([tabRes.json(), seriesRes.json()]);
      setTabs(Array.isArray(tabRows) ? tabRows : []);
      setSeriesList(Array.isArray(seriesRows) ? seriesRows : []);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function createTab(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/misc-tabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: tabTitle,
          slug: tabSlug || slugify(tabTitle),
          description: tabDescription,
          position: Number(tabPosition),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Tab save failed");
      clearDirty();
      setTabTitle("");
      setTabSlug("");
      setTabDescription("");
      setTabPosition("99");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tab save failed");
    } finally {
      setSaving(false);
    }
  }

  async function createSeries(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/misc-series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: seriesTitle, description: seriesDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Series save failed");
      clearDirty();
      setSeriesTitle("");
      setSeriesDescription("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Series save failed");
    } finally {
      setSaving(false);
    }
  }

  function startEditTab(tab: MiscTab) {
    setEditingTabId(tab.id);
    setEditingTabTitle(tab.title);
    setEditingTabSlug(tab.slug);
    setEditingTabDescription(tab.description ?? "");
    setEditingTabPosition(String(tab.position ?? 99));
  }

  function cancelEditTab() {
    clearDirty();
    setEditingTabId(null);
    setEditingTabTitle("");
    setEditingTabSlug("");
    setEditingTabDescription("");
    setEditingTabPosition("99");
  }

  async function updateTab(id: number) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/misc-tabs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingTabTitle,
          slug: editingTabSlug || slugify(editingTabTitle),
          description: editingTabDescription,
          position: Number(editingTabPosition),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Tab update failed");
      cancelEditTab();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tab update failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTab(id: number) {
    if (!window.confirm("Delete this tab? Articles assigned to it will become unassigned.")) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/misc-tabs/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Tab delete failed");
      if (editingTabId === id) cancelEditTab();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tab delete failed");
    } finally {
      setSaving(false);
    }
  }

  function startEditSeries(series: MiscSeries) {
    setEditingSeriesId(series.id);
    setEditingSeriesTitle(series.title);
    setEditingSeriesDescription(series.description ?? "");
  }

  function cancelEditSeries() {
    clearDirty();
    setEditingSeriesId(null);
    setEditingSeriesTitle("");
    setEditingSeriesDescription("");
  }

  async function updateSeries(id: number) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/misc-series/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editingSeriesTitle, description: editingSeriesDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Series update failed");
      cancelEditSeries();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Series update failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSeries(id: number) {
    if (!window.confirm("Delete this series? Articles assigned to it will keep their tab but lose the series.")) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/misc-series/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Series delete failed");
      if (editingSeriesId === id) cancelEditSeries();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Series delete failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="font-mono text-xs text-red-400 border border-red-400/30 bg-red-400/5 px-4 py-2">
          {error}
        </p>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={createTab} className="border border-surface/10 bg-surface/[0.02] p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2 text-surface font-semibold">
            <ListPlus size={16} />
            Misc tab
          </div>
          <div>
            <label className={LABEL}>Title</label>
            <input className={INPUT} value={tabTitle} onChange={(e) => { setTabTitle(e.target.value); if (!tabSlug) setTabSlug(slugify(e.target.value)); }} required />
          </div>
          <div className="grid sm:grid-cols-[1fr_7rem] gap-4">
            <div>
              <label className={LABEL}>Slug</label>
              <input className={INPUT} value={tabSlug} onChange={(e) => setTabSlug(e.target.value)} required />
            </div>
            <div>
              <label className={LABEL}>Position</label>
              <input className={INPUT} type="number" value={tabPosition} onChange={(e) => setTabPosition(e.target.value)} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Description</label>
            <textarea className={`${INPUT} resize-none`} rows={3} value={tabDescription} onChange={(e) => setTabDescription(e.target.value)} />
          </div>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 font-mono text-xs text-accent border border-accent px-4 py-2 hover:bg-accent/10 transition-all disabled:opacity-50">
            <Plus size={13} />
            Add Tab
          </button>
        </form>

        <form onSubmit={createSeries} className="border border-surface/10 bg-surface/[0.02] p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2 text-surface font-semibold">
            <Layers size={16} />
            Series
          </div>
          <div>
            <label className={LABEL}>Title</label>
            <input className={INPUT} value={seriesTitle} onChange={(e) => setSeriesTitle(e.target.value)} required />
          </div>
          <div>
            <label className={LABEL}>Description</label>
            <textarea className={`${INPUT} resize-none`} rows={5} value={seriesDescription} onChange={(e) => setSeriesDescription(e.target.value)} />
          </div>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 font-mono text-xs text-accent border border-accent px-4 py-2 hover:bg-accent/10 transition-all disabled:opacity-50">
            <Plus size={13} />
            Add Series
          </button>
        </form>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <h2 className="font-mono text-xs text-muted/50 uppercase tracking-widest mb-3">Tabs</h2>
          {loading ? <p className="font-mono text-xs text-muted/30">Loading…</p> : (
            <div className="space-y-2">
              {tabs.map((tab) => (
                <div key={tab.id} className="border border-surface/10 px-4 py-3">
                  {editingTabId === tab.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className={LABEL}>Title</label>
                        <input className={INPUT} value={editingTabTitle} onChange={(e) => { setEditingTabTitle(e.target.value); if (!editingTabSlug) setEditingTabSlug(slugify(e.target.value)); }} required />
                      </div>
                      <div className="grid sm:grid-cols-[1fr_7rem] gap-3">
                        <div>
                          <label className={LABEL}>Slug</label>
                          <input className={INPUT} value={editingTabSlug} onChange={(e) => setEditingTabSlug(e.target.value)} required />
                        </div>
                        <div>
                          <label className={LABEL}>Position</label>
                          <input className={INPUT} type="number" value={editingTabPosition} onChange={(e) => setEditingTabPosition(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className={LABEL}>Description</label>
                        <textarea className={`${INPUT} resize-none`} rows={3} value={editingTabDescription} onChange={(e) => setEditingTabDescription(e.target.value)} />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" disabled={saving} onClick={() => updateTab(tab.id)} className="inline-flex items-center gap-2 font-mono text-xs text-accent border border-accent px-3 py-1.5 hover:bg-accent/10 disabled:opacity-50">
                          <Save size={13} />
                          Save
                        </button>
                        <button type="button" disabled={saving} onClick={cancelEditTab} className="inline-flex items-center gap-2 font-mono text-xs text-muted/50 border border-surface/15 px-3 py-1.5 hover:border-surface/35 disabled:opacity-50">
                          <X size={13} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-surface font-semibold">{tab.title}</p>
                        <p className="font-mono text-xs text-muted/35 mt-1">/{tab.slug} · pos {tab.position}</p>
                        {tab.description && <p className="text-sm text-muted/50 mt-2">{tab.description}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button type="button" onClick={() => startEditTab(tab)} className="p-2 text-muted/45 hover:text-accent transition-colors" aria-label={`Edit ${tab.title}`}>
                          <Pencil size={14} />
                        </button>
                        <button type="button" onClick={() => deleteTab(tab.id)} className="p-2 text-muted/45 hover:text-red-400 transition-colors" aria-label={`Delete ${tab.title}`}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {tabs.length === 0 && <p className="font-mono text-sm text-muted/30 border border-surface/10 px-4 py-8 text-center">No tabs yet.</p>}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-mono text-xs text-muted/50 uppercase tracking-widest mb-3">Series</h2>
          {loading ? <p className="font-mono text-xs text-muted/30">Loading…</p> : (
            <div className="space-y-2">
              {seriesList.map((series) => (
                <div key={series.id} className="border border-surface/10 px-4 py-3">
                  {editingSeriesId === series.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className={LABEL}>Title</label>
                        <input className={INPUT} value={editingSeriesTitle} onChange={(e) => setEditingSeriesTitle(e.target.value)} required />
                      </div>
                      <div>
                        <label className={LABEL}>Description</label>
                        <textarea className={`${INPUT} resize-none`} rows={3} value={editingSeriesDescription} onChange={(e) => setEditingSeriesDescription(e.target.value)} />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" disabled={saving} onClick={() => updateSeries(series.id)} className="inline-flex items-center gap-2 font-mono text-xs text-accent border border-accent px-3 py-1.5 hover:bg-accent/10 disabled:opacity-50">
                          <Save size={13} />
                          Save
                        </button>
                        <button type="button" disabled={saving} onClick={cancelEditSeries} className="inline-flex items-center gap-2 font-mono text-xs text-muted/50 border border-surface/15 px-3 py-1.5 hover:border-surface/35 disabled:opacity-50">
                          <X size={13} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-surface font-semibold">{series.title}</p>
                        {series.description && <p className="text-sm text-muted/50 mt-2">{series.description}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button type="button" onClick={() => startEditSeries(series)} className="p-2 text-muted/45 hover:text-accent transition-colors" aria-label={`Edit ${series.title}`}>
                          <Pencil size={14} />
                        </button>
                        <button type="button" onClick={() => deleteSeries(series.id)} className="p-2 text-muted/45 hover:text-red-400 transition-colors" aria-label={`Delete ${series.title}`}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {seriesList.length === 0 && <p className="font-mono text-sm text-muted/30 border border-surface/10 px-4 py-8 text-center">No series yet.</p>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
