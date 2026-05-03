"use client";

import { useState } from "react";
import TabOrderEditor from "@/components/admin/TabOrderEditor";
import ContentEditor from "@/components/admin/ContentEditor";
import ExperienceEditor from "@/components/admin/ExperienceEditor";
import ColorPaletteEditor from "@/components/admin/ColorPaletteEditor";
import FontEditor from "@/components/admin/FontEditor";
import SectionVisibilityEditor from "@/components/admin/SectionVisibilityEditor";
import SettingsNav, { SETTINGS_SECTIONS, type SettingsSectionId } from "@/components/admin/SettingsNav";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useArticles } from "@/lib/hooks/use-articles";

const SWE_TABS = [
  { id: "articles", label: "Articles" },
  { id: "projects", label: "Projects" },
  { id: "about", label: "About Me" },
];

const ASTRO_TABS = [
  { id: "articles", label: "Articles" },
  { id: "calendar", label: "Astro Calendar" },
  { id: "gallery", label: "Gallery" },
  { id: "gear", label: "Gear" },
  { id: "sky", label: "Night Sky" },
];

function SectionContent({ active }: { active: SettingsSectionId }) {
  const { articles: miscArticles } = useArticles("misc", true);
  const MISC_TABS = miscArticles.map(a => ({ id: a.slug, label: a.title }));

  switch (active) {
    case "visibility":
      return (
        <>
          <h2 className="text-surface font-semibold mb-4">Section Visibility</h2>
          <SectionVisibilityEditor />
        </>
      );
    case "content":
      return (
        <>
          <h2 className="text-surface font-semibold mb-4">Site Content</h2>
          <ContentEditor />
        </>
      );
    case "experience":
      return (
        <>
          <h2 className="text-surface font-semibold mb-4">Work Experience</h2>
          <ExperienceEditor />
        </>
      );
    case "palette":
      return (
        <>
          <h2 className="text-surface font-semibold mb-4">Color Palette</h2>
          <ColorPaletteEditor />
        </>
      );
    case "typography":
      return (
        <>
          <h2 className="text-surface font-semibold mb-4">Typography</h2>
          <FontEditor />
        </>
      );
    case "tabs":
      return (
        <>
          <h2 className="text-surface font-semibold mb-4">Tab Order</h2>
          <div className="space-y-4">
            <TabOrderEditor section="swe" defaultTabs={SWE_TABS} />
            <TabOrderEditor section="astrophotography" defaultTabs={ASTRO_TABS} />
            {MISC_TABS.length > 0 && (
              <TabOrderEditor section="misc" defaultTabs={MISC_TABS} />
            )}
          </div>
        </>
      );
    case "configs":
      return (
        <>
          <h2 className="text-surface font-semibold mb-4">Configs</h2>
          <div className="space-y-2">
            {[
              { label: "Database (Neon)", href: "https://console.neon.tech/app/projects/still-sunset-47533321" },
              { label: "Blob Storage (Vercel)", href: "https://vercel.com/aminuolawalekan-9083s-projects/personal-website/stores/blob/store_u8XcLf82nOIjWtR6/browser" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between w-full border border-surface/10 px-4 py-3 font-mono text-xs text-muted/50 hover:text-accent hover:border-accent/30 transition-colors"
              >
                {label}
                <span className="text-muted/25">↗</span>
              </a>
            ))}
          </div>
        </>
      );
  }
}

export default function SettingsPage() {
  const [active, setActive] = useState<SettingsSectionId>("visibility");

  return (
    <div className="min-h-screen bg-base text-muted">
      <AdminPageHeader title="Settings" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Mobile nav — horizontal scrollable strip */}
        <div className="lg:hidden flex overflow-x-auto gap-1 mb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SETTINGS_SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`shrink-0 font-mono text-xs px-3 py-1.5 border transition-colors ${
                active === id
                  ? "border-accent text-accent bg-accent/5"
                  : "border-surface/15 text-muted/40 hover:border-accent/30 hover:text-muted/70"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-12 items-start">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <SectionContent active={active} />
          </div>

          {/* Sidebar nav — desktop only */}
          <div className="hidden lg:block w-44 shrink-0">
            <SettingsNav active={active} onSelect={setActive} />
          </div>
        </div>
      </div>
    </div>
  );
}
