"use client";

import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ReadingNotesManager from "@/components/admin/ReadingNotesManager";

export default function ReadingNotesPage() {
  return (
    <div className="min-h-screen bg-base text-muted">
      <AdminPageHeader title="Reading Notes" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <ReadingNotesManager />
      </div>
    </div>
  );
}
