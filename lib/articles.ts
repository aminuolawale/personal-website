export const SECTION_LABEL: Record<string, string> = {
  writing: "Writing",
  astrophotography: "Astrophotography",
  swe: "SWE",
  misc: "Misc",
};

export function articleLink(article: { type: string; slug: string }): string {
  if (article.type === "misc") return `/misc?tab=${article.slug}`;
  return `/${article.type === "swe" ? "swe" : article.type}/${article.slug}`;
}
