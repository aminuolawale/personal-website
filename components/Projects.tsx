"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { GitHubIcon } from "./icons";
import SectionHeading from "@/components/SectionHeading";

const featuredProjects = [
  {
    number: "01",
    label: "Featured Project",
    title: "Placely",
    description:
      "UI and mockups for an application/web service that eases the process of relocating to a new place or finding somewhere to stay during a trip that will last long enough for a hotel to prove too expensive.",
    stack: ["React.js", "Firebase", "Figma", "Places API"],
    github: "https://github.com/aminuolawale",
    live: null as string | null,
    accent: "from-[#fc9e4f]/10 to-[#edd382]/5",
  },
  {
    number: "02",
    label: "Featured Project",
    title: "Homebliss",
    description:
      "UI and mockups for a home dispute resolution service that connects homeowners, tenants, and mediators on a single platform.",
    stack: ["Gatsby", "Figma", "React.js", "Places API"],
    github: "https://github.com/aminuolawale",
    live: null as string | null,
    accent: "from-[#edd382]/10 to-[#fc9e4f]/5",
  },
];

const otherProjects = [
  {
    title: "Project Alpha",
    description: "A project description will go here soon. Come back to check.",
    stack: ["Python", "FastAPI", "PostgreSQL"],
  },
  {
    title: "Project Beta",
    description: "A project description will go here soon. Come back to check.",
    stack: ["React", "TypeScript", "Redux"],
  },
  {
    title: "Project Gamma",
    description: "A project description will go here soon. Come back to check.",
    stack: ["Go", "Docker", "Redis"],
  },
  {
    title: "Project Delta",
    description: "A project description will go here soon. Come back to check.",
    stack: ["Node.js", "MongoDB", "Express"],
  },
  {
    title: "Project Epsilon",
    description: "A project description will go here soon. Come back to check.",
    stack: ["React Native", "Firebase", "Expo"],
  },
  {
    title: "Project Zeta",
    description: "A project description will go here soon. Come back to check.",
    stack: ["Next.js", "Tailwind", "Vercel"],
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
    <section id="projects" className="py-28 px-6 sm:px-16 max-w-6xl mx-auto">
      {/* Section heading */}
      <SectionHeading number="03" title="Projects" />

      {/* Featured projects */}
      <div className="space-y-24 mb-28">
        {featuredProjects.map((project, i) => (
          <motion.div
            key={project.title}
            className="grid lg:grid-cols-2 gap-8 items-center"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Image (order flips for odd) */}
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
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="font-mono text-[#fc9e4f] text-xl mb-2">
            Other Noteworthy Projects
          </h3>
          <p className="font-mono text-xs text-[#edd382]/35">View the archive</p>
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
                  <GitHubIcon size={18} />
                  <ExternalLink size={18} />
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
