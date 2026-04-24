"use client";

import PageShell from "@/components/PageShell";
import PageHeader from "@/components/PageHeader";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";

export default function SWEPage() {
  return (
    <PageShell>
      <main>
        <PageHeader
          eyebrow="01. Engineering"
          title="Software Engineering"
          description="Building software since 2022 — web applications, APIs, microservices, and the tools that tie them together."
        />
        <About />
        <Experience />
        <Projects />
        <Contact />
      </main>
    </PageShell>
  );
}
