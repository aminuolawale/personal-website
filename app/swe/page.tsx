"use client";

import { motion } from "framer-motion";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";
import PageShell from "@/components/PageShell";

export default function SWEPage() {
  return (
    <PageShell>
      <main>
        <section className="pt-40 pb-4 px-6 sm:px-16 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="font-mono text-[#fc9e4f] text-sm mb-4">01. Engineering</p>
            <h1 className="text-[clamp(36px,6vw,64px)] font-bold text-[#f2f3ae] leading-tight mb-6">
              Software Engineering
            </h1>
            <p className="text-[#edd382]/65 text-lg max-w-xl leading-relaxed">
              Building software since 2022 — web applications, APIs, microservices,
              and the tools that tie them together.
            </p>
          </motion.div>
        </section>

        <About />
        <Experience />
        <Projects />
        <Contact />
      </main>
    </PageShell>
  );
}
