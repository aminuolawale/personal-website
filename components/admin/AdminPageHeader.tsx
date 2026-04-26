// Shared header for every admin sub-page.
// Renders the dark top bar with a back-to-dashboard breadcrumb and the page title.
// Pass `actions` to place buttons on the right side (e.g. "New Photo").
//
// Usage:
//   <AdminPageHeader title="Gallery" actions={<Link href="...">+ Add Photo</Link>} />

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  title: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}

export default function AdminPageHeader({
  title,
  backHref = "/admin/dashboard",
  backLabel = "Dashboard",
  actions,
}: Props) {
  return (
    <div className="border-b border-[#f2f3ae]/10 bg-[#020122]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={backHref}
            className="flex items-center gap-1.5 font-mono text-xs text-[#edd382]/40 hover:text-[#fc9e4f] transition-colors"
          >
            <ArrowLeft size={13} />
            {backLabel}
          </Link>
          <span className="font-mono text-[#fc9e4f] text-sm font-bold">{title}</span>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
