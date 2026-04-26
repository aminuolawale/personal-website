"use client";

import { useState, useEffect } from "react";
import { ArrowUp, ArrowDown, Save, RotateCcw } from "lucide-react";

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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/config?key=tab-order-${section}`)
      .then((r) => (r.ok ? r.json() : { value: null }))
      .then(({ value }) => {
        if (Array.isArray(value) && value.length === defaultTabs.length) {
          const valid = defaultTabs.every((t) => value.includes(t.id));
          if (valid) setOrder(value);
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

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: `tab-order-${section}`, value: order }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setOrder(defaultTabs.map((t) => t.id));
    setSaved(false);
  }

  return (
    <div className="border border-surface/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-muted/50 uppercase tracking-widest">
          {section} tab order
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
        {tabsInOrder.map((tab, i) => (
          <div
            key={tab.id}
            className="flex items-center justify-between bg-surface/[0.03] border border-surface/10 px-3 py-2"
          >
            <span className="text-surface text-sm">{tab.label}</span>
            <div className="flex gap-1">
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
        ))}
      </div>
    </div>
  );
}
