/**
 * Tailwind class strings for each recognised tag value.
 * Keys are lowercase tag names; values are space-separated Tailwind classes.
 */
export const ASTRO_TAG_COLORS: Record<string, string> = {
  acquisition: "text-accent bg-accent/10 border-accent/25",
  capture:     "text-muted bg-muted/10 border-muted/25",
  processing:  "text-surface/70 bg-surface/5 border-surface/15",
};

export const WRITING_TAG_COLORS: Record<string, string> = {
  essay:           "text-accent bg-accent/10 border-accent/25",
  personal:        "text-muted bg-muted/10 border-muted/25",
  guide:           "text-surface/70 bg-surface/5 border-surface/15",
  astronomy:       "text-accent bg-accent/10 border-accent/25",
  software:        "text-muted bg-muted/10 border-muted/25",
  astrophotography:"text-surface/70 bg-surface/5 border-surface/15",
  career:          "text-surface/70 bg-surface/5 border-surface/15",
  craft:           "text-muted bg-muted/10 border-muted/25",
  life:            "text-accent bg-accent/10 border-accent/25",
};

/** Fallback class string for tags not present in a color map. */
export const FALLBACK_TAG_COLOR = "text-surface/50 bg-surface/5 border-surface/15";

/** Returns the Tailwind class string for a given tag, falling back gracefully. */
export function tagColorClass(
  tag: string,
  colorMap: Record<string, string>
): string {
  return colorMap[tag] ?? FALLBACK_TAG_COLOR;
}
