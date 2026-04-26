"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Save } from "lucide-react";
import Link from "next/link";
import type { Project } from "@/lib/schema";

export default function ProjectForm({ project }: { project?: Project }) {
  const router = useRouter();
  const isEdit = !!project;

  const [title, setTitle] = useState(project?.title ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [githubUrl, setGithubUrl] = useState(project?.githubUrl ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(project?.websiteUrl ?? "");
  const [imageUrl, setImageUrl] = useState(project?.imageUrl ?? "");
  const [tags, setTags] = useState(project?.tags ?? "");
  const [position, setPosition] = useState<number>(project?.position ?? 1);
  const [published, setPublished] = useState(project?.published ?? true);

  const [publishAsUpdate, setPublishAsUpdate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  async function fetchFromGithub() {
    if (!githubUrl.trim()) return;
    setFetching(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/github-meta?url=${encodeURIComponent(githubUrl)}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (!title) setTitle(data.title);
      if (!description) setDescription(data.description);
      if (!websiteUrl && data.websiteUrl) setWebsiteUrl(data.websiteUrl);
      if (!tags && data.tags) setTags(data.tags);
    } catch {
      setError("Could not fetch repo data — check the URL and try again.");
    } finally {
      setFetching(false);
    }
  }

  async function handleSave() {
    if (!title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    setError("");
    const body = {
      title: title.trim(),
      description: description.trim(),
      githubUrl: githubUrl.trim() || null,
      websiteUrl: websiteUrl.trim() || null,
      imageUrl: imageUrl.trim() || null,
      tags: tags.trim(),
      position,
      published,
      ...(isEdit ? {} : { publishAsUpdate }),
    };
    try {
      const res = await fetch(
        isEdit ? `/api/projects/${project!.id}` : "/api/projects",
        { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );
      if (!res.ok) throw new Error(await res.text());
      router.push("/admin/dashboard/projects");
    } catch {
      setError("Failed to save. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-base text-muted">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 border-b border-surface/10 bg-base">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link
            href="/admin/dashboard/projects"
            className="flex items-center gap-2 font-mono text-xs text-muted/40 hover:text-accent transition-colors shrink-0"
          >
            <ArrowLeft size={13} />
            Projects
          </Link>
          <div className="flex items-center gap-3 min-w-0">
            {error && <span className="font-mono text-xs text-red-400 truncate">{error}</span>}
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="flex items-center gap-2 font-mono text-xs text-base bg-accent px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
            >
              <Save size={13} />
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* GitHub URL */}
        <div className="space-y-1.5">
          <label className="block font-mono text-xs text-muted/50 uppercase tracking-widest">GitHub URL</label>
          <div className="flex gap-2">
            <input
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/user/repo"
              className="flex-1 bg-surface/[0.04] border border-surface/15 px-3 py-2 text-sm text-surface placeholder:text-muted/20 focus:outline-none focus:border-accent/50"
            />
            <button
              onClick={fetchFromGithub}
              disabled={!githubUrl.trim() || fetching}
              className="flex items-center gap-2 font-mono text-xs text-accent border border-accent/40 px-3 py-2 hover:bg-accent/10 transition-all disabled:opacity-40 shrink-0"
            >
              <RefreshCw size={12} className={fetching ? "animate-spin" : ""} />
              {fetching ? "Fetching…" : "Fetch from GitHub"}
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="block font-mono text-xs text-muted/50 uppercase tracking-widest">Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Project name"
            className="w-full bg-surface/[0.04] border border-surface/15 px-3 py-2 text-sm text-surface placeholder:text-muted/20 focus:outline-none focus:border-accent/50"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block font-mono text-xs text-muted/50 uppercase tracking-widest">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description of the project"
            rows={4}
            className="w-full bg-surface/[0.04] border border-surface/15 px-3 py-2 text-sm text-surface placeholder:text-muted/20 focus:outline-none focus:border-accent/50 resize-y"
          />
        </div>

        {/* Website URL */}
        <div className="space-y-1.5">
          <label className="block font-mono text-xs text-muted/50 uppercase tracking-widest">Website URL</label>
          <input
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full bg-surface/[0.04] border border-surface/15 px-3 py-2 text-sm text-surface placeholder:text-muted/20 focus:outline-none focus:border-accent/50"
          />
        </div>

        {/* Featured Image */}
        <div className="space-y-1.5">
          <label className="block font-mono text-xs text-muted/50 uppercase tracking-widest">Featured Image URL</label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.png"
            className="w-full bg-surface/[0.04] border border-surface/15 px-3 py-2 text-sm text-surface placeholder:text-muted/20 focus:outline-none focus:border-accent/50"
          />
          {imageUrl.trim() && (
            <img
              src={imageUrl}
              alt="Preview"
              className="mt-2 h-36 w-full object-cover border border-surface/10"
            />
          )}
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <label className="block font-mono text-xs text-muted/50 uppercase tracking-widest">
            Tags <span className="normal-case text-muted/30">(comma-separated)</span>
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Python, React, Go"
            className="w-full bg-surface/[0.04] border border-surface/15 px-3 py-2 text-sm text-surface placeholder:text-muted/20 focus:outline-none focus:border-accent/50"
          />
        </div>

        {/* Position */}
        <div className="space-y-1.5">
          <label className="block font-mono text-xs text-muted/50 uppercase tracking-widest">Position</label>
          <p className="font-mono text-xs text-muted/30">
            Positions 1–2 display as large featured cards. Position 3+ display in the project grid.
            If total published projects exceed 8, a "View All" link appears.
          </p>
          <input
            type="number"
            min={1}
            value={position}
            onChange={(e) => setPosition(Math.max(1, Number(e.target.value)))}
            className="w-24 bg-surface/[0.04] border border-surface/15 px-3 py-2 text-sm text-surface focus:outline-none focus:border-accent/50"
          />
        </div>

        {/* Publish as Update (new items only) */}
        {!isEdit && (
          <div className="flex items-center justify-between border border-surface/10 p-4">
            <div>
              <p className="text-sm font-semibold text-surface">Publish as Update</p>
              <p className="font-mono text-xs text-muted/35 mt-0.5">Add to the Updates feed on the homepage</p>
            </div>
            <button
              type="button"
              onClick={() => setPublishAsUpdate((v) => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${publishAsUpdate ? "bg-accent" : "bg-surface/15"}`}
              aria-label={publishAsUpdate ? "Remove from updates" : "Add to updates"}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-base transition-all duration-200 ${publishAsUpdate ? "left-5" : "left-0.5"}`} />
            </button>
          </div>
        )}

        {/* Published toggle */}
        <div className="flex items-center justify-between border border-surface/10 p-4">
          <div>
            <p className="text-sm font-semibold text-surface">Published</p>
            <p className="font-mono text-xs text-muted/35 mt-0.5">Show on the public site</p>
          </div>
          <button
            type="button"
            onClick={() => setPublished((v) => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors ${published ? "bg-accent" : "bg-surface/15"}`}
            aria-label={published ? "Unpublish" : "Publish"}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-base transition-all duration-200 ${published ? "left-5" : "left-0.5"}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
