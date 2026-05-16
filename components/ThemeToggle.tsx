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
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className={`grid h-8 w-8 place-items-center text-muted/50 hover:text-accent transition-colors duration-200 ${className ?? ""}`}
    >
      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}

function SegmentedToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const options = [
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "light" as const, label: "Light", icon: Sun },
  ];

  return (
    <div
      className={`inline-grid grid-cols-2 items-center border border-surface/10 bg-surface/[0.03] p-0.5 ${className ?? ""}`}
      role="radiogroup"
      aria-label="Theme"
    >
      {options.map(({ value, label, icon: Icon }) => {
        const active = theme === value;

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={`flex h-8 min-w-20 items-center justify-center gap-1.5 px-3 font-mono text-[11px] transition-colors ${
              active
                ? "bg-accent text-base"
                : "text-muted/50 hover:text-accent"
            }`}
          >
            <Icon size={13} />
            <span>{label}</span>
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
    return (
      <>
        <SegmentedToggle className={`hidden sm:inline-grid ${className ?? ""}`} />
        <IconToggle className={`sm:hidden ${className ?? ""}`} />
      </>
    );
  }

  return <IconToggle className={className} />;
}
