"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { COLOR_PALETTE_PRESETS, type PaletteTheme } from "@/lib/theme-config";

type ThemeToggleMode = "icon" | "segmented" | "responsive";
type ThemeMode = "dark" | "light";

function isSameTheme(a: PaletteTheme, b: PaletteTheme) {
  return a.base === b.base && a.accent === b.accent && a.surface === b.surface && a.muted === b.muted;
}

function IconToggle({ className }: { className?: string }) {
  const { theme, setTheme, palette, updatePalette } = useTheme();

  function cycleCurrentMode() {
    const mode = theme;
    const currentIndex = COLOR_PALETTE_PRESETS.findIndex((preset) => isSameTheme(preset.palette[mode], palette[mode]));
    const nextPreset = COLOR_PALETTE_PRESETS[(currentIndex + 1) % COLOR_PALETTE_PRESETS.length];
    updatePalette({ ...palette, [mode]: nextPreset.palette[mode] });
    setTheme(mode);
  }

  return (
    <button
      type="button"
      onClick={cycleCurrentMode}
      aria-label={`Cycle ${theme} theme`}
      title={`Cycle ${theme} theme`}
      className={`grid h-8 w-8 place-items-center text-muted/50 hover:text-accent transition-colors duration-200 ${className ?? ""}`}
    >
      {theme === "dark" ? <Moon size={15} /> : <Sun size={15} />}
    </button>
  );
}

function SegmentedToggle({ className }: { className?: string }) {
  const { theme, setTheme, palette, updatePalette } = useTheme();
  const options = [
    { value: "dark" as const, icon: Moon },
    { value: "light" as const, icon: Sun },
  ];

  function cycleMode(value: ThemeMode) {
    const currentIndex = COLOR_PALETTE_PRESETS.findIndex((preset) => isSameTheme(preset.palette[value], palette[value]));
    const nextPreset = COLOR_PALETTE_PRESETS[(currentIndex + 1) % COLOR_PALETTE_PRESETS.length];
    updatePalette({ ...palette, [value]: nextPreset.palette[value] });
    setTheme(value);
  }

  return (
    <div
      className={`inline-grid grid-cols-2 items-center border border-surface/10 bg-surface/[0.03] p-0.5 ${className ?? ""}`}
      aria-label="Theme selector"
    >
      {options.map(({ value, icon: Icon }) => {
        const active = theme === value;

        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            aria-label={`Cycle ${value} theme`}
            title={`Cycle ${value} theme`}
            onClick={() => cycleMode(value)}
            className={`grid h-8 w-8 place-items-center transition-colors sm:w-10 ${
              active
                ? "bg-accent text-base"
                : "text-muted/50 hover:text-accent"
            }`}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}

export default function ThemeToggle({
  className,
  mode = "icon",
}: {
  className?: string;
  mode?: ThemeToggleMode;
}) {
  if (mode === "segmented") return <SegmentedToggle className={className} />;

  if (mode === "responsive") {
    return <SegmentedToggle className={className} />;
  }

  return <IconToggle className={className} />;
}
