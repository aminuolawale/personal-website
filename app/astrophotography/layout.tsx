import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE } from "@/lib/site";
import { getSession } from "@/lib/auth";
import { getSectionVisibility } from "@/lib/section-visibility";

export const metadata: Metadata = {
  title: "Astrophotography",
  description: `Deep-sky imaging sessions, acquisition notes, and processing logs by ${SITE.name}.`,
  openGraph: {
    title: `Astrophotography — ${SITE.name}`,
    description: `Deep-sky imaging sessions, acquisition notes, and processing logs by ${SITE.name}.`,
    url: `${SITE.url}/astrophotography`,
  },
  alternates: { canonical: `${SITE.url}/astrophotography` },
};

export default async function AstroLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, visibility] = await Promise.all([getSession(), getSectionVisibility()]);
  if (!isAdmin && !visibility.astrophotography) notFound();
  return <>{children}</>;
}
