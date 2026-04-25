import { getDb } from "@/lib/db";
import { projects } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import Link from "next/link";
import { ExternalLink, ArrowLeft } from "lucide-react";
import { GitHubIcon } from "@/components/icons";
import { splitTags } from "@/lib/utils";
import type { Metadata } from "next";
import type { Project } from "@/lib/schema";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "All Projects",
  description: `Every software project by ${SITE.name}.`,
  alternates: { canonical: `${SITE.url}/swe/projects` },
};

function FolderIcon() {
  return (
    <svg width="40" height="34" viewBox="0 0 40 34" fill="none" aria-hidden className="text-[#fc9e4f]">
      <path d="M4 6C4 4.895 4.895 4 6 4H15L19 9H34C35.105 9 36 9.895 36 11V28C36 29.105 35.105 30 34 30H6C4.895 30 4 29.105 4 28V6Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export default async function AllProjectsPage() {
  let allProjects: Project[] = [];
  try {
    const db = getDb();
    allProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.published, true))
      .orderBy(asc(projects.position));
  } catch {
    // DB unavailable — render empty state
  }

  return (
    <main className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-6 sm:px-16 max-w-6xl mx-auto">
      <Link
        href="/swe"
        className="inline-flex items-center gap-2 font-mono text-xs text-[#edd382]/40 hover:text-[#fc9e4f] transition-colors mb-12"
      >
        <ArrowLeft size={13} />
        Back to SWE
      </Link>

      <div className="mb-12">
        <p className="font-mono text-[#fc9e4f] text-xs mb-2">Software Engineering</p>
        <h1 className="text-[#f2f3ae] text-3xl sm:text-4xl font-bold">All Projects</h1>
      </div>

      {allProjects.length === 0 ? (
        <p className="font-mono text-sm text-[#edd382]/40">No projects published yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allProjects.map((p) => {
            const stack = splitTags(p.tags);
            return (
              <div
                key={p.id}
                className="group bg-[#f2f3ae]/[0.025] border border-[#f2f3ae]/10 p-6 flex flex-col hover:bg-[#f2f3ae]/[0.05] hover:border-[#fc9e4f]/25 hover:-translate-y-1 transition-all duration-300"
              >
                {p.imageUrl && (
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    className="w-full h-36 object-cover mb-4 border border-[#f2f3ae]/10"
                  />
                )}
                <div className="flex items-start justify-between mb-6">
                  <FolderIcon />
                  <div className="flex gap-3 text-[#f2f3ae]/30 group-hover:text-[#f2f3ae]/60 transition-colors">
                    {p.githubUrl && (
                      <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                        <GitHubIcon size={18} />
                      </a>
                    )}
                    {p.websiteUrl && (
                      <a href={p.websiteUrl} target="_blank" rel="noopener noreferrer" aria-label="Live site">
                        <ExternalLink size={18} />
                      </a>
                    )}
                  </div>
                </div>
                <h2 className="text-[#f2f3ae] font-semibold text-base mb-3 group-hover:text-[#fc9e4f] transition-colors">
                  {p.title}
                </h2>
                <p className="text-[#edd382]/50 text-sm leading-relaxed flex-1 mb-5">{p.description}</p>
                <ul className="flex flex-wrap gap-3 font-mono text-xs text-[#fc9e4f]/60">
                  {stack.map((t) => <li key={t}>{t}</li>)}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
