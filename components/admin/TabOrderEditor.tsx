"use client";

import { useState, useEffect } from "react";
import { ArrowUp, ArrowDown, Save, RotateCcw, Eye, EyeOff } from "lucide-react";

interface TabDef {
  id: string;
  label: string;
}

interface TabOrderEditorProps {
  section: string;
  defaultTabs: TabDef[];
}

export default function TabOrderEditor({ section, defaultTabs }: TabOrderEditorProps) {
  const [order, setOrder] = useState<string[]>(defaultTabs.map((t) => t.id));
  const [labels, setLabels] = useState<Record<string, string>>(
    Object.fromEntries(defaultTabs.map((t) => [t.id, t.label]))
  );
  const [visibility, setVisibility] = useState<Record<string, boolean>>(
    Object.fromEntries(defaultTabs.map((t) => [t.id, true]))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/config?key=tab-order-${section}`).then((r) => (r.ok ? r.json() : { value: null })),
      fetch(`/api/config?key=tab-labels-${section}`).then((r) => (r.ok ? r.json() : { value: null })),
      fetch(`/api/config?key=tab-visibility-${section}`).then((r) => (r.ok ? r.json() : { value: null })),
    ])
      .then(([orderRes, labelsRes, visRes]) => {
        if (Array.isArray(orderRes.value) && orderRes.value.length === defaultTabs.length) {
          const valid = defaultTabs.every((t) => orderRes.value.includes(t.id));
          if (valid) setOrder(orderRes.value);
        }
        if (labelsRes.value && typeof labelsRes.value === "object" && !Array.isArray(labelsRes.value)) {
          setLabels((prev) => ({ ...prev, ...labelsRes.value }));
        }
        if (visRes.value && typeof visRes.value === "object" && !Array.isArray(visRes.value)) {
          setVisibility((prev) => ({ ...prev, ...visRes.value }));
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const tabsInOrder = order.map((id) => defaultTabs.find((t) => t.id === id)!).filter(Boolean);

  function move(index: number, dir: -1 | 1) {
    const next = [...order];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    setSaved(false);
  }

  function setLabel(id: string, value: string) {
    setLabels((prev) => ({ ...prev, [id]: value }));
    setSaved(false);
  }

  function toggleVisibility(id: string) {
    setVisibility((prev) => ({ ...prev, [id]: !prev[id] }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await Promise.all([
        fetch("/api/config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: `tab-order-${section}`, value: order }),
        }),
        fetch("/api/config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: `tab-labels-${section}`, value: labels }),
        }),
        fetch("/api/config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: `tab-visibility-${section}`, value: visibility }),
        }),
      ]);
      setSaved(true);
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setOrder(defaultTabs.map((t) => t.id));
    setLabels(Object.fromEntries(defaultTabs.map((t) => [t.id, t.label])));
    setVisibility(Object.fromEntries(defaultTabs.map((t) => [t.id, true])));
    setSaved(false);
  }

  return (
    <div className="border border-surface/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-muted/50 uppercase tracking-widest">
          {section} tabs
        </p>
        <div className="flex items-center gap-2">
          {error && <span className="font-mono text-xs text-red-400">{error}</span>}
          {saved && <span className="font-mono text-xs text-emerald-400/70">Saved</span>}
          <button
            onClick={handleReset}
            title="Reset to default"
            className="p-1.5 text-muted/30 hover:text-muted/70 transition-colors"
          >
            <RotateCcw size={12} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 font-mono text-xs text-base bg-accent px-3 py-1.5 hover:opacity-90 disabled:opacity-40"
          >
            <Save size={11} />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        {tabsInOrder.map((tab, i) => {
          const isVisible = visibility[tab.id] !== false;
          return (
          <div
            key={tab.id}
            className={`flex items-center gap-3 border px-3 py-2 transition-colors ${
              isVisible ? "bg-surface/[0.03] border-surface/10" : "bg-transparent border-surface/[0.05] opacity-50"
            }`}
          >
            <input
              type="text"
              value={labels[tab.id] ?? tab.label}
              onChange={(e) => setLabel(tab.id, e.target.value)}
              disabled={!isVisible}
              className="flex-1 bg-transparent font-mono text-xs text-surface placeholder-muted/30 border-b border-surface/20 focus:border-accent outline-none py-0.5 disabled:cursor-default"
            />
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => toggleVisibility(tab.id)}
                className={`p-1 transition-colors ${isVisible ? "text-muted/40 hover:text-accent" : "text-muted/25 hover:text-muted/60"}`}
                aria-label={isVisible ? "Hide tab" : "Show tab"}
                title={isVisible ? "Hide tab" : "Show tab"}
              >
                {isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="p-1 text-muted/40 hover:text-accent disabled:opacity-20 transition-colors"
                aria-label="Move up"
              >
                <ArrowUp size={13} />
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === tabsInOrder.length - 1}
                className="p-1 text-muted/40 hover:text-accent disabled:opacity-20 transition-colors"
                aria-label="Move down"
              >
                <ArrowDown size={13} />
              </button>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
