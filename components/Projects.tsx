"use client";

import { useEffect, useState } from "react";
import {m} from "framer-motion";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { GitHubIcon } from "./icons";
import SectionHeading from "@/components/SectionHeading";
import { splitTags } from "@/lib/utils";
import type { Project } from "@/lib/schema";

const FEATURED_COUNT = 2;
const GRID_LIMIT = 6;
const TOTAL_LIMIT = FEATURED_COUNT + GRID_LIMIT;

const ACCENTS = [
  "from-accent/10 to-muted/5",
  "from-muted/10 to-accent/5",
];

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
      <div
        className={`relative h-[240px] sm:h-[280px] overflow-hidden group border border-surface/10 ${
          index % 2 === 1 ? "lg:order-2" : ""
        } ${!project.imageUrl ? `bg-gradient-to-br ${accent}` : ""}`}
      >
        {project.imageUrl ? (
          <Image src={project.imageUrl} alt={project.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-accent/12 text-[100px] font-bold leading-none select-none group-hover:text-accent/20 transition-colors duration-500">
              {label}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-base/30 group-hover:bg-base/10 transition-colors duration-500" />
      </div>

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

export default function Projects() {
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Project[]) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]));
  }, []);

  if (projects === null) return null;

  const sorted = [...projects].sort((a, b) => a.position - b.position);
  const featured = sorted.slice(0, FEATURED_COUNT);
  const grid = sorted.slice(FEATURED_COUNT, TOTAL_LIMIT);
  const showViewAll = sorted.length > TOTAL_LIMIT;

  if (projects.length === 0) {
    return (
      <section id="projects" className="py-16 sm:py-28 px-6 sm:px-16 max-w-6xl mx-auto">
        <SectionHeading number="03" title="Projects" />
        <p className="font-mono text-xs text-muted/30">No projects yet.</p>
      </section>
    );
  }

  return (
    <section id="projects" className="py-16 sm:py-28 px-6 sm:px-16 max-w-6xl mx-auto">
      <SectionHeading number="03" title="Projects" />

      {featured.length > 0 && (
        <div className="space-y-16 sm:space-y-24 mb-16 sm:mb-28">
          {featured.map((p, i) => (
            <FeaturedCard key={p.id} project={p} index={i} />
          ))}
        </div>
      )}

      {grid.length > 0 && (
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
            {grid.map((p, i) => (
              <GridCard key={p.id} project={p} index={i} />
            ))}
          </div>
        </div>
      )}

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
    </section>
  );
}
