"use client";

import {m} from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Hero from "@/components/Hero";
import Contact from "@/components/Contact";

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
    <main>
        <Hero />

        {/* Portal cards */}
        <section id="work" className="py-16 sm:py-28 px-6 sm:px-16 max-w-6xl mx-auto">
          <m.div
            className="flex items-center gap-6 mb-16"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-mono text-accent text-2xl whitespace-nowrap">
              What I Do
            </h2>
            <div className="h-px bg-surface/15 flex-1 max-w-xs" />
          </m.div>

          <div className="grid md:grid-cols-3 gap-5">
            {portals.map((portal, i) => (
              <m.div
                key={portal.href}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link href={portal.href} className="group block h-full">
                  <div className="h-full bg-surface/[0.025] border border-surface/10 p-8 flex flex-col gap-5 hover:bg-surface/[0.045] hover:border-accent/30 hover:-translate-y-1 transition-all duration-300">
                    <span className="font-mono text-accent/40 text-xs">
                      {portal.number}.
                    </span>
                    <h3 className="text-surface text-xl font-semibold group-hover:text-accent transition-colors duration-200">
                      {portal.label}
                    </h3>
                    <p className="text-muted/55 text-sm leading-relaxed flex-1">
                      {portal.desc}
                    </p>
                    <div className="flex items-center gap-2 font-mono text-xs text-accent/50 group-hover:text-accent transition-colors duration-200">
                      <span>Explore</span>
                      <ArrowRight
                        size={12}
                        className="group-hover:translate-x-1 transition-transform duration-200"
                      />
                    </div>
                  </div>
                </Link>
              </m.div>
            ))}
          </div>
        </section>

        <Contact />
      </main>
  );
}
