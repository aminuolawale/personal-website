import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE } from "@/lib/site";
import { getSession } from "@/lib/auth";
import { getSectionVisibility } from "@/lib/section-visibility";

export const metadata: Metadata = {
  title: "Software Engineering",
  description: `Articles and projects on software engineering by ${SITE.name}.`,
  openGraph: {
    title: `Software Engineering — ${SITE.name}`,
    description: `Articles and projects on software engineering by ${SITE.name}.`,
    url: `${SITE.url}/swe`,
  },
  alternates: { canonical: `${SITE.url}/swe` },
};

export default async function SweLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, visibility] = await Promise.all([getSession(), getSectionVisibility()]);
  if (!isAdmin && !visibility.swe) notFound();
  return <>{children}</>;
}
