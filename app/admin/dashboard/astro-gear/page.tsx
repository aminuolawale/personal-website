"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Plus, Trash2, ExternalLink, ImageIcon } from "lucide-react";
import { upload } from "@vercel/blob/client";
import type { AstroGear } from "@/lib/schema";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

type GearType = "equipment" | "software" | "technique";

const TABS: { id: GearType; label: string }[] = [
  { id: "equipment", label: "Equipment" },
  { id: "software", label: "Software" },
  { id: "technique", label: "Technique" },
];

const INPUT =
  "w-full bg-[#f2f3ae]/[0.04] border border-[#f2f3ae]/15 px-3 py-2 text-sm text-[#f2f3ae] placeholder:text-[#edd382]/20 focus:outline-none focus:border-[#fc9e4f]/50";

export default function AstroGearPage() {
  const [tab, setTab] = useState<GearType>("equipment");
  const [items, setItems] = useState<AstroGear[]>([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [newLink, setNewLink] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [publishAsUpdate, setPublishAsUpdate] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    load();
    setNewName("");
    setNewLink("");
    setImageFile(null);
    setImagePreview(null);
    setPublishAsUpdate(false);
    setError("");
  }, [load]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setError("");
    try {
      let imageUrl: string | undefined;
      if (tab === "equipment" && imageFile) {
        setUploadProgress("Uploading image…");
        const blob = await upload(imageFile.name, imageFile, {
          access: "public",
          handleUploadUrl: "/api/astro-gear/upload",
        });
        imageUrl = blob.url;
        setUploadProgress("");
      }

      const res = await fetch("/api/astro-gear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: tab,
          name: newName.trim(),
          imageUrl: imageUrl ?? null,
          link: newLink.trim() || null,
          publishAsUpdate,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to add");
      }
      setNewName("");
      setNewLink("");
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setPublishAsUpdate(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setAdding(false);
      setUploadProgress("");
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
      <AdminPageHeader title="Gear Library" />

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
        <form onSubmit={handleAdd} className="space-y-3 mb-8 border border-[#f2f3ae]/10 p-4">
          <div>
            <label className="font-mono text-[10px] text-[#edd382]/40 uppercase tracking-widest block mb-1">Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={
                tab === "equipment"
                  ? "e.g. William Optics Redcat 51"
                  : tab === "software"
                  ? "e.g. PixInsight"
                  : "e.g. HOO narrowband · 120×300s"
              }
              className={INPUT}
            />
          </div>

          <div>
            <label className="font-mono text-[10px] text-[#edd382]/40 uppercase tracking-widest block mb-1">
              {tab === "equipment" ? "Product Link" : tab === "software" ? "Website" : "Reference Link"}
            </label>
            <input
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="https://"
              type="url"
              className={INPUT}
            />
          </div>

          {tab === "equipment" && (
            <div>
              <label className="font-mono text-[10px] text-[#edd382]/40 uppercase tracking-widest block mb-1">Image</label>
              <div className="flex items-start gap-3">
                <div
                  className="w-16 h-16 border border-[#f2f3ae]/15 flex items-center justify-center shrink-0 bg-[#f2f3ae]/[0.02] cursor-pointer hover:border-[#fc9e4f]/40 transition-colors overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <Image src={imagePreview} alt="" width={64} height={64} className="w-full h-full object-cover" unoptimized />
                  ) : (
                    <ImageIcon size={18} className="text-[#edd382]/20" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="font-mono text-xs text-[#edd382]/40 hover:text-[#fc9e4f] transition-colors border border-[#f2f3ae]/15 px-3 py-1.5 hover:border-[#fc9e4f]/30"
                  >
                    {imageFile ? "Change image" : "Choose image"}
                  </button>
                  {imageFile && (
                    <p className="font-mono text-[10px] text-[#edd382]/30 mt-1 truncate">{imageFile.name}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={publishAsUpdate}
                onChange={(e) => setPublishAsUpdate(e.target.checked)}
                className="accent-[#fc9e4f]"
              />
              <span className="font-mono text-xs text-[#edd382]/50">Publish as update</span>
            </label>
            <button
              type="submit"
              disabled={adding || !newName.trim()}
              className="flex items-center gap-2 font-mono text-xs text-[#020122] bg-[#fc9e4f] px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              <Plus size={13} />
              {uploadProgress || (adding ? "Adding…" : "Add")}
            </button>
          </div>
        </form>

        {error && <p className="font-mono text-xs text-red-400 mb-4">{error}</p>}

        {/* List */}
        {loading ? (
          <p className="font-mono text-xs text-[#edd382]/30 py-8 text-center">Loading…</p>
        ) : items.length === 0 ? (
          <div className="py-16 text-center border border-[#f2f3ae]/10">
            <p className="font-mono text-sm text-[#edd382]/30">No {tab} entries yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f2f3ae]/[0.06]">
            {items.map((item) => (
              <div
                key={item.id}
                className="py-3 flex items-center gap-3 hover:bg-[#f2f3ae]/[0.015] -mx-3 px-3 transition-colors"
              >
                {item.imageUrl ? (
                  <div className="w-9 h-9 shrink-0 overflow-hidden border border-[#f2f3ae]/10">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : tab === "equipment" ? (
                  <div className="w-9 h-9 shrink-0 border border-[#f2f3ae]/10 flex items-center justify-center">
                    <ImageIcon size={13} className="text-[#edd382]/20" />
                  </div>
                ) : null}

                <div className="flex-1 min-w-0">
                  <span className="text-[#f2f3ae] text-sm">{item.name}</span>
                  {item.link && (
                    <p className="font-mono text-[10px] text-[#edd382]/30 truncate mt-0.5">{item.link}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-[#edd382]/30 hover:text-[#fc9e4f] transition-colors"
                      title="Open link"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="p-1.5 text-[#edd382]/40 hover:text-red-400 transition-colors disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
