"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";

const experiences = [
  {
    id: "sendbox",
    company: "Sendbox",
    role: "Software Engineer",
    period: "Dec 2019 – Present",
    bullets: [
      "Developed and maintained the firm's core infrastructure and services",
      "Carried out data analytics and reporting on the firm's financial performance",
      "Implemented a real-time monitoring system for the firm's logistics services",
      "Developed in-house tools to speed up product development life-cycles",
    ],
  },
  {
    id: "mindmantle",
    company: "MindMantle",
    role: "3D Animator",
    period: "Jan 2018 – Oct 2019",
    bullets: [
      "Created digital assets for short animated features, games and adverts",
      "Developed plugins in Maya Embedded Language and Python for production pipeline enhancement",
    ],
  },
  {
    id: "dammac",
    company: "Dammac Global",
    role: "Tech Operations Intern",
    period: "May 2016 – Dec 2016",
    bullets: [
      "Installation and maintenance of telephony equipment at transmission stations",
      "Inventory management and asset tracking",
    ],
  },
];

export default function Experience() {
  const [active, setActive] = useState("sendbox");
  const current = experiences.find((e) => e.id === active)!;

  return (
    <section id="experience" className="py-28 px-6 sm:px-16 max-w-6xl mx-auto">
      {/* Section heading */}
      <SectionHeading number="02" title="Work Experience" />

      <motion.div
        className="flex flex-col sm:flex-row gap-6 max-w-3xl"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        {/* Tab list */}
        <div className="flex sm:flex-col overflow-x-auto sm:overflow-visible border-b sm:border-b-0 sm:border-l-2 border-[#f2f3ae]/15 shrink-0">
          {experiences.map((exp) => (
            <button
              key={exp.id}
              onClick={() => setActive(exp.id)}
              className={`font-mono text-sm px-5 py-3 text-left whitespace-nowrap transition-all duration-200 border-b-2 sm:border-b-0 sm:border-l-2 -mb-[2px] sm:mb-0 sm:-ml-[2px] ${
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
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-[#f2f3ae] text-xl font-semibold">
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
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
}
