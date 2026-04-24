"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/admin/dashboard");
    } else {
      setError("Incorrect password.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#020122] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="font-mono text-[#fc9e4f] text-xs uppercase tracking-widest mb-3">
          Admin
        </p>
        <h1 className="text-[#f2f3ae] text-2xl font-bold mb-8">AO. CMS</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-xs text-[#edd382]/50 uppercase tracking-widest mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#f2f3ae]/[0.04] border border-[#f2f3ae]/15 px-4 py-3 font-mono text-sm text-[#edd382] focus:outline-none focus:border-[#fc9e4f]/60 placeholder-[#edd382]/20 transition-colors"
              placeholder="••••••••"
              required
              autoFocus
            />
          </div>

          {error && (
            <p className="font-mono text-xs text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-mono text-sm text-[#fc9e4f] border border-[#fc9e4f] py-3 hover:bg-[#fc9e4f]/10 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
