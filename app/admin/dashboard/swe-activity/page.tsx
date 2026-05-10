"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import ThemeToggle from "@/components/ThemeToggle";
import ActivityManager from "@/components/admin/ActivityManager";

export default function SweActivityAdminPage() {
  async function handleLogout() {
    await signOut({ callbackUrl: "/admin" });
  }

  return (
    <div className="min-h-screen bg-base text-muted">
      {/* Header */}
      <div className="border-b border-surface/10 bg-base">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <Link href="/" className="font-mono text-accent text-lg font-bold hover:opacity-75 transition-opacity">
              AM.
            </Link>
            <span className="font-mono text-xs text-muted/30 uppercase tracking-widest">CMS</span>
            <Link
              href="/admin/dashboard"
              className="font-mono text-xs text-muted/40 hover:text-accent transition-colors border border-surface/10 px-2.5 py-1 hover:border-accent/30"
            >
              Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 font-mono text-xs text-muted/40 hover:text-accent transition-colors"
            >
              <LogOut size={13} />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <ActivityManager />
      </div>
    </div>
  );
}
