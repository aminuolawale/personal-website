"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  DEFAULT_PALETTE,
  DEFAULT_FONT,
  type ColorPalette,
  type FontChoice,
} from "@/lib/theme-config";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  palette: ColorPalette;
  updatePalette: (p: ColorPalette | null) => void;
  font: FontChoice;
  updateFont: (f: FontChoice | null) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggle: () => {},
  palette: DEFAULT_PALETTE,
  updatePalette: () => {},
  font: DEFAULT_FONT,
  updateFont: () => {},
});

function applyPaletteToDOM(palette: ColorPalette | null) {
  const p = palette ?? DEFAULT_PALETTE;
  let el = document.getElementById("palette-overrides");
  if (palette === null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("style");
    el.id = "palette-overrides";
    document.head.appendChild(el);
  }
  el.textContent =
    `:root{--color-base:${p.dark.base};--color-accent:${p.dark.accent};--color-surface:${p.dark.surface};--color-muted:${p.dark.muted}}` +
    `[data-theme="light"]{--color-base:${p.light.base};--color-accent:${p.light.accent};--color-surface:${p.light.surface};--color-muted:${p.light.muted}}`;
}

function applyFontToDOM(font: FontChoice | null) {
  const f = font ?? DEFAULT_FONT;
  if (f.googleUrl && !document.querySelector(`link[href="${f.googleUrl}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = f.googleUrl;
    document.head.appendChild(link);
  }
  let el = document.getElementById("font-overrides");
  if (font === null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("style");
    el.id = "font-overrides";
    document.head.appendChild(el);
  }
  el.textContent = `:root{--font-space-grotesk:"${f.sans}",sans-serif;--font-space-mono:"${f.mono}",monospace}`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [palette, setPalette] = useState<ColorPalette>(DEFAULT_PALETTE);
  const [font, setFont] = useState<FontChoice>(DEFAULT_FONT);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    if (storedTheme === "light") setTheme("light");

    try {
      const raw = localStorage.getItem("color-palette");
      if (raw) setPalette(JSON.parse(raw));
    } catch {}

    try {
      const raw = localStorage.getItem("font-choice");
      if (raw) setFont(JSON.parse(raw));
    } catch {}
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  const updatePalette = useCallback((p: ColorPalette | null) => {
    setPalette(p ?? DEFAULT_PALETTE);
    if (p) {
      localStorage.setItem("color-palette", JSON.stringify(p));
    } else {
      localStorage.removeItem("color-palette");
    }
    applyPaletteToDOM(p);
  }, []);

  const updateFont = useCallback((f: FontChoice | null) => {
    setFont(f ?? DEFAULT_FONT);
    if (f && f.sans !== DEFAULT_FONT.sans) {
      localStorage.setItem("font-choice", JSON.stringify(f));
    } else {
      localStorage.removeItem("font-choice");
    }
    applyFontToDOM(f);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle, palette, updatePalette, font, updateFont }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
