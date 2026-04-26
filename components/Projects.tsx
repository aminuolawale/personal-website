"use client";

import { useEffect, useState } from "react";
import {m} from "framer-motion";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { GitHubIcon } from "./icons";
import SectionHeading from "@/components/SectionHeading";
import { splitTags } from "@/lib/utils";
import type { Project } from "@/lib/schema";

// ── Hardcoded fallback shown while DB has no projects ─────────────────────────

const HARDCODED_FEATURED = [
  {
    number: "01",
    title: "astro-agent",
    description:
      "An automated astrophotography session planning and scheduling agent. Integrates NASA JPL ephemeris data and Google Calendar to compute optimal imaging windows for deep-sky targets from Zurich, and schedules them as macOS LaunchAgent jobs.",
    stack: ["Python", "Docker", "Google Calendar API", "NASA JPL"],
    github: "https://github.com/aminuolawale/astro-agent",
    live: null as string | null,
    accent: "from-accent/10 to-muted/5",
  },
  {
    number: "02",
    title: "Muffassa",
    description:
      "An Android app for spaced-repetition recall — \"remember anything\". Built in Kotlin with a Python backend service (muffassa-be), it surfaces items at the scientifically optimal moment so nothing important slips from memory.",
    stack: ["Kotlin", "Android", "Python"],
    github: "https://github.com/aminuolawale/Muffassa",
    live: null as string | null,
    accent: "from-muted/10 to-accent/5",
  },
];

const HARDCODED_GRID = [
  { title: "laroye", description: "AI-powered project behind laroye.ai. Python-based with a focus on natural language interfaces.", stack: ["Python", "AI/ML"], github: "https://github.com/aminuolawale/laroye", live: "https://laroye.ai" },
  { title: "birthdays", description: "Full-stack social app for tracking and celebrating birthdays. GraphQL API powered by Django with an Apollo + React frontend.", stack: ["React", "Django", "GraphQL", "Apollo"], github: "https://github.com/aminuolawale/birthdays", live: null as string | null },
  { title: "bank", description: "A Go microservice implementing core banking operations — accounts, transfers, and balance management — with a clean REST API.", stack: ["Go", "Microservices", "REST"], github: "https://github.com/aminuolawale/bank", live: null },
  { title: "algorithms-visualizer", description: "Interactive Python tool for visualising classic algorithms and data structures step-by-step.", stack: ["Python"], github: "https://github.com/aminuolawale/algorithms-visualizer", live: null },
  { title: "sentyment", description: "Sentiment analysis and NLP pipeline in Python — processes text corpora and surfaces sentiment signals.", stack: ["Python", "NLP"], github: "https://github.com/aminuolawale/sentyment", live: null },
  { title: "Polynomial", description: "A Python module for algebraic polynomial manipulation — arithmetic, composition, differentiation, and root-finding.", stack: ["Python"], github: "https://github.com/aminuolawale/Polynomial", live: null },
];

// ── Constants ─────────────────────────────────────────────────────────────────

const FEATURED_COUNT = 2;
const GRID_LIMIT = 6;
const TOTAL_LIMIT = FEATURED_COUNT + GRID_LIMIT;

const ACCENTS = [
  "from-accent/10 to-muted/5",
  "from-muted/10 to-accent/5",
];

// ── Sub-components ────────────────────────────────────────────────────────────

