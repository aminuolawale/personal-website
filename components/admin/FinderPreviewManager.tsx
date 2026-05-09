"use client";

import { useEffect, useMemo, useState } from "react";
import { useUnsavedChangesGuard } from "@/lib/hooks/use-unsaved-changes-guard";
import { Plus, Save, Trash2 } from "lucide-react";
import FinderPreviewPlayer from "@/components/astrophotography/FinderPreviewPlayer";
import { SKY_TARGETS, type SkyTargetType } from "@/lib/sky-targets";
import type { FinderPreviewStep } from "@/lib/finder-previews";

type FinderPreviewRow = {
  id: number;
  name: string;
  description: string;
  targetId: string;
  stepDelaySeconds: number;
  loop: boolean;
  steps: FinderPreviewStep[];
};

const TARGET_LABELS: Record<SkyTargetType, string> = {
  constellation: "Constellations",
  "deep-sky": "Deep-sky Objects",
  "solar-system": "Planets + Moon",
  star: "Stars",
};

const INPUT =
  "w-full bg-surface/[0.04] border border-surface/15 px-3 py-2 text-muted font-mono text-sm focus:outline-none focus:border-accent/60 placeholder-muted/25 transition-colors";
const LABEL = "block font-mono text-xs text-muted/50 uppercase tracking-widest mb-1.5";

function emptyStep(): FinderPreviewStep {
  return { targetId: SKY_TARGETS[0]?.id ?? "", description: "", zoomLevel: 2.2 };
}

