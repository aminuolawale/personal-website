"use client";

import { useState, useEffect } from "react";
import { SECTION_IDS, DEFAULT_VISIBILITY, type SectionVisibility, type SectionId } from "@/lib/section-visibility";

const SECTION_LABELS: Record<SectionId, string> = {
  swe: "Software Engineering",
  astrophotography: "Astrophotography",
  writing: "Writing",
  misc: "Miscellaneous",
};

export default function SectionVisibilityEditor() {
  const [visibility, setVisibility] = useState<SectionVisibility>(DEFAULT_VISIBILITY);
  const [saving, setSaving] = useState<SectionId | null>(null);

  useEffect(() => {
    fetch("/api/config?key=section-visibility")
      .then((r) => r.json())
      .then(({ value }) => { if (value) setVisibility({ ...DEFAULT_VISIBILITY, ...value }); })
      .catch(() => {});
  }, []);

  async function toggle(section: SectionId) {
    const next = { ...visibility, [section]: !visibility[section] };
    setVisibility(next);
    setSaving(section);
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "section-visibility", value: next }),
    });
    setSaving(null);
  }

  return (
    <div className="border border-surface/10 divide-y divide-surface/[0.06]">
      {SECTION_IDS.map((section) => {
        const isVisible = visibility[section];
        const isSaving = saving === section;
        return (
          <div key={section} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-mono text-sm text-surface">{SECTION_LABELS[section]}</p>
              <p className="font-mono text-[10px] text-muted/35 mt-0.5">/{section}</p>
            </div>
            <button
              onClick={() => toggle(section)}
              disabled={isSaving}
              aria-label={`${isVisible ? "Hide" : "Show"} ${SECTION_LABELS[section]}`}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 focus-visible:outline-none disabled:opacity-40 ${
                isVisible ? "border-accent bg-accent/20" : "border-muted/20 bg-transparent"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-3.5 w-3.5 translate-y-[-1px] rounded-full shadow transition-transform duration-200 ${
                  isVisible ? "translate-x-3.5 bg-accent" : "translate-x-0 bg-muted/30"
                }`}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
