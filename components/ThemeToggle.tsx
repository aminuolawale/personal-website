"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

type ThemeToggleMode = "icon" | "segmented" | "responsive";

function IconToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className={`grid h-8 w-8 place-items-center text-muted/50 hover:text-accent transition-colors duration-200 ${className ?? ""}`}
    >
      {theme === "dark" ? <Moon size={15} /> : <Sun size={15} />}
    </button>
  );
}

function SegmentedToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={`inline-grid grid-cols-2 items-center border border-surface/10 bg-surface/[0.03] p-0.5 ${className ?? ""}`}
      aria-label="Theme selector"
    >
      {(["dark", "light"] as const).map((value) => {
        const Icon = value === "dark" ? Moon : Sun;
        const active = theme === value;

        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            aria-label={`Switch to ${value} mode`}
            title={`Switch to ${value} mode`}
            onClick={() => setTheme(value)}
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
  if (mode === "responsive") return <SegmentedToggle className={className} />;
  return <IconToggle className={className} />;
}
