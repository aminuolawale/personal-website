import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE } from "@/lib/site";
import { getSession } from "@/lib/auth";
import { getSectionVisibility } from "@/lib/section-visibility";

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

export default async function WritingLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, visibility] = await Promise.all([getSession(), getSectionVisibility()]);
  if (!isAdmin && !visibility.writing) notFound();
  return <>{children}</>;
}
