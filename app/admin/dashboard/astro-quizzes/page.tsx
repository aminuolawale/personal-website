"use client";

import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AstroQuizManager from "@/components/admin/AstroQuizManager";

export default function AstroQuizzesPage() {
  return (
    <div className="min-h-screen bg-base text-muted">
      <AdminPageHeader title="Astro Quizzes" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <AstroQuizManager />
      </div>
    </div>
  );
}
