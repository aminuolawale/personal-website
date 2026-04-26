"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import type { AstroGear } from "@/lib/schema";

type GearType = "equipment" | "software" | "technique";

const TABS: { id: GearType; label: string }[] = [
  { id: "equipment", label: "Equipment" },
  { id: "software", label: "Software" },
  { id: "technique", label: "Technique" },
];

const INPUT =
  "flex-1 bg-[#f2f3ae]/[0.04] border border-[#f2f3ae]/15 px-3 py-2 text-sm text-[#f2f3ae] placeholder:text-[#edd382]/20 focus:outline-none focus:border-[#fc9e4f]/50";

export default function AstroGearPage() {
  const [tab, setTab] = useState<GearType>("equipment");
  const [items, setItems] = useState<AstroGear[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [publishAsUpdate, setPublishAsUpdate] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/astro-gear?type=${tab}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/astro-gear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: tab, name: newName.trim(), publishAsUpdate }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to add");
      }
      setNewName("");
      setPublishAsUpdate(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Remove this item?")) return;
    setDeletingId(id);
    await fetch(`/api/astro-gear/${id}`, { method: "DELETE" });
    setDeletingId(null);
    load();
  }

  return (
    <div className="min-h-screen bg-[#020122] text-[#edd382]">
      <div className="border-b border-[#f2f3ae]/10 bg-[#020122]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-4">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 font-mono text-xs text-[#edd382]/40 hover:text-[#fc9e4f] transition-colors"
          >
            <ArrowLeft size={13} />
            Dashboard
          </Link>
          <span className="font-mono text-[#fc9e4f] text-sm font-bold">Gear Library</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`font-mono text-xs px-3 py-1.5 border transition-all ${
                tab === t.id
                  ? "bg-[#fc9e4f] text-[#020122] border-[#fc9e4f]"
                  : "text-[#edd382]/50 border-[#f2f3ae]/15 hover:border-[#fc9e4f]/40"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Add form */}
        <form onSubmit={handleAdd} className="space-y-2 mb-6">
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={
                tab === "equipment"
                  ? "e.g. Redcat 51 + ASI2600MC + EQ6-R"
                  : tab === "software"
                  ? "e.g. PixInsight"
                  : "e.g. HOO narrowband · 120×300s"
              }
              className={INPUT}
            />
            <button
              type="submit"
              disabled={adding || !newName.trim()}
              className="flex items-center gap-2 font-mono text-xs text-[#020122] bg-[#fc9e4f] px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
            >
              <Plus size={13} />
              {adding ? "Adding…" : "Add"}
            </button>
          </div>
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={publishAsUpdate}
              onChange={(e) => setPublishAsUpdate(e.target.checked)}
              className="accent-[#fc9e4f]"
            />
            <span className="font-mono text-xs text-[#edd382]/50">Publish as update on homepage</span>
          </label>
        </form>

        {error && <p className="font-mono text-xs text-red-400 mb-4">{error}</p>}

        {/* List */}
        {loading ? (
          <p className="font-mono text-xs text-[#edd382]/30 py-8 text-center">Loading…</p>
        ) : items.length === 0 ? (
          <div className="py-16 text-center border border-[#f2f3ae]/10">
            <p className="font-mono text-sm text-[#edd382]/30">
              No {tab} entries yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f2f3ae]/[0.06]">
            {items.map((item) => (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-4 hover:bg-[#f2f3ae]/[0.015] -mx-3 px-3 transition-colors"
              >
                <span className="text-[#f2f3ae] text-sm">{item.name}</span>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="p-1.5 text-[#edd382]/40 hover:text-red-400 transition-colors disabled:opacity-40 shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
