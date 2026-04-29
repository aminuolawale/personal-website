"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { FONT_OPTIONS, DEFAULT_FONT, type FontChoice } from "@/lib/theme-config";

export default function FontEditor() {
  const { updateFont } = useTheme();
  const [selected, setSelected] = useState<FontChoice>(DEFAULT_FONT);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Pre-load all Google Fonts for preview
  useEffect(() => {
    FONT_OPTIONS.forEach((opt) => {
      if (opt.googleUrl && !document.querySelector(`link[href="${opt.googleUrl}"]`)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = opt.googleUrl;
        document.head.appendChild(link);
      }
    });
  }, []);

  useEffect(() => {
    fetch("/api/config?key=font-choice")
      .then((r) => r.json())
      .then(({ value }) => { if (value) setSelected(value); })
      .catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    updateFont(selected.sans === DEFAULT_FONT.sans ? null : selected);
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "font-choice", value: selected }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleReset() {
    setSelected(DEFAULT_FONT);
    updateFont(null);
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "font-choice", value: DEFAULT_FONT }),
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        {FONT_OPTIONS.map((opt) => {
          const isActive = selected.sans === opt.sans;
          return (
            <button
              key={opt.sans}
              onClick={() => setSelected({ sans: opt.sans, mono: opt.mono, googleUrl: opt.googleUrl })}
              className={`text-left border p-4 transition-all ${
                isActive
                  ? "border-accent bg-accent/5"
                  : "border-surface/10 hover:border-accent/30"
              }`}
            >
              <p
                className="text-sm font-semibold mb-1 text-surface"
                style={{ fontFamily: `"${opt.sans}", sans-serif` }}
              >
                {opt.sans}
              </p>
              <p
                className="text-[11px] text-muted/50 mb-2"
                style={{ fontFamily: `"${opt.mono}", monospace` }}
              >
                {opt.mono}
              </p>
              <p
                className="text-xs text-muted/60 leading-relaxed"
                style={{ fontFamily: `"${opt.sans}", sans-serif` }}
              >
                The quick brown fox jumps over the lazy dog
              </p>
              <p
                className="text-[11px] text-muted/40 mt-1"
                style={{ fontFamily: `"${opt.mono}", monospace` }}
              >
                const greeting = &quot;hello world&quot;;
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="font-mono text-xs text-accent border border-accent px-4 py-2 hover:bg-accent/10 transition-all disabled:opacity-40"
        >
          {saving ? "Saving…" : saved ? "Saved" : "Save font"}
        </button>
        <button
          onClick={handleReset}
          className="font-mono text-xs text-muted/40 hover:text-muted/70 transition-colors"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
