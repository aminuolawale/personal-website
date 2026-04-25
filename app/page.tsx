"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Hero from "@/components/Hero";
import Contact from "@/components/Contact";
import PageShell from "@/components/PageShell";

const portals = [
  {
    href: "/swe",
    number: "01",
    label: "Software Engineering",
    desc: "Projects, experience, and the craft of building things for the internet.",
  },
  {
    href: "/astrophotography",
    number: "02",
    label: "Astrophotography",
    desc: "Deep-sky imaging sessions — acquisition, capture, and processing notes.",
  },
  {
    href: "/writing",
    number: "03",
    label: "Writing",
    desc: "Essays and reflections on technology, the cosmos, and life.",
  },
];

export default function Home() {
  return (
    <PageShell>
      <main>
        <Hero />

        {/* Portal cards */}
        <section id="work" className="py-16 sm:py-28 px-6 sm:px-16 max-w-6xl mx-auto">
          <motion.div
            className="flex items-center gap-6 mb-16"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-mono text-[#fc9e4f] text-2xl whitespace-nowrap">
              What I Do
            </h2>
            <div className="h-px bg-[#f2f3ae]/15 flex-1 max-w-xs" />
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {portals.map((portal, i) => (
              <motion.div
                key={portal.href}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link href={portal.href} className="group block h-full">
                  <div className="h-full bg-[#f2f3ae]/[0.025] border border-[#f2f3ae]/10 p-8 flex flex-col gap-5 hover:bg-[#f2f3ae]/[0.045] hover:border-[#fc9e4f]/30 hover:-translate-y-1 transition-all duration-300">
                    <span className="font-mono text-[#fc9e4f]/40 text-xs">
                      {portal.number}.
                    </span>
                    <h3 className="text-[#f2f3ae] text-xl font-semibold group-hover:text-[#fc9e4f] transition-colors duration-200">
                      {portal.label}
                    </h3>
                    <p className="text-[#edd382]/55 text-sm leading-relaxed flex-1">
                      {portal.desc}
                    </p>
                    <div className="flex items-center gap-2 font-mono text-xs text-[#fc9e4f]/50 group-hover:text-[#fc9e4f] transition-colors duration-200">
                      <span>Explore</span>
                      <ArrowRight
                        size={12}
                        className="group-hover:translate-x-1 transition-transform duration-200"
                      />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        <Contact />
      </main>
    </PageShell>
  );
}