function FolderIcon() {
  return (
    <svg width="40" height="34" viewBox="0 0 40 34" fill="none" aria-hidden className="text-accent">
      <path d="M4 6C4 4.895 4.895 4 6 4H15L19 9H34C35.105 9 36 9.895 36 11V28C36 29.105 35.105 30 34 30H6C4.895 30 4 29.105 4 28V6Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function FeaturedCard({ project, index }: { project: Project; index: number }) {
  const accent = ACCENTS[index % ACCENTS.length];
  const stack = splitTags(project.tags);
  const label = String(project.position).padStart(2, "0");

  return (
    <m.div
      className="grid lg:grid-cols-2 gap-8 items-center"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      {/* Image or gradient placeholder */}
      <div
        className={`relative h-[240px] sm:h-[280px] overflow-hidden group border border-surface/10 ${
          index % 2 === 1 ? "lg:order-2" : ""
        } ${!project.imageUrl ? `bg-gradient-to-br ${accent}` : ""}`}
      >
        {project.imageUrl ? (
          <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-accent/12 text-[100px] font-bold leading-none select-none group-hover:text-accent/20 transition-colors duration-500">
              {label}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-base/30 group-hover:bg-base/10 transition-colors duration-500" />
      </div>

      {/* Content */}
      <div className={`space-y-4 ${index % 2 === 1 ? "lg:text-right lg:order-1" : ""}`}>
        <p className="font-mono text-accent text-xs">Featured Project</p>
        <h3 className="text-surface text-2xl font-semibold">{project.title}</h3>
        <div className="bg-surface/[0.03] border border-surface/10 p-5 backdrop-blur-sm">
          <p className="text-muted/75 text-sm leading-relaxed">{project.description}</p>
        </div>
        <ul className={`flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-accent/80 ${index % 2 === 1 ? "lg:justify-end" : ""}`}>
          {stack.map((t) => <li key={t}>{t}</li>)}
        </ul>
        <div className={`flex gap-4 pt-1 ${index % 2 === 1 ? "lg:justify-end" : ""}`}>
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-surface/50 hover:text-accent transition-colors">
              <GitHubIcon size={20} />
            </a>
          )}
          {project.websiteUrl && (
            <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer" aria-label="Live site" className="text-surface/50 hover:text-accent transition-colors">
              <ExternalLink size={20} />
            </a>
          )}
        </div>
      </div>
    </m.div>
  );
}

function GridCard({ project, index }: { project: Project; index: number }) {
  const stack = splitTags(project.tags);
  return (
    <m.div
      className="group bg-surface/[0.025] border border-surface/10 p-6 flex flex-col hover:bg-surface/[0.05] hover:border-accent/25 hover:-translate-y-1 transition-all duration-300 cursor-default"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
    >
      <div className="flex items-start justify-between mb-6">
        <FolderIcon />
        <div className="flex gap-3 text-surface/30 group-hover:text-surface/60 transition-colors">
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub" onClick={(e) => e.stopPropagation()}>
              <GitHubIcon size={18} />
            </a>
          )}
          {project.websiteUrl && (
            <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer" aria-label="Live site" onClick={(e) => e.stopPropagation()}>
              <ExternalLink size={18} />
            </a>
          )}
        </div>
      </div>
      <h4 className="text-surface font-semibold text-base mb-3 group-hover:text-accent transition-colors">{project.title}</h4>
      <p className="text-muted/50 text-sm leading-relaxed flex-1 mb-5">{project.description}</p>
      <ul className="flex flex-wrap gap-3 font-mono text-xs text-accent/60">
        {stack.map((t) => <li key={t}>{t}</li>)}
      </ul>
    </m.div>
  );
}

// ── Hardcoded fallback renderers ──────────────────────────────────────────────

