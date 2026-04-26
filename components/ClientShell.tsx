"use client";

import { usePathname } from "next/navigation";
import { LazyMotion, domAnimation } from "framer-motion";
import { SessionProvider } from "next-auth/react";
import PageShell from "./PageShell";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return <SessionProvider>{children}</SessionProvider>;
  }
  return (
    <SessionProvider>
      <LazyMotion features={domAnimation} strict>
        <PageShell>{children}</PageShell>
      </LazyMotion>
    </SessionProvider>
  );
}
