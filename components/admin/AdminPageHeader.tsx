// Shared header for every admin sub-page.
// Renders the dark top bar with a back-to-dashboard breadcrumb and the page title.
// Pass `actions` to place buttons on the right side (e.g. "New Photo").
//
// Usage:
//   <AdminPageHeader title="Gallery" actions={<Link href="...">+ Add Photo</Link>} />

"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

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
    <div className="border-b border-surface/10 bg-base">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 min-w-0">
          <Link
            href={backHref}
            className="flex items-center gap-1.5 font-mono text-xs text-muted/40 hover:text-accent transition-colors shrink-0"
          >
            <ArrowLeft size={13} />
            {backLabel}
          </Link>
          <span className="font-mono text-accent text-sm font-bold min-w-0 break-words">{title}</span>
          <ThemeToggle />
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
      </div>
    </div>
  );
}
