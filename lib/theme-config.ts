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

export interface ColorPalettePreset {
  id: string;
  label: string;
  description: string;
  palette: ColorPalette;
}

export interface FontChoice {
  sans: string;
  mono: string;
  googleUrl: string | null;
}

export const DEFAULT_PALETTE: ColorPalette = {
  dark:  { base: "#0f172a", accent: "#38bdf8", surface: "#f8fafc", muted: "#cbd5e1" },
  light: { base: "#f8fafc", accent: "#2563eb", surface: "#0f172a", muted: "#334155" },
};

export const COLOR_PALETTE_PRESETS: ColorPalettePreset[] = [
  {
    id: "site-default",
    label: "Site Default",
    description: "The original site palette used by default before any admin customization.",
    palette: DEFAULT_PALETTE,
  },
  {
    id: "forest-mist",
    label: "Forest Mist",
    description: "Soft green accents with warm readable neutrals.",
    palette: {
      dark:  { base: "#101814", accent: "#6ee7b7", surface: "#f4f7f2", muted: "#cbd8cf" },
      light: { base: "#fbfdf8", accent: "#047857", surface: "#17211b", muted: "#3f4f46" },
    },
  },
  {
    id: "ink-rose",
    label: "Ink Rose",
    description: "Editorial contrast with a restrained rose accent.",
    palette: {
      dark:  { base: "#17131a", accent: "#f0abfc", surface: "#faf5ff", muted: "#d8c8dd" },
      light: { base: "#fff8fb", accent: "#be185d", surface: "#24151d", muted: "#55414b" },
    },
  },
  {
    id: "midnight-amber",
    label: "Midnight Amber",
    description: "Warmer than the default, but less harsh than saturated orange.",
    palette: {
      dark:  { base: "#12100d", accent: "#fbbf24", surface: "#fff7ed", muted: "#dccfc0" },
      light: { base: "#fffaf0", accent: "#b45309", surface: "#21180c", muted: "#514435" },
    },
  },
  {
    id: "paper-indigo",
    label: "Paper Indigo",
    description: "Crisp light mode and deep indigo dark mode for technical writing.",
    palette: {
      dark:  { base: "#111322", accent: "#a5b4fc", surface: "#f8fafc", muted: "#cbd0e6" },
      light: { base: "#fbfbff", accent: "#4f46e5", surface: "#15172a", muted: "#42465f" },
    },
  },
  {
    id: "graphite-cyan",
    label: "Graphite Cyan",
    description: "Low-glare graphite surfaces with clear cyan affordances.",
    palette: {
      dark:  { base: "#111827", accent: "#22d3ee", surface: "#f9fafb", muted: "#d1d5db" },
      light: { base: "#f9fafb", accent: "#0e7490", surface: "#111827", muted: "#374151" },
    },
  },
  {
    id: "ocean-depth",
    label: "Ocean Depth",
    description: "Deep blue-black with bright but comfortable aquatic accents.",
    palette: {
      dark:  { base: "#08111f", accent: "#67e8f9", surface: "#f8fafc", muted: "#c6d3e1" },
      light: { base: "#f5fbff", accent: "#0369a1", surface: "#0b1726", muted: "#334155" },
    },
  },
  {
    id: "aubergine",
    label: "Aubergine",
    description: "A rich purple editorial theme with restrained contrast.",
    palette: {
      dark:  { base: "#18111f", accent: "#c4b5fd", surface: "#fbf7ff", muted: "#d6c8e7" },
      light: { base: "#fffaff", accent: "#7e22ce", surface: "#211528", muted: "#56445f" },
    },
  },
  {
    id: "cocoa-sage",
    label: "Cocoa Sage",
    description: "Warm dark neutrals paired with accessible green accents.",
    palette: {
      dark:  { base: "#17140f", accent: "#86efac", surface: "#fffaf0", muted: "#d8ccba" },
      light: { base: "#fffdf7", accent: "#166534", surface: "#211c14", muted: "#51483c" },
    },
  },
  {
    id: "nord-frost",
    label: "Nord Frost",
    description: "Cool, familiar, and very readable across both modes.",
    palette: {
      dark:  { base: "#101820", accent: "#93c5fd", surface: "#f8fafc", muted: "#cbd5e1" },
      light: { base: "#f8fafc", accent: "#1d4ed8", surface: "#111827", muted: "#374151" },
    },
  },
  {
    id: "paper-teal",
    label: "Paper Teal",
    description: "Clean paper tones with grounded teal interaction color.",
    palette: {
      dark:  { base: "#0f1717", accent: "#5eead4", surface: "#f8fffd", muted: "#c7d8d6" },
      light: { base: "#f8fffd", accent: "#0f766e", surface: "#10201f", muted: "#3d5653" },
    },
  },
  {
    id: "carbon-lime",
    label: "Carbon Lime",
    description: "Charcoal and soft lime without neon glare.",
    palette: {
      dark:  { base: "#10140f", accent: "#bef264", surface: "#f7fee7", muted: "#d4dfc5" },
      light: { base: "#fbfef7", accent: "#4d7c0f", surface: "#1a2114", muted: "#4a563d" },
    },
  },
  {
    id: "burgundy-paper",
    label: "Burgundy Paper",
    description: "Warm reading palette with sober red highlights.",
    palette: {
      dark:  { base: "#1b1114", accent: "#fda4af", surface: "#fff7f8", muted: "#dfc8cc" },
      light: { base: "#fff8f8", accent: "#be123c", surface: "#261417", muted: "#5b4146" },
    },
  },
  {
    id: "stone-violet",
    label: "Stone Violet",
    description: "Quiet stone neutrals with a clear violet accent.",
    palette: {
      dark:  { base: "#161615", accent: "#ddd6fe", surface: "#fafaf9", muted: "#d6d3d1" },
      light: { base: "#fafaf9", accent: "#6d28d9", surface: "#1c1917", muted: "#57534e" },
    },
  },
];

export const FONT_OPTIONS = [
  {
    label: "Inter + JetBrains Mono",
    sans: "Inter",
    mono: "JetBrains Mono",
    googleUrl: null,
  },
  {
    label: "Space Grotesk + Space Mono",
    sans: "Space Grotesk",
    mono: "Space Mono",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Space+Mono:wght@400;700&display=swap",
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
  sans: "Inter",
  mono: "JetBrains Mono",
  googleUrl: null,
};
