import { describe, expect, it } from "vitest";
import { COLOR_PALETTE_PRESETS } from "@/lib/theme-config";

const MIN_TEXT_CONTRAST = 4.5;

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  return [0, 2, 4].map((offset) => parseInt(normalized.slice(offset, offset + 2), 16) / 255);
}

function linearize(channel: number) {
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const [red, green, blue] = hexToRgb(hex).map(linearize);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(a: string, b: string) {
  const first = luminance(a);
  const second = luminance(b);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("theme color presets", () => {
  it("keeps every text token readable against its background", () => {
    for (const preset of COLOR_PALETTE_PRESETS) {
      for (const mode of ["dark", "light"] as const) {
        const theme = preset.palette[mode];

        for (const textToken of ["surface", "muted", "accent"] as const) {
          expect(
            contrastRatio(theme[textToken], theme.base),
            `${preset.label} ${mode} ${textToken} contrast`
          ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
        }
      }
    }
  });

  it("uses unique preset ids", () => {
    const ids = COLOR_PALETTE_PRESETS.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
