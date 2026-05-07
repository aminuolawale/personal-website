"use client";

import AdminPageHeader from "@/components/admin/AdminPageHeader";
import MiscStructureManager from "@/components/admin/MiscStructureManager";

export default function MiscStructurePage() {
  return (
    <div className="min-h-screen bg-base text-muted">
      <AdminPageHeader title="Misc Structure" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <MiscStructureManager />
      </div>
    </div>
  );
}
