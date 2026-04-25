import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TabOrderEditor from "@/components/admin/TabOrderEditor";

const SWE_TABS = [
  { id: "articles", label: "Articles" },
  { id: "projects", label: "Projects" },
  { id: "about", label: "About Me" },
];

const ASTRO_TABS = [
  { id: "articles", label: "Articles" },
  { id: "calendar", label: "Astro Calendar" },
  { id: "gallery", label: "Gallery" },
];

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#020122] text-[#edd382]">
      <div className="border-b border-[#f2f3ae]/10 bg-[#020122]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-mono text-xs text-[#edd382]/40 hover:text-[#fc9e4f] transition-colors">
            <ArrowLeft size={13} />
            Dashboard
          </Link>
          <span className="font-mono text-[#fc9e4f] text-sm font-bold">Settings</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h2 className="text-[#f2f3ae] font-semibold mb-4">Tab Order</h2>
          <div className="space-y-4">
            <TabOrderEditor section="swe" defaultTabs={SWE_TABS} />
            <TabOrderEditor section="astrophotography" defaultTabs={ASTRO_TABS} />
          </div>
        </div>
      </div>
    </div>
  );
}
