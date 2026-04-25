import type { Metadata } from "next";
import { SITE } from "@/lib/site";

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

export default function AstroLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
