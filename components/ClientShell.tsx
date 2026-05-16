"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { LazyMotion, domAnimation } from "framer-motion";
import PageShell from "./PageShell";
import WebVitalsReporter from "./WebVitalsReporter";
import { trackEvent } from "@/lib/observability/client";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    trackEvent({ name: "public.page_view", route: pathname });
  }, [pathname]);

  if (pathname.startsWith("/admin")) {
    return (
      <>
        <WebVitalsReporter />
        {children}
      </>
    );
  }
  return (
    <>
      <LazyMotion features={domAnimation} strict>
        <WebVitalsReporter />
        <PageShell>{children}</PageShell>
      </LazyMotion>
    </>
  );
}