export default function FinderPreviewManager() {
  const [previews, setPreviews] = useState<FinderPreviewRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | "new">("new");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetId, setTargetId] = useState(SKY_TARGETS[0]?.id ?? "");
  const [stepDelaySeconds, setStepDelaySeconds] = useState("4");
  const [loop, setLoop] = useState(false);
  const [steps, setSteps] = useState<FinderPreviewStep[]>([emptyStep()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { clearDirty } = useUnsavedChangesGuard([
    name, description, targetId, stepDelaySeconds, loop, JSON.stringify(steps),
  ]);

  const targetGroups = useMemo(
    () => SKY_TARGETS.reduce<Record<SkyTargetType, typeof SKY_TARGETS>>((acc, target) => {
      acc[target.type].push(target);
      return acc;
    }, { constellation: [], "deep-sky": [], "solar-system": [], star: [] }),
    []
  );

  const previewForPlayer = useMemo(() => ({
    id: selectedId === "new" ? 0 : selectedId,
    name: name || "Unsaved finder preview",
    description,
    targetId,
    stepDelaySeconds: Number(stepDelaySeconds) || 4,
    loop,
    steps,
    createdAt: new Date(),
    updatedAt: new Date(),
  }), [description, loop, name, selectedId, stepDelaySeconds, steps, targetId]);

  async function load() {
    const res = await fetch("/api/finder-previews?admin=true");
    const data = res.ok ? await res.json() : [];
    setPreviews(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function selectPreview(id: number | "new") {
    clearDirty();
    setSelectedId(id);
    setError("");
    if (id === "new") {
      setName("");
      setDescription("");
      setTargetId(SKY_TARGETS[0]?.id ?? "");
      setStepDelaySeconds("4");
      setLoop(false);
      setSteps([emptyStep()]);
      return;
    }

    const preview = previews.find((item) => item.id === id);
    if (!preview) return;
    setName(preview.name);
    setDescription(preview.description);
    setTargetId(preview.targetId);
    setStepDelaySeconds(String(preview.stepDelaySeconds));
    setLoop(preview.loop);
    setSteps(preview.steps.length ? preview.steps : [emptyStep()]);
  }

  function updateStep(index: number, patch: Partial<FinderPreviewStep>) {
    setSteps((current) => current.map((step, i) => i === index ? { ...step, ...patch } : step));
  }

  async function savePreview(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch(selectedId === "new" ? "/api/finder-previews" : `/api/finder-previews/${selectedId}`, {
      method: selectedId === "new" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        targetId,
        stepDelaySeconds: Number(stepDelaySeconds),
        loop,
        steps,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save finder preview");
      return;
    }

    clearDirty();
    await load();
    setSelectedId(data.id);
  }

  async function deletePreview() {
    if (selectedId === "new") return;
    if (!confirm("Delete this finder preview? Existing embeds for it will stop loading.")) return;
    const res = await fetch(`/api/finder-previews/${selectedId}`, { method: "DELETE" });
    if (res.ok) {
      await load();
      selectPreview("new");
    }
  }

  const targetSelect = (value: string, onChange: (value: string) => void) => (
    <select className={INPUT} value={value} onChange={(e) => onChange(e.target.value)}>
      {(Object.keys(targetGroups) as SkyTargetType[]).map((type) => (
        <optgroup key={type} label={TARGET_LABELS[type]}>
          {targetGroups[type].map((target) => (
            <option key={target.id} value={target.id}>{target.name}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );

  return (
    <div className="grid xl:grid-cols-[22rem_minmax(0,1fr)] gap-6">
      <aside className="space-y-3">
        <button
          type="button"
          onClick={() => selectPreview("new")}
          className="w-full inline-flex items-center justify-center gap-2 border border-accent px-4 py-2 font-mono text-xs text-accent hover:bg-accent/10"
        >
          <Plus size={13} />
          New Finder Preview
        </button>
        <div className="border border-surface/10 divide-y divide-surface/[0.06]">
          {previews.length === 0 ? (
            <p className="px-4 py-8 text-center font-mono text-xs text-muted/30">No finder previews yet.</p>
          ) : previews.map((preview) => (
            <button
              key={preview.id}
              type="button"
              onClick={() => selectPreview(preview.id)}
              className={`w-full text-left px-4 py-3 transition-colors ${
                selectedId === preview.id ? "bg-accent/10" : "hover:bg-surface/[0.025]"
              }`}
            >
              <span className="block text-sm text-surface font-medium">{preview.name}</span>
              <span className="block mt-1 font-mono text-[10px] text-muted/35">
                #{preview.id} · {preview.steps.length} steps
              </span>
            </button>
          ))}
        </div>
      </aside>

      <div className="space-y-6 min-w-0">
        <form onSubmit={savePreview} className="border border-surface/10 bg-surface/[0.02] p-4 sm:p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Name</label>
              <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className={LABEL}>Primary target</label>
              {targetSelect(targetId, setTargetId)}
            </div>
          </div>

          <div>
            <label className={LABEL}>Description</label>
            <textarea className={`${INPUT} resize-none`} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid sm:grid-cols-[10rem_1fr] gap-4 items-end">
            <div>
              <label className={LABEL}>Seconds / step</label>
              <input className={INPUT} type="number" min="1" max="60" value={stepDelaySeconds} onChange={(e) => setStepDelaySeconds(e.target.value)} />
            </div>
            <label className="inline-flex items-center gap-2 font-mono text-xs text-muted/55 pb-2">
              <input type="checkbox" className="accent-accent" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
              Loop by default
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-mono text-xs text-muted/50 uppercase tracking-widest">Steps</h2>
              <button type="button" onClick={() => setSteps((items) => [...items, emptyStep()])} className="font-mono text-xs text-accent hover:underline">
                Add step
              </button>
            </div>
            {steps.map((step, index) => (
              <div key={index} className="border border-surface/10 p-3 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-mono text-[10px] text-muted/40 uppercase tracking-widest">Step {index + 1}</p>
                  {steps.length > 1 && (
                    <button type="button" onClick={() => setSteps((items) => items.filter((_, i) => i !== index))} className="text-muted/35 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {targetSelect(step.targetId, (value) => updateStep(index, { targetId: value }))}
                <div>
                  <label className={LABEL}>Zoom level</label>
                  <input
                    className={INPUT}
                    type="number"
                    min="0.65"
                    max="8"
                    step="0.1"
                    value={step.zoomLevel ?? 2.2}
                    onChange={(e) => updateStep(index, { zoomLevel: Number(e.target.value) })}
                  />
                </div>
                <textarea
                  className={`${INPUT} resize-none`}
                  rows={2}
                  value={step.description}
                  onChange={(e) => updateStep(index, { description: e.target.value })}
                  placeholder="What should the reader look for at this step?"
                />
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 border border-accent px-4 py-2 font-mono text-xs text-accent hover:bg-accent/10 disabled:opacity-50">
              <Save size={13} />
              {saving ? "Saving..." : "Save Finder Preview"}
            </button>
            {selectedId !== "new" && (
              <button type="button" onClick={deletePreview} className="inline-flex items-center gap-2 border border-red-400/35 px-4 py-2 font-mono text-xs text-red-300 hover:bg-red-400/10">
                <Trash2 size={13} />
                Delete
              </button>
            )}
          </div>
        </form>

        <FinderPreviewPlayer preview={previewForPlayer} />

        {selectedId !== "new" && (
          <p className="font-mono text-xs text-muted/40 border border-surface/10 px-4 py-3">
            Embed token: <span className="text-accent">finder-preview #{selectedId}</span>. Use the finder button in the rich-text editor to insert it.
          </p>
        )}
      </div>
    </div>
  );
}
