"use client";

import { useState } from "react";
import {m, AnimatePresence} from "framer-motion";
import { ChevronRight } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import { useExperience } from "@/lib/hooks/use-experience";

function formatMonthYear(value: string): string {
  if (value === "Present" || !value) return value;
  const [year, month] = value.split("-");
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export default function Experience() {
  const experiences = useExperience();
  const [active, setActive] = useState<string | null>(null);
  const current = experiences.find((e) => e.id === active) ?? experiences[0];
  const period = current
    ? `${formatMonthYear(current.startDate)} – ${formatMonthYear(current.endDate)}${current.location ? ` · ${current.location}` : ""}`
    : "";

  if (!current) return null;

  return (
    <section id="experience" className="py-16 sm:py-28 px-6 sm:px-16 max-w-6xl mx-auto">
      <SectionHeading number="02" title="Work Experience" />

      <m.div
        className="flex flex-col sm:flex-row gap-6 max-w-3xl"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        {/* Tab list */}
        <div className="flex sm:flex-col overflow-x-auto sm:overflow-visible border-b sm:border-b-0 sm:border-l-2 border-surface/15 shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {experiences.map((exp) => (
            <button
              key={exp.id}
              onClick={() => setActive(exp.id)}
              className={`shrink-0 font-mono text-sm px-5 py-3 text-left whitespace-nowrap transition-all duration-200 border-b-2 sm:border-b-0 sm:border-l-2 -mb-[2px] sm:mb-0 sm:-ml-[2px] ${
                current.id === exp.id
                  ? "text-accent bg-accent/5 border-accent"
                  : "text-surface/45 hover:text-surface/80 hover:bg-surface/[0.03] border-transparent"
              }`}
            >
              {exp.company}
            </button>
          ))}
        </div>

        {/* Content panel */}
        <div className="flex-1 min-h-[200px]">
          <AnimatePresence mode="wait">
            <m.div
              key={current.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-surface text-lg sm:text-xl font-semibold">
                  {current.role}{" "}
                  <span className="text-accent">@ {current.company}</span>
                </h3>
                <p className="font-mono text-xs text-muted/45 mt-1">
                  {period}
                </p>
              </div>
              <ul className="space-y-3 pt-1">
                {current.responsibilities.map((item, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-muted/80 text-sm leading-relaxed"
                  >
                    <ChevronRight
                      size={15}
                      className="text-accent shrink-0 mt-0.5"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </m.div>
          </AnimatePresence>
        </div>
      </m.div>
    </section>
  );
}
