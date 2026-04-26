"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ThemeToggle from "@/components/ThemeToggle";

function AdminLoginContent() {
  const params = useSearchParams();
  const error = params.get("error");

  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center px-6 relative">
      <ThemeToggle className="absolute top-6 right-6" />
      <div className="w-full max-w-sm">
        <p className="font-mono text-accent text-xs uppercase tracking-widest mb-3">
          Admin
        </p>
        <h1 className="text-surface text-2xl font-bold mb-8">AO. CMS</h1>

        {error && (
          <p className="font-mono text-xs text-red-400 mb-4">
            Access denied. Use the authorised Google account.
          </p>
        )}

        <button
          onClick={() => signIn("google", { callbackUrl: "/admin/dashboard" })}
          className="w-full font-mono text-sm text-accent border border-accent py-3 hover:bg-accent/10 transition-all duration-200"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginContent />
    </Suspense>
  );
}
