"use client";

import { usePathname } from "next/navigation";
import PageShell from "./PageShell";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return <>{children}</>;
  return <PageShell>{children}</PageShell>;
}
