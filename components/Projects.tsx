"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { GitHubIcon } from "./icons";
import SectionHeading from "@/components/SectionHeading";

const featuredProjects = [
  {
    number: "01",
    label: "Featured Project",
    title: "astro-agent",
    description:
      "An automated astrophotography session planning and scheduling agent. Integrates NASA JPL ephemeris data and Google Calendar to compute optimal imaging windows for deep-sky targets from Zurich, and schedules them as macOS LaunchAgent jobs.",
    stack: ["Python", "Docker", "Google Calendar API", "NASA JPL"],
    github: "https://github.com/aminuolawale/astro-agent",
    live: null as string | null,
    accent: "from-[#fc9e4f]/10 to-[#edd382]/5",
  },
  {
    number: "02",
    label: "Featured Project",
    title: "Muffassa",
    description:
      "An Android app for spaced-repetition recall — \"remember anything\". Built in Kotlin with a Python backend service (muffassa-be), it surfaces items at the scientifically optimal moment so nothing important slips from memory.",
    stack: ["Kotlin", "Android", "Python"],
    github: "https://github.com/aminuolawale/Muffassa",
    live: null as string | null,
    accent: "from-[#edd382]/10 to-[#fc9e4f]/5",
  },
];

const otherProjects = [
  {
    title: "laroye",
    description:
      "AI-powered project behind laroye.ai. Python-based with a focus on natural language interfaces.",
    stack: ["Python", "AI/ML"],
    github: "https://github.com/aminuolawale/laroye",
    live: "https://laroye.ai",
  },
  {
    title: "birthdays",
    description:
      "Full-stack social app for tracking and celebrating birthdays. GraphQL API powered by Django with an Apollo + React frontend.",
    stack: ["React", "Django", "GraphQL", "Apollo"],
    github: "https://github.com/aminuolawale/birthdays",
    live: null as string | null,
  },
  {
    title: "bank",
    description:
      "A Go microservice implementing core banking operations — accounts, transfers, and balance management — with a clean REST API.",
    stack: ["Go", "Microservices", "REST"],
    github: "https://github.com/aminuolawale/bank",
    live: null as string | null,
  },
  {
    title: "algorithms-visualizer",
    description:
      "Interactive Python tool for visualising classic algorithms and data structures step-by-step.",
    stack: ["Python"],
    github: "https://github.com/aminuolawale/algorithms-visualizer",
    live: null as string | null,
  },
  {
    title: "sentyment",
    description:
      "Sentiment analysis and NLP pipeline in Python — processes text corpora and surfaces sentiment signals.",
    stack: ["Python", "NLP"],
    github: "https://github.com/aminuolawale/sentyment",
    live: null as string | null,
  },
  {
    title: "Polynomial",
    description:
      "A Python module for algebraic polynomial manipulation — arithmetic, composition, differentiation, and root-finding.",
    stack: ["Python"],
    github: "https://github.com/aminuolawale/Polynomial",
    live: null as string | null,
  },
];

function FolderIcon() {
  return (
    <svg
      width="40"
      height="34"
      viewBox="0 0 40 34"
      fill="none"
      aria-hidden
      className="text-[#fc9e4f]"
    >
      <path
        d="M4 6C4 4.895 4.895 4 6 4H15L19 9H34C35.105 9 36 9.895 36 11V28C36 29.105 35.105 30 34 30H6C4.895 30 4 29.105 4 28V6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

export default function Projects() {
  return (
    <section id="projects" className="py-16 sm:py-28 px-6 sm:px-16 max-w-6xl mx-auto">
      <SectionHeading number="03" title="Projects" />

      {/* Featured projects */}
      <div className="space-y-16 sm:space-y-24 mb-16 sm:mb-28">
        {featuredProjects.map((project, i) => (
          <motion.div
            key={project.title}
            className="grid lg:grid-cols-2 gap-8 items-center"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Decorative image */}
            <div
              className={`relative h-[240px] sm:h-[280px] bg-gradient-to-br ${project.accent} border border-[#f2f3ae]/10 overflow-hidden group ${
                i % 2 === 1 ? "lg:order-2" : ""
              }`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-[#fc9e4f]/12 text-[100px] font-bold leading-none select-none group-hover:text-[#fc9e4f]/20 transition-colors duration-500">
                  {project.number}
                </span>
              </div>
              <div className="absolute inset-0 bg-[#020122]/30 group-hover:bg-[#020122]/10 transition-colors duration-500" />
            </div>

            {/* Content */}
            <div className={`space-y-4 ${i % 2 === 1 ? "lg:text-right lg:order-1" : ""}`}>
              <p className="font-mono text-[#fc9e4f] text-xs">{project.label}</p>
              <h3 className="text-[#f2f3ae] text-2xl font-semibold">
                {project.title}
              </h3>
              <div className="bg-[#f2f3ae]/[0.03] border border-[#f2f3ae]/10 p-5 backdrop-blur-sm">
                <p className="text-[#edd382]/75 text-sm leading-relaxed">
                  {project.description}
                </p>
              </div>
              <ul
                className={`flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-[#fc9e4f]/80 ${
                  i % 2 === 1 ? "lg:justify-end" : ""
                }`}
              >
                {project.stack.map((tech) => (
                  <li key={tech}>{tech}</li>
                ))}
              </ul>
              <div
                className={`flex gap-4 pt-1 ${i % 2 === 1 ? "lg:justify-end" : ""}`}
              >
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="text-[#f2f3ae]/50 hover:text-[#fc9e4f] transition-colors"
                >
                  <GitHubIcon size={20} />
                </a>
                {project.live && (
                  <a
                    href={project.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Live site"
                    className="text-[#f2f3ae]/50 hover:text-[#fc9e4f] transition-colors"
                  >
                    <ExternalLink size={20} />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Other noteworthy projects */}
      <div>
        <motion.div
          className="text-center mb-8 sm:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="font-mono text-[#fc9e4f] text-xl mb-2">
            Other Noteworthy Projects
          </h3>
          <a
            href="https://github.com/aminuolawale?tab=repositories"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-[#edd382]/35 hover:text-[#fc9e4f] transition-colors"
          >
            View the full archive
          </a>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {otherProjects.map((project, i) => (
            <motion.div
              key={project.title}
              className="group bg-[#f2f3ae]/[0.025] border border-[#f2f3ae]/10 p-6 flex flex-col hover:bg-[#f2f3ae]/[0.05] hover:border-[#fc9e4f]/25 hover:-translate-y-1 transition-all duration-300 cursor-default"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
            >
              <div className="flex items-start justify-between mb-6">
                <FolderIcon />
                <div className="flex gap-3 text-[#f2f3ae]/30 group-hover:text-[#f2f3ae]/60 transition-colors">
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GitHubIcon size={18} />
                  </a>
                  {project.live && (
                    <a
                      href={project.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Live site"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={18} />
                    </a>
                  )}
                </div>
              </div>
              <h4 className="text-[#f2f3ae] font-semibold text-base mb-3 group-hover:text-[#fc9e4f] transition-colors">
                {project.title}
              </h4>
              <p className="text-[#edd382]/50 text-sm leading-relaxed flex-1 mb-5">
                {project.description}
              </p>
              <ul className="flex flex-wrap gap-3 font-mono text-xs text-[#fc9e4f]/60">
                {project.stack.map((tech) => (
                  <li key={tech}>{tech}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
