import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Writing",
  description: `Essays and reflections on technology, the cosmos, and life by ${SITE.name}.`,
  openGraph: {
    title: `Writing — ${SITE.name}`,
    description: `Essays and reflections on technology, the cosmos, and life by ${SITE.name}.`,
    url: `${SITE.url}/writing`,
  },
  alternates: { canonical: `${SITE.url}/writing` },
};

export default function WritingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
