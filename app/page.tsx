"use client";

import { useEffect, useState } from "react";
import {m} from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Hero from "@/components/Hero";
import type { SiteUpdate } from "@/lib/schema";
import { timeAgo } from "@/lib/utils";
import { useSectionVisibility } from "@/lib/hooks/use-section-visibility";
import type { SectionId } from "@/lib/section-visibility";

const ALL_PORTALS = [
  {
    href: "/swe",
    section: "swe" as SectionId,
    number: "01",
    label: "Software Engineering",
    desc: "Projects, experience, and the craft of building things for the internet.",
  },
  {
    href: "/astrophotography",
    section: "astrophotography" as SectionId,
    number: "02",
    label: "Astrophotography",
    desc: "Deep-sky imaging sessions — acquisition, capture, and processing notes.",
  },
  {
    href: "/writing",
    section: "writing" as SectionId,
    number: "03",
    label: "Writing",
    desc: "Essays and reflections on technology, the cosmos, and life.",
  },
];

export default function Home() {
  const [updates, setUpdates] = useState<SiteUpdate[]>([]);
  const visibility = useSectionVisibility();
  const portals = ALL_PORTALS.filter((p) => visibility[p.section]);

  useEffect(() => {
    fetch("/api/updates")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setUpdates(Array.isArray(data) ? data.slice(0, 4) : []))
      .catch(() => {});
  }, []);

  return (
    <main>
        <Hero />

        {/* Updates feed */}
        {updates.length > 0 && (
          <section className="py-16 sm:py-24 px-6 sm:px-16 max-w-6xl mx-auto">
            <m.div
              className="flex items-center gap-6 mb-10"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="font-mono text-accent text-2xl whitespace-nowrap">Updates</h2>
              <div className="h-px bg-surface/15 flex-1 max-w-xs" />
            </m.div>

            <div className="divide-y divide-surface/[0.07]">
              {updates.map((u, i) => (
                <m.div
                  key={u.id}
                  className="py-4 flex items-start justify-between gap-6"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {u.thumbnailUrl && (
                      <div className="w-8 h-8 shrink-0 overflow-hidden border border-surface/10">
                        <Image src={u.thumbnailUrl} alt="" width={32} height={32} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex items-baseline gap-3 min-w-0 flex-1">
                      <span className="font-mono text-[10px] text-muted/30 shrink-0 tabular-nums">
                        {timeAgo(u.createdAt)}
                      </span>
                      <p className="text-muted/70 text-sm leading-relaxed">{u.text}</p>
                    </div>
                  </div>
                  {u.linkUrl && (
                    <Link
                      href={u.linkUrl}
                      className="flex items-center gap-1 font-mono text-xs text-accent/60 hover:text-accent transition-colors shrink-0"
                    >
                      View
                      <ArrowRight size={11} />
                    </Link>
                  )}
                </m.div>
              ))}
            </div>

            <m.div
              className="mt-8 flex justify-end"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Link
                href="/updates"
                className="flex items-center gap-1.5 font-mono text-xs text-accent/50 hover:text-accent transition-colors"
              >
                View all updates
                <ArrowRight size={12} />
              </Link>
            </m.div>
          </section>
        )}

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

      </main>
  );
}
