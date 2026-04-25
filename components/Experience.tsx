"use client";

import { useState } from "react";
import {m, AnimatePresence} from "framer-motion";
import { ChevronRight } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";

const experiences = [
  {
    id: "google",
    company: "Google",
    role: "Software Engineer",
    period: "Jun 2022 – Present · Zurich, Switzerland",
    bullets: [
      "Build and maintain large-scale distributed systems serving millions of users globally",
      "Collaborate with cross-functional teams across engineering, product, and design",
      "Drive technical design and code reviews within the team",
      "Contribute to infrastructure improvements that improve reliability and reduce latency",
    ],
  },
  {
    id: "kudi",
    company: "Kudi",
    role: "Data Engineer",
    period: "Aug 2021 – Mar 2022 · Lagos, Nigeria",
    bullets: [
      "Designed and maintained data pipelines for financial transaction processing",
      "Built and optimised ETL workflows to support analytics and business reporting",
      "Worked closely with data science and product teams to surface actionable insights",
    ],
  },
  {
    id: "centricity",
    company: "Centricity",
    role: "Software Engineer",
    period: "Mar 2021 – Jun 2021 · Lagos, Nigeria",
    bullets: [
      "Developed backend services and APIs for the core product",
      "Participated in agile sprints, code reviews, and technical planning sessions",
    ],
  },
  {
    id: "sendbox",
    company: "Sendbox",
    role: "Software Engineer",
    period: "Dec 2019 – Apr 2021 · Nigeria",
    bullets: [
      "Developed and maintained the firm's core infrastructure and services",
      "Carried out data analytics and reporting on the firm's financial performance",
      "Implemented a real-time monitoring system for the firm's logistics services",
      "Developed in-house tools to speed up product development life-cycles",
    ],
  },
];

export default function Experience() {
  const [active, setActive] = useState("google");
  const current = experiences.find((e) => e.id === active)!;

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
        <div className="flex sm:flex-col overflow-x-auto sm:overflow-visible border-b sm:border-b-0 sm:border-l-2 border-[#f2f3ae]/15 shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {experiences.map((exp) => (
            <button
              key={exp.id}
              onClick={() => setActive(exp.id)}
              className={`shrink-0 font-mono text-sm px-5 py-3 text-left whitespace-nowrap transition-all duration-200 border-b-2 sm:border-b-0 sm:border-l-2 -mb-[2px] sm:mb-0 sm:-ml-[2px] ${
                active === exp.id
                  ? "text-[#fc9e4f] bg-[#fc9e4f]/5 border-[#fc9e4f]"
                  : "text-[#f2f3ae]/45 hover:text-[#f2f3ae]/80 hover:bg-[#f2f3ae]/[0.03] border-transparent"
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
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-[#f2f3ae] text-lg sm:text-xl font-semibold">
                  {current.role}{" "}
                  <span className="text-[#fc9e4f]">@ {current.company}</span>
                </h3>
                <p className="font-mono text-xs text-[#edd382]/45 mt-1">
                  {current.period}
                </p>
              </div>
              <ul className="space-y-3 pt-1">
                {current.bullets.map((bullet, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-[#edd382]/80 text-sm leading-relaxed"
                  >
                    <ChevronRight
                      size={15}
                      className="text-[#fc9e4f] shrink-0 mt-0.5"
                    />
                    {bullet}
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
