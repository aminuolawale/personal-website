/**
 * Tailwind class strings for each recognised tag value.
 * Keys are lowercase tag names; values are space-separated Tailwind classes.
 */
export const ASTRO_TAG_COLORS: Record<string, string> = {
  acquisition: "text-[#fc9e4f] bg-[#fc9e4f]/10 border-[#fc9e4f]/25",
  capture:     "text-[#edd382] bg-[#edd382]/10 border-[#edd382]/25",
  processing:  "text-[#f2f3ae]/70 bg-[#f2f3ae]/5 border-[#f2f3ae]/15",
};

export const WRITING_TAG_COLORS: Record<string, string> = {
  essay:           "text-[#fc9e4f] bg-[#fc9e4f]/10 border-[#fc9e4f]/25",
  personal:        "text-[#edd382] bg-[#edd382]/10 border-[#edd382]/25",
  guide:           "text-[#f2f3ae]/70 bg-[#f2f3ae]/5 border-[#f2f3ae]/15",
  astronomy:       "text-[#fc9e4f] bg-[#fc9e4f]/10 border-[#fc9e4f]/25",
  software:        "text-[#edd382] bg-[#edd382]/10 border-[#edd382]/25",
  astrophotography:"text-[#f2f3ae]/70 bg-[#f2f3ae]/5 border-[#f2f3ae]/15",
  career:          "text-[#f2f3ae]/70 bg-[#f2f3ae]/5 border-[#f2f3ae]/15",
  craft:           "text-[#edd382] bg-[#edd382]/10 border-[#edd382]/25",
  life:            "text-[#fc9e4f] bg-[#fc9e4f]/10 border-[#fc9e4f]/25",
};

/** Fallback class string for tags not present in a color map. */
export const FALLBACK_TAG_COLOR = "text-[#f2f3ae]/50 bg-[#f2f3ae]/5 border-[#f2f3ae]/15";

/** Returns the Tailwind class string for a given tag, falling back gracefully. */
export function tagColorClass(
  tag: string,
  colorMap: Record<string, string>
): string {
  return colorMap[tag] ?? FALLBACK_TAG_COLOR;
}