function HardcodedFeatured() {
  return (
    <div className="space-y-16 sm:space-y-24 mb-16 sm:mb-28">
      {HARDCODED_FEATURED.map((p, i) => (
        <m.div
          key={p.title}
          className="grid lg:grid-cols-2 gap-8 items-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <div className={`relative h-[240px] sm:h-[280px] bg-gradient-to-br ${p.accent} border border-surface/10 overflow-hidden group ${i % 2 === 1 ? "lg:order-2" : ""}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-accent/12 text-[100px] font-bold leading-none select-none group-hover:text-accent/20 transition-colors duration-500">{p.number}</span>
            </div>
            <div className="absolute inset-0 bg-base/30 group-hover:bg-base/10 transition-colors duration-500" />
          </div>
          <div className={`space-y-4 ${i % 2 === 1 ? "lg:text-right lg:order-1" : ""}`}>
            <p className="font-mono text-accent text-xs">Featured Project</p>
            <h3 className="text-surface text-2xl font-semibold">{p.title}</h3>
            <div className="bg-surface/[0.03] border border-surface/10 p-5 backdrop-blur-sm">
              <p className="text-muted/75 text-sm leading-relaxed">{p.description}</p>
            </div>
            <ul className={`flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-accent/80 ${i % 2 === 1 ? "lg:justify-end" : ""}`}>
              {p.stack.map((t) => <li key={t}>{t}</li>)}
            </ul>
            <div className={`flex gap-4 pt-1 ${i % 2 === 1 ? "lg:justify-end" : ""}`}>
              <a href={p.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-surface/50 hover:text-accent transition-colors">
                <GitHubIcon size={20} />
              </a>
              {p.live && (
                <a href={p.live} target="_blank" rel="noopener noreferrer" aria-label="Live site" className="text-surface/50 hover:text-accent transition-colors">
                  <ExternalLink size={20} />
                </a>
              )}
            </div>
          </div>
        </m.div>
      ))}
    </div>
  );
}

function HardcodedGrid() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {HARDCODED_GRID.map((p, i) => (
        <m.div
          key={p.title}
          className="group bg-surface/[0.025] border border-surface/10 p-6 flex flex-col hover:bg-surface/[0.05] hover:border-accent/25 hover:-translate-y-1 transition-all duration-300 cursor-default"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.06, duration: 0.4 }}
        >
          <div className="flex items-start justify-between mb-6">
            <FolderIcon />
            <div className="flex gap-3 text-surface/30 group-hover:text-surface/60 transition-colors">
              <a href={p.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" onClick={(e) => e.stopPropagation()}><GitHubIcon size={18} /></a>
              {p.live && <a href={p.live} target="_blank" rel="noopener noreferrer" aria-label="Live site" onClick={(e) => e.stopPropagation()}><ExternalLink size={18} /></a>}
            </div>
          </div>
          <h4 className="text-surface font-semibold text-base mb-3 group-hover:text-accent transition-colors">{p.title}</h4>
          <p className="text-muted/50 text-sm leading-relaxed flex-1 mb-5">{p.description}</p>
          <ul className="flex flex-wrap gap-3 font-mono text-xs text-accent/60">
            {p.stack.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </m.div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Projects() {
  const [dbProjects, setDbProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Project[]) => setDbProjects(Array.isArray(data) ? data : []))
      .catch(() => setDbProjects([]));
  }, []);

  const useHardcoded = dbProjects === null || dbProjects.length === 0;

  const sortedProjects = dbProjects ? [...dbProjects].sort((a, b) => a.position - b.position) : [];
  const featuredProjects = sortedProjects.slice(0, FEATURED_COUNT);
  const gridProjects = sortedProjects.slice(FEATURED_COUNT, TOTAL_LIMIT);
  const showViewAll = sortedProjects.length > TOTAL_LIMIT;

  return (
    <section id="projects" className="py-16 sm:py-28 px-6 sm:px-16 max-w-6xl mx-auto">
      <SectionHeading number="03" title="Projects" />

      {useHardcoded ? (
        <>
          <HardcodedFeatured />
          <div>
            <m.div
              className="text-center mb-8 sm:mb-12"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="font-mono text-accent text-xl mb-2">Other Noteworthy Projects</h3>
              <a href="https://github.com/aminuolawale?tab=repositories" target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-muted/35 hover:text-accent transition-colors">
                View the full archive
              </a>
            </m.div>
            <HardcodedGrid />
          </div>
        </>
      ) : (
        <>
          {/* Featured projects */}
          {featuredProjects.length > 0 && (
            <div className="space-y-16 sm:space-y-24 mb-16 sm:mb-28">
              {featuredProjects.map((p, i) => (
                <FeaturedCard key={p.id} project={p} index={i} />
              ))}
            </div>
          )}

          {/* Grid projects */}
          {gridProjects.length > 0 && (
            <div>
              <m.div
                className="text-center mb-8 sm:mb-12"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="font-mono text-accent text-xl mb-2">Other Noteworthy Projects</h3>
              </m.div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {gridProjects.map((p, i) => (
                  <GridCard key={p.id} project={p} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* View All */}
          {showViewAll && (
            <m.div
              className="text-center mt-12"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <Link
                href="/swe/projects"
                className="inline-flex items-center gap-2 font-mono text-sm text-accent border border-accent/40 px-6 py-3 hover:bg-accent/10 transition-all"
              >
                View All Projects
                <ExternalLink size={14} />
              </Link>
            </m.div>
          )}
        </>
      )}
    </section>
  );
}
