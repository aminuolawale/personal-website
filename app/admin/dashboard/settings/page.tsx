import TabOrderEditor from "@/components/admin/TabOrderEditor";
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
];

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-base text-muted">
      <AdminPageHeader title="Settings" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
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
