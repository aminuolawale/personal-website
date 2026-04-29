export interface PaletteTheme {
  base: string;
  accent: string;
  surface: string;
  muted: string;
}

export interface ColorPalette {
  dark: PaletteTheme;
  light: PaletteTheme;
}

export interface FontChoice {
  sans: string;
  mono: string;
  googleUrl: string | null;
}

export const DEFAULT_PALETTE: ColorPalette = {
  dark:  { base: "#020122", accent: "#fc9e4f", surface: "#f2f3ae", muted: "#edd382" },
  light: { base: "#ffffff", accent: "#b83a08", surface: "#030712", muted: "#111827" },
};

export const FONT_OPTIONS = [
  {
    label: "Space Grotesk + Space Mono",
    sans: "Space Grotesk",
    mono: "Space Mono",
    googleUrl: null,
  },
  {
    label: "Inter + JetBrains Mono",
    sans: "Inter",
    mono: "JetBrains Mono",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap",
  },
  {
    label: "IBM Plex Sans + IBM Plex Mono",
    sans: "IBM Plex Sans",
    mono: "IBM Plex Mono",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=IBM+Plex+Mono:wght@400;700&display=swap",
  },
  {
    label: "DM Sans + DM Mono",
    sans: "DM Sans",
    mono: "DM Mono",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap",
  },
] as const;

export const DEFAULT_FONT: FontChoice = {
  sans: "Space Grotesk",
  mono: "Space Mono",
  googleUrl: null,
};
