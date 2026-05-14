import type { TabConfig } from "@/components/TabBar";

export type SectionTabId = "swe" | "astrophotography" | "writing";

export const SECTION_TABS: Record<SectionTabId, TabConfig[]> = {
  swe: [
    { id: "articles", label: "Articles" },
    { id: "projects", label: "Projects" },
    { id: "about", label: "About Me" },
    { id: "activity", label: "Activity" },
  ],
  astrophotography: [
    { id: "articles", label: "Articles" },
    { id: "calendar", label: "Astro Calendar" },
    { id: "gallery", label: "Gallery" },
    { id: "gear", label: "Gear" },
    { id: "sky", label: "Night Sky" },
    { id: "quiz", label: "Quiz" },
  ],
  writing: [
    { id: "book-reviews", label: "Book reviews" },
    { id: "reading-notes", label: "Reading notes" },
  ],
};
