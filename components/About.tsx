"use client";

import {m} from "framer-motion";
import { ChevronRight } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";

const skills = [
  "Python",
  "JavaScript / TypeScript",
  "Node.js",
  "React / React Native",
  "Go",
  "Docker",
  "PostgreSQL",
  "Redis",
  "Microservices",
];

export default function About() {
  return (
    <section id="about" className="py-16 sm:py-28 px-6 sm:px-16 max-w-6xl mx-auto">
      <SectionHeading number="01" title="About Me" />

      <div className="grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 items-start">
        {/* Text + skills */}
        <m.div
          className="space-y-6"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <p className="text-muted leading-relaxed text-base sm:text-[1.05rem]">
            Hi, I&apos;m Aminu Olawale — a Software Engineer based in{" "}
            <span className="text-accent">Zurich, Switzerland</span>. I enjoy
            building things that live on the internet, from high-throughput APIs
            to polished user interfaces.
          </p>
          <p className="text-muted/70 leading-relaxed text-base sm:text-[1.05rem]">
            Here&apos;s a snapshot of technologies I&apos;ve been working with:
          </p>

          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 pt-1">
            {skills.map((skill) => (
              <li
                key={skill}
                className="flex items-center gap-2 font-mono text-sm text-muted/75"
              >
                <ChevronRight
                  size={12}
                  className="text-accent shrink-0"
                />
                {skill}
              </li>
            ))}
          </ul>
        </m.div>

        {/* Photo placeholder */}
        <m.div
          className="relative mx-auto lg:mx-0 shrink-0"
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="relative w-[220px] h-[220px] sm:w-[270px] sm:h-[270px] lg:w-[300px] lg:h-[300px] group">
            {/* Main photo box */}
            <div className="relative w-full h-full bg-gradient-to-br from-accent/12 via-base to-muted/8 border border-accent/35 flex items-center justify-center overflow-hidden z-[1]">
              <span className="font-mono text-accent/20 text-7xl sm:text-8xl font-bold group-hover:text-accent/35 transition-colors duration-500 select-none">
                AO
              </span>
              <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/[0.04] transition-colors duration-500" />
            </div>
            {/* Offset decorative border */}
            <div className="absolute top-5 left-5 w-full h-full border border-accent/22 transition-all duration-300 group-hover:top-4 group-hover:left-4" />
          </div>
        </m.div>
      </div>
    </section>
  );
}
