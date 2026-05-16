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
  setTheme: (theme: Theme) => void;
  toggle: () => void;
  palette: ColorPalette;
  updatePalette: (p: ColorPalette | null) => void;
  font: FontChoice;
  updateFont: (f: FontChoice | null) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
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
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;

      const storedTheme = localStorage.getItem("theme") === "light" ? "light" : "dark";
      setTheme(storedTheme);

      try {
        const raw = localStorage.getItem("color-palette");
        if (raw) {
          const parsed = JSON.parse(raw) as ColorPalette;
          setPalette(parsed);
          applyPaletteToDOM(parsed);
        }
      } catch {}

      try {
        const raw = localStorage.getItem("font-choice");
        if (raw) {
          const parsed = JSON.parse(raw) as FontChoice;
          setFont(parsed);
          applyFontToDOM(parsed);
        }
      } catch {}
    });

    fetch("/api/config?keys=color-palette,font-choice")
      .then((res) => (res.ok ? res.json() : { values: {} }))
      .then(({ values }) => {
        if (cancelled || !values) return;

        if (values["color-palette"]) {
          const nextPalette = values["color-palette"] as ColorPalette;
          setPalette(nextPalette);
          applyPaletteToDOM(nextPalette);
          localStorage.setItem("color-palette", JSON.stringify(nextPalette));
        }

        if (values["font-choice"]) {
          const nextFont = values["font-choice"] as FontChoice;
          setFont(nextFont);
          applyFontToDOM(nextFont);
          localStorage.setItem("font-choice", JSON.stringify(nextFont));
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  const selectTheme = useCallback((next: Theme) => {
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }, []);

  function toggle() {
    selectTheme(theme === "dark" ? "light" : "dark");
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
    <ThemeContext.Provider value={{ theme, setTheme: selectTheme, toggle, palette, updatePalette, font, updateFont }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
