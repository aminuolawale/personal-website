"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProjectForm from "@/components/admin/ProjectForm";
import type { Project } from "@/lib/schema";

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then((d) => { if (d) setProject(d); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020122] flex items-center justify-center">
        <p className="font-mono text-xs text-[#edd382]/30">Loading…</p>
      </div>
    );
  }
  if (notFound || !project) {
    return (
      <div className="min-h-screen bg-[#020122] flex items-center justify-center">
        <p className="font-mono text-sm text-[#edd382]/50">Project not found.</p>
      </div>
    );
  }

  return <ProjectForm project={project} />;
}
