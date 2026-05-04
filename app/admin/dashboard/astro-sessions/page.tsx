"use client";

import AstroSessionScheduler from "@/components/admin/AstroSessionScheduler";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default function AstroSessionsPage() {
  return (
    <div className="min-h-screen bg-base text-muted">
      <AdminPageHeader title="Astro Sessions" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <AstroSessionScheduler />
      </div>
    </div>
  );
}
