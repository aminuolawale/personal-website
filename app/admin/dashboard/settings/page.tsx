import TabOrderEditor from "@/components/admin/TabOrderEditor";
import ContentEditor from "@/components/admin/ContentEditor";
import ExperienceEditor from "@/components/admin/ExperienceEditor";
import ColorPaletteEditor from "@/components/admin/ColorPaletteEditor";
import FontEditor from "@/components/admin/FontEditor";
import SectionVisibilityEditor from "@/components/admin/SectionVisibilityEditor";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

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

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-base text-muted">
      <AdminPageHeader title="Settings" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        <div>
          <h2 className="text-surface font-semibold mb-4">Section Visibility</h2>
          <SectionVisibilityEditor />
        </div>

        <div>
          <h2 className="text-surface font-semibold mb-4">Site Content</h2>
          <ContentEditor />
        </div>

        <div>
          <h2 className="text-surface font-semibold mb-4">Work Experience</h2>
          <ExperienceEditor />
        </div>

        <div>
          <h2 className="text-surface font-semibold mb-4">Color Palette</h2>
          <ColorPaletteEditor />
        </div>

        <div>
          <h2 className="text-surface font-semibold mb-4">Typography</h2>
          <FontEditor />
        </div>

        <div>
          <h2 className="text-surface font-semibold mb-4">Tab Order</h2>
          <div className="space-y-4">
            <TabOrderEditor section="swe" defaultTabs={SWE_TABS} />
            <TabOrderEditor section="astrophotography" defaultTabs={ASTRO_TABS} />
          </div>
        </div>
      </div>
    </div>
  );
}
