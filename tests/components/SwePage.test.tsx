// @vitest-environment jsdom
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";

// Capture options passed to every next/dynamic() call made during module evaluation.
// vi.hoisted ensures this runs before both mock factories and static imports.
const { dynamicOptions } = vi.hoisted(() => ({
  dynamicOptions: [] as Array<{ loading?: () => React.ReactNode }>,
}));

vi.mock("next/dynamic", () => ({
  default: (_importFn: () => Promise<any>, opts?: { loading?: () => React.ReactNode }) => {
    dynamicOptions.push(opts ?? {});
    return () => null;
  },
}));

// Stub all static imports that page.tsx pulls in at module evaluation time.
vi.mock("framer-motion", () => ({
  m: { div: ({ children }: any) => <div>{children}</div> },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock("@/components/PageHeader", () => ({ default: () => null }));
vi.mock("@/components/TabBar", () => ({ default: () => null }));
vi.mock("@/components/swe/ArticlesTab", () => ({ default: () => null }));
vi.mock("@/components/swe/ActivityTab", () => ({ default: () => null }));
vi.mock("@/lib/hooks/use-articles", () => ({ useArticles: () => ({ articles: [], isLoading: false, totalPages: 1 }) }));
vi.mock("@/lib/hooks/use-url-page", () => ({ useUrlPage: () => ({ page: 1, setPage: vi.fn(), resetPage: vi.fn() }) }));
vi.mock("@/lib/hooks/use-tab-config", () => ({ useTabConfig: () => ({ order: [], labels: {}, visibility: {} }) }));
vi.mock("@/lib/hooks/use-persistent-tab", () => ({ usePersistentTab: (_default: string) => [_default, vi.fn()] }));
vi.mock("@/lib/hooks/use-site-content", () => ({ useSiteContent: () => ({ sweTitle: "", sweDescription: "" }) }));
vi.mock("@/lib/hooks/use-section-visibility", () => ({ useSectionVisibility: () => ({}) }));
vi.mock("@/lib/section-visibility", () => ({ getVisibleSectionNumber: () => null }));
vi.mock("@/lib/section-tabs", () => ({
  SECTION_TABS: {
    swe: [
      { id: "articles", label: "Articles" },
      { id: "projects", label: "Projects" },
      { id: "about-me", label: "About Me" },
      { id: "activity", label: "Activity" },
    ],
  },
}));

// Importing the page module triggers the top-level dynamic() calls.
import "@/app/swe/page";

describe("SwePage Suspense isolation", () => {
  it("every dynamic() import has a loading prop so suspensions cannot cascade to the outer Suspense boundary", () => {
    // page.tsx has 3 dynamic() calls: Projects, About, Experience.
    // Without a loading prop, a bundle-load suspension bubbles up to the bare
    // <Suspense> in SwePage (null fallback) and blanks the entire page including
    // PageHeader. The fix ensures each slot manages its own Suspense boundary.
    expect(dynamicOptions.length).toBe(3);
    dynamicOptions.forEach((opts, i) => {
      expect(
        opts.loading,
        `dynamic() call #${i + 1} is missing a loading prop — will cause Suspense cascade`,
      ).toBeDefined();
    });
  });
});
