export const SECTION_IDS = ["swe", "astrophotography", "writing", "misc"] as const;
export type SectionId = (typeof SECTION_IDS)[number];
export type SectionVisibility = Record<SectionId, boolean>;

export const DEFAULT_VISIBILITY: SectionVisibility = {
  swe: true,
  astrophotography: true,
  writing: true,
  misc: true,
};

export async function getSectionVisibility(): Promise<SectionVisibility> {
  const { getDb } = await import("@/lib/db");
  const { siteConfig } = await import("@/lib/schema");
  const { eq } = await import("drizzle-orm");
  try {
    const db = getDb();
    const [row] = await db.select().from(siteConfig).where(eq(siteConfig.key, "section-visibility"));
    if (row) return { ...DEFAULT_VISIBILITY, ...JSON.parse(row.value) };
  } catch {}
  return DEFAULT_VISIBILITY;
}
