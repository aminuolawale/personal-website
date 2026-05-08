import AdminPageHeader from "@/components/admin/AdminPageHeader";
import FinderPreviewManager from "@/components/admin/FinderPreviewManager";

export default function FinderPreviewsPage() {
  return (
    <div className="min-h-screen bg-base text-muted">
      <AdminPageHeader title="Finder Previews" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <FinderPreviewManager />
      </div>
    </div>
  );
}
