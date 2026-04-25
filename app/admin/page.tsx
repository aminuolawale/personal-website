"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AdminLoginContent() {
  const params = useSearchParams();
  const error = params.get("error");

  return (
    <div className="min-h-screen bg-[#020122] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="font-mono text-[#fc9e4f] text-xs uppercase tracking-widest mb-3">
          Admin
        </p>
        <h1 className="text-[#f2f3ae] text-2xl font-bold mb-8">AO. CMS</h1>

        {error && (
          <p className="font-mono text-xs text-red-400 mb-4">
            Access denied. Use the authorised Google account.
          </p>
        )}

        <button
          onClick={() => signIn("google", { callbackUrl: "/admin/dashboard" })}
          className="w-full font-mono text-sm text-[#fc9e4f] border border-[#fc9e4f] py-3 hover:bg-[#fc9e4f]/10 transition-all duration-200"
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
