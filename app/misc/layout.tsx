import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE } from "@/lib/site";
import { getSession } from "@/lib/auth";
import { getSectionVisibility } from "@/lib/section-visibility";

export const metadata: Metadata = {
  title: "Miscellaneous",
  description: `Various documents and bits and pieces by ${SITE.name}.`,
  openGraph: {
    title: `Misc — ${SITE.name}`,
    description: `Various documents and bits and pieces by ${SITE.name}.`,
    url: `${SITE.url}/misc`,
  },
  alternates: { canonical: `${SITE.url}/misc` },
};

export default async function MiscLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, visibility] = await Promise.all([getSession(), getSectionVisibility()]);
  if (!isAdmin && !visibility.misc) notFound();
  return <>{children}</>;
}
