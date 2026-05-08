"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import {
  COLOR_PALETTE_PRESETS,
  DEFAULT_PALETTE,
  type ColorPalette,
  type ColorPalettePreset,
  type PaletteTheme,
} from "@/lib/theme-config";

const COLOR_FIELDS: { key: keyof PaletteTheme; label: string; hint: string }[] = [
  { key: "base",    label: "Background", hint: "Page background" },
  { key: "accent",  label: "Accent",     hint: "Links, highlights, active elements" },
  { key: "surface", label: "Surface",    hint: "Headings and high-contrast text" },
  { key: "muted",   label: "Muted",      hint: "Body text" },
];

function ThemeSlot({
  label,
  values,
  onChange,
}: {
  label: string;
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

function isSamePalette(a: ColorPalette, b: ColorPalette) {
  return COLOR_FIELDS.every(({ key }) => a.dark[key] === b.dark[key] && a.light[key] === b.light[key]);
}

function PaletteSwatch({ values }: { values: PaletteTheme }) {
  return (
    <div
      className="h-16 border border-surface/10 p-2"
      style={{ backgroundColor: values.base }}
      aria-hidden
    >
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="h-2 w-10 rounded-full" style={{ backgroundColor: values.accent }} />
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: values.surface }} />
        </div>
        <div className="space-y-1">
          <span className="block h-2 w-3/4 rounded-full" style={{ backgroundColor: values.surface }} />
          <span className="block h-2 w-1/2 rounded-full" style={{ backgroundColor: values.muted }} />
        </div>
      </div>
    </div>
  );
}

function PalettePresetCard({
  preset,
  active,
  onSelect,
}: {
  preset: ColorPalettePreset;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group text-left border p-3 transition-colors ${
        active
          ? "border-accent bg-accent/10"
          : "border-surface/10 bg-surface/[0.02] hover:border-accent/35 hover:bg-surface/[0.035]"
      }`}
      aria-pressed={active}
    >
      <div className="grid grid-cols-2 gap-2">
        <PaletteSwatch values={preset.palette.dark} />
        <PaletteSwatch values={preset.palette.light} />
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-surface">{preset.label}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted/50">{preset.description}</p>
        </div>
        {active && (
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-accent">
            Active
          </span>
        )}
      </div>
    </button>
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
      .then(({ value }) => {
        if (value) {
          setPalette(value);
          updatePalette(value);
        }
      })
      .catch(() => {});
  }, [updatePalette]);

  function patchTheme(themeKey: "dark" | "light", key: keyof PaletteTheme, val: string) {
    const next = { ...palette, [themeKey]: { ...palette[themeKey], [key]: val } };
    setPalette(next);
    updatePalette(next);
  }

  function applyPreset(preset: ColorPalettePreset) {
    setPalette(preset.palette);
    updatePalette(preset.palette);
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
      <div>
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted/50">
          Readable presets
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {COLOR_PALETTE_PRESETS.map((preset) => (
            <PalettePresetCard
              key={preset.id}
              preset={preset}
              active={isSamePalette(palette, preset.palette)}
              onSelect={() => applyPreset(preset)}
            />
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <ThemeSlot
          label="Dark theme"
          values={palette.dark}
          onChange={(k, v) => patchTheme("dark", k, v)}
        />
        <ThemeSlot
          label="Light theme"
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
