import type { Metadata } from "next";
import { SITE } from "@/lib/site";

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

export default function SweLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
