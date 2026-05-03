"use client";

import { useState, useEffect } from "react";
import { Save, RotateCcw } from "lucide-react";
import { DEFAULT_CONTENT, type SiteContent } from "@/lib/hooks/use-site-content";

const LABEL = "block font-mono text-xs text-muted/50 uppercase tracking-widest mb-1.5";
const INPUT = "w-full bg-surface/[0.04] border border-surface/15 px-3 py-2 text-sm text-surface placeholder:text-muted/20 focus:outline-none focus:border-accent/50";

const PAGE_SECTIONS = [
  {
    label:             "SWE",
    titleKey:          "sweTitle",
    descKey:           "sweDescription",
    titlePlaceholder:  "Software Engineering",
    descPlaceholder:   "Building software since…",
  },
  {
    label:             "Astrophotography",
    titleKey:          "astroTitle",
    descKey:           "astroDescription",
    titlePlaceholder:  "Capturing the Night Sky",
    descPlaceholder:   "Session logs from…",
  },
  {
    label:             "Writing",
    titleKey:          "writingTitle",
    descKey:           "writingDescription",
    titlePlaceholder:  "Essays & Reflections",
    descPlaceholder:   "On technology, the cosmos…",
  },
  {
    label:             "Misc",
    titleKey:          "miscTitle",
    descKey:           "miscDescription",
    titlePlaceholder:  "Miscellaneous",
    descPlaceholder:   "Various documents, legal notices…",
  },
] as const;

export default function ContentEditor() {
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/config?key=site-content")
      .then((r) => (r.ok ? r.json() : { value: null }))
      .then(({ value }) => {
        if (value && typeof value === "object") {
          setContent({ ...DEFAULT_CONTENT, ...value });
        }
      })
      .catch(() => {});
  }, []);

  function set(key: keyof SiteContent, value: string) {
    setContent((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleReset() {
    setContent(DEFAULT_CONTENT);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "site-content", value: content }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-surface/10 divide-y divide-surface/[0.08]">

      {/* ── Toolbar ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3">
        <p className="font-mono text-xs text-muted/50 uppercase tracking-widest">site content</p>
        <div className="flex items-center gap-2">
          {error && <span className="font-mono text-xs text-red-400">{error}</span>}
          {saved && <span className="font-mono text-xs text-emerald-400/70">Saved</span>}
          <button
            onClick={handleReset}
            title="Reset to defaults"
            className="p-1.5 text-muted/30 hover:text-muted/70 transition-colors"
          >
            <RotateCcw size={12} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 font-mono text-xs text-base bg-accent px-3 py-1.5 hover:opacity-90 disabled:opacity-40"
          >
            <Save size={11} />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div className="px-4 py-5 space-y-4">
        <p className="font-mono text-[10px] text-accent/60 uppercase tracking-widest">Hero</p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Greeting</label>
            <input
              className={INPUT}
              value={content.greeting}
              onChange={(e) => set("greeting", e.target.value)}
              placeholder="Hi, my name is"
            />
          </div>
          <div>
            <label className={LABEL}>Name</label>
            <input
              className={INPUT}
              value={content.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Aminu Olawale."
            />
          </div>
        </div>

        <div>
          <label className={LABEL}>Roles</label>
          <input
            className={INPUT}
            value={content.roles}
            onChange={(e) => set("roles", e.target.value)}
            placeholder="Software Engineer · Astrophotographer · Writer."
          />
        </div>

        <div>
          <label className={LABEL}>Bio</label>
          <textarea
            className={`${INPUT} resize-none`}
            rows={3}
            value={content.bio}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="Based in Zurich, Switzerland…"
          />
        </div>
      </div>

      {/* ── Pages ─────────────────────────────────────────────────── */}
      <div className="px-4 py-5 space-y-4">
        <p className="font-mono text-[10px] text-accent/60 uppercase tracking-widest">Pages</p>

        <div className="space-y-4">
          {PAGE_SECTIONS.map(({ label, titleKey, descKey, titlePlaceholder, descPlaceholder }) => (
            <div key={label} className="border border-surface/10 p-3 space-y-3">
              <p className="font-mono text-[10px] text-muted/40 uppercase tracking-widest">{label}</p>

              <div>
                <label className={LABEL}>Title</label>
                <input
                  className={INPUT}
                  value={content[titleKey]}
                  onChange={(e) => set(titleKey, e.target.value)}
                  placeholder={titlePlaceholder}
                />
              </div>

              <div>
                <label className={LABEL}>Subtitle</label>
                <textarea
                  className={`${INPUT} resize-none`}
                  rows={3}
                  value={content[descKey]}
                  onChange={(e) => set(descKey, e.target.value)}
                  placeholder={descPlaceholder}
                />
              </div>

              {label === "SWE" && (
                <>
                  <div>
                    <label className={LABEL}>About Me — Bio</label>
                    <textarea
                      className={`${INPUT} resize-none`}
                      rows={3}
                      value={content.aboutBio}
                      onChange={(e) => set("aboutBio", e.target.value)}
                      placeholder="Hi, I'm Aminu Olawale…"
                    />
                  </div>
                  <div>
                    <label className={LABEL}>About Me — Skills (one per line)</label>
                    <textarea
                      className={`${INPUT} resize-none font-mono text-xs`}
                      rows={5}
                      value={content.aboutSkills}
                      onChange={(e) => set("aboutSkills", e.target.value)}
                      placeholder={"Python\nTypeScript\nGo\n…"}
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
