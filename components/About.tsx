"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

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
    <section id="about" className="py-28 px-6 sm:px-16 max-w-6xl mx-auto">
      {/* Section heading */}
      <motion.div
        className="flex items-center gap-6 mb-16"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="font-mono text-[#fc9e4f] text-2xl whitespace-nowrap">
          <span className="text-base mr-2 opacity-70">01.</span>About Me
        </h2>
        <div className="h-px bg-[#f2f3ae]/15 flex-1 max-w-xs" />
      </motion.div>

      <div className="grid lg:grid-cols-[1fr_auto] gap-16 items-start">
        {/* Text + skills */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <p className="text-[#edd382] leading-relaxed text-[1.05rem]">
            Hi, I&apos;m Aminu Olawale — a Software Engineer based in{" "}
            <span className="text-[#fc9e4f]">Lagos, Nigeria</span>. I enjoy
            building things that live on the internet, from high-throughput APIs
            to polished user interfaces.
          </p>
          <p className="text-[#edd382]/70 leading-relaxed text-[1.05rem]">
            Here&apos;s a snapshot of technologies I&apos;ve been working with:
          </p>

          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 pt-1">
            {skills.map((skill) => (
              <li
                key={skill}
                className="flex items-center gap-2 font-mono text-sm text-[#edd382]/75"
              >
                <ChevronRight
                  size={12}
                  className="text-[#fc9e4f] shrink-0"
                />
                {skill}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Photo placeholder */}
        <motion.div
          className="relative mx-auto lg:mx-0 shrink-0"
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="relative w-[270px] h-[270px] sm:w-[300px] sm:h-[300px] group">
            {/* Main photo box */}
            <div className="relative w-full h-full bg-gradient-to-br from-[#fc9e4f]/12 via-[#020122] to-[#edd382]/8 border border-[#fc9e4f]/35 flex items-center justify-center overflow-hidden z-[1]">
              <span className="font-mono text-[#fc9e4f]/20 text-8xl font-bold group-hover:text-[#fc9e4f]/35 transition-colors duration-500 select-none">
                AO
              </span>
              {/* Subtle inner glow on hover */}
              <div className="absolute inset-0 bg-[#fc9e4f]/0 group-hover:bg-[#fc9e4f]/[0.04] transition-colors duration-500" />
            </div>
            {/* Offset decorative border */}
            <div className="absolute top-5 left-5 w-full h-full border border-[#fc9e4f]/22 transition-all duration-300 group-hover:top-4 group-hover:left-4" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
