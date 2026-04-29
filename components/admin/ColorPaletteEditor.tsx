"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { DEFAULT_PALETTE, type ColorPalette, type PaletteTheme } from "@/lib/theme-config";

const COLOR_FIELDS: { key: keyof PaletteTheme; label: string; hint: string }[] = [
  { key: "base",    label: "Background", hint: "Page background" },
  { key: "accent",  label: "Accent",     hint: "Links, highlights, active elements" },
  { key: "surface", label: "Surface",    hint: "Headings and high-contrast text" },
  { key: "muted",   label: "Muted",      hint: "Body text" },
];

function ThemeSlot({
  label,
  theme,
  values,
  onChange,
}: {
  label: string;
  theme: "dark" | "light";
  values: PaletteTheme;
  onChange: (key: keyof PaletteTheme, val: string) => void;
}) {
  return (
    <div className="border border-surface/10 p-4">
      <p className="font-mono text-xs text-muted/50 uppercase tracking-widest mb-3">{label}</p>
      <div className="grid grid-cols-2 gap-3">
        {COLOR_FIELDS.map(({ key, label, hint }) => (
          <label key={key} className="block">
            <span className="font-mono text-[10px] text-muted/40 uppercase tracking-wide">{label}</span>
            <p className="font-mono text-[10px] text-muted/25 mb-1">{hint}</p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={values[key]}
                onChange={(e) => onChange(key, e.target.value)}
                className="h-8 w-12 border-0 bg-transparent cursor-pointer rounded-none"
              />
              <span className="font-mono text-xs text-muted/50">{values[key]}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function ColorPaletteEditor() {
  const { updatePalette } = useTheme();
  const [palette, setPalette] = useState<ColorPalette>(DEFAULT_PALETTE);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/config?key=color-palette")
      .then((r) => r.json())
      .then(({ value }) => { if (value) setPalette(value); })
      .catch(() => {});
  }, []);

  function patchTheme(themeKey: "dark" | "light", key: keyof PaletteTheme, val: string) {
    const next = { ...palette, [themeKey]: { ...palette[themeKey], [key]: val } };
    setPalette(next);
    updatePalette(next);
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "color-palette", value: palette }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleReset() {
    setPalette(DEFAULT_PALETTE);
    updatePalette(null);
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "color-palette", value: DEFAULT_PALETTE }),
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <ThemeSlot
          label="Dark theme"
          theme="dark"
          values={palette.dark}
          onChange={(k, v) => patchTheme("dark", k, v)}
        />
        <ThemeSlot
          label="Light theme"
          theme="light"
          values={palette.light}
          onChange={(k, v) => patchTheme("light", k, v)}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="font-mono text-xs text-accent border border-accent px-4 py-2 hover:bg-accent/10 transition-all disabled:opacity-40"
        >
          {saving ? "Saving…" : saved ? "Saved" : "Save palette"}
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
