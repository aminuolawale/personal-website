"use client";

import { useState, useEffect, useRef } from "react";
import { Save, RotateCcw, Plus, Trash2 } from "lucide-react";
import { DEFAULT_EXPERIENCES, type WorkExperience } from "@/lib/hooks/use-experience";

const LABEL = "block font-mono text-xs text-muted/50 uppercase tracking-widest mb-1.5";
const INPUT = "w-full bg-surface/[0.04] border border-surface/15 px-3 py-2 text-sm text-surface placeholder:text-muted/20 focus:outline-none focus:border-accent/50";

function newEntry(): WorkExperience {
  return {
    id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    company: "",
    role: "",
    startDate: "",
    endDate: "",
    location: "",
    responsibilities: [],
  };
}

export default function ExperienceEditor() {
  const [experiences, setExperiences] = useState<WorkExperience[]>(DEFAULT_EXPERIENCES);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);
  const entryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    fetch("/api/config?key=work-experience")
      .then((r) => (r.ok ? r.json() : { value: null }))
      .then(({ value }) => {
        if (Array.isArray(value) && value.length > 0) setExperiences(value);
      })
      .catch(() => {});
  }, []);

  function update(id: string, field: keyof WorkExperience, value: string | string[]) {
    setExperiences((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
    setSaved(false);
  }

  function remove(id: string) {
    setExperiences((prev) => prev.filter((e) => e.id !== id));
    setSaved(false);
  }

  useEffect(() => {
    if (!pendingScrollId) return;
    const el = entryRefs.current[pendingScrollId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setPendingScrollId(null);
    }
  }, [pendingScrollId, experiences]);

  function add() {
    const entry = newEntry();
    setExperiences((prev) => [entry, ...prev]);
    setPendingScrollId(entry.id);
    setSaved(false);
  }

  function handleReset() {
    setExperiences(DEFAULT_EXPERIENCES);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "work-experience", value: experiences }),
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
        <p className="font-mono text-xs text-muted/50 uppercase tracking-widest">work experience</p>
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

      {/* ── Entries ───────────────────────────────────────────────── */}
      {experiences.map((exp, idx) => (
        <div key={exp.id} ref={(el) => { entryRefs.current[exp.id] = el; }} className="px-4 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] text-accent/60 uppercase tracking-widest">
              {exp.company || `Entry ${idx + 1}`}
            </p>
            <button
              onClick={() => remove(exp.id)}
              className="p-1 text-muted/30 hover:text-red-400 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Company</label>
              <input
                className={INPUT}
                value={exp.company}
                onChange={(e) => update(exp.id, "company", e.target.value)}
                placeholder="Google"
              />
            </div>
            <div>
              <label className={LABEL}>Role</label>
              <input
                className={INPUT}
                value={exp.role}
                onChange={(e) => update(exp.id, "role", e.target.value)}
                placeholder="Software Engineer"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className={LABEL}>Start Date</label>
              <input
                type="month"
                className={INPUT}
                value={exp.startDate}
                onChange={(e) => update(exp.id, "startDate", e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL}>End Date</label>
              <div className="space-y-2">
                <input
                  type="month"
                  className={INPUT}
                  value={exp.endDate === "Present" ? "" : exp.endDate}
                  disabled={exp.endDate === "Present"}
                  onChange={(e) => update(exp.id, "endDate", e.target.value)}
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exp.endDate === "Present"}
                    onChange={(e) =>
                      update(exp.id, "endDate", e.target.checked ? "Present" : "")
                    }
                    className="accent-accent"
                  />
                  <span className="font-mono text-xs text-muted/50">Present</span>
                </label>
              </div>
            </div>
            <div>
              <label className={LABEL}>Location</label>
              <input
                className={INPUT}
                value={exp.location}
                onChange={(e) => update(exp.id, "location", e.target.value)}
                placeholder="Zurich, Switzerland"
              />
            </div>
          </div>

          <div>
            <label className={LABEL}>Responsibilities (one per line)</label>
            <textarea
              className={`${INPUT} resize-none`}
              rows={4}
              value={exp.responsibilities.join("\n")}
              onChange={(e) =>
                update(exp.id, "responsibilities", e.target.value.split("\n"))
              }
              placeholder={"Build and maintain large-scale systems…\nCollaborate with cross-functional teams…"}
            />
          </div>
        </div>
      ))}

      {/* ── Add button ────────────────────────────────────────────── */}
      <div className="px-4 py-3">
        <button
          onClick={add}
          className="flex items-center gap-1.5 font-mono text-xs text-muted/40 hover:text-accent transition-colors"
        >
          <Plus size={12} />
          Add experience
        </button>
      </div>

    </div>
  );
}
