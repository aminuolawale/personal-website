"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Upload, X } from "lucide-react";
import Link from "next/link";
import { upload } from "@vercel/blob/client";
import type { GalleryPhoto } from "@/lib/schema";

const INPUT =
  "w-full bg-[#f2f3ae]/[0.04] border border-[#f2f3ae]/15 px-3 py-2 text-sm text-[#f2f3ae] placeholder:text-[#edd382]/20 focus:outline-none focus:border-[#fc9e4f]/50";
const LABEL = "block font-mono text-xs text-[#edd382]/50 uppercase tracking-widest mb-1.5";

export default function GalleryPhotoForm({ photo }: { photo?: GalleryPhoto }) {
  const router = useRouter();
  const isEdit = !!photo;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(photo?.name ?? "");
  const [description, setDescription] = useState(photo?.description ?? "");
  const [imageUrl, setImageUrl] = useState(photo?.imageUrl ?? "");
  const [equipment, setEquipment] = useState(photo?.equipment ?? "");
  const [capturedAt, setCapturedAt] = useState(photo?.capturedAt ?? "");
  const [technique, setTechnique] = useState(photo?.technique ?? "");
  const [software, setSoftware] = useState(photo?.software ?? "");
  const [published, setPublished] = useState(photo?.published ?? true);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const blob = await upload(`gallery/${Date.now()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/gallery/upload",
      });
      setImageUrl(blob.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSave() {
    if (!name.trim()) { setError("Name is required."); return; }
    if (!imageUrl.trim()) { setError("An image is required."); return; }
    setSaving(true);
    setError("");
    const body = {
      name: name.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      equipment: equipment.trim(),
      capturedAt: capturedAt.trim(),
      technique: technique.trim(),
      software: software.trim(),
      published,
    };
    try {
      const res = await fetch(
        isEdit ? `/api/gallery/${photo!.id}` : "/api/gallery",
        { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );
      if (!res.ok) throw new Error(await res.text());
      router.push("/admin/dashboard/gallery");
    } catch {
      setError("Failed to save. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#020122] text-[#edd382]">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 border-b border-[#f2f3ae]/10 bg-[#020122]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link
            href="/admin/dashboard/gallery"
            className="flex items-center gap-2 font-mono text-xs text-[#edd382]/40 hover:text-[#fc9e4f] transition-colors shrink-0"
          >
            <ArrowLeft size={13} />
            Gallery
          </Link>
          <div className="flex items-center gap-3 min-w-0">
            {error && <span className="font-mono text-xs text-red-400 max-w-sm">{error}</span>}
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="flex items-center gap-2 font-mono text-xs text-[#020122] bg-[#fc9e4f] px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
            >
              <Save size={13} />
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Image upload */}
        <div className="space-y-3">
          <label className={LABEL}>Photo *</label>

          {imageUrl ? (
            <div className="relative group">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full max-h-80 object-cover border border-[#f2f3ae]/10"
              />
              <div className="absolute inset-0 bg-[#020122]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 font-mono text-xs text-[#020122] bg-[#fc9e4f] px-4 py-2 hover:opacity-90 disabled:opacity-40"
                >
                  <Upload size={13} />
                  {uploading ? "Uploading…" : "Replace"}
                </button>
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="flex items-center gap-2 font-mono text-xs text-[#f2f3ae] border border-[#f2f3ae]/30 px-4 py-2 hover:border-red-400/60 hover:text-red-400"
                >
                  <X size={13} />
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full h-48 border border-dashed border-[#f2f3ae]/20 flex flex-col items-center justify-center gap-3 hover:border-[#fc9e4f]/40 hover:bg-[#fc9e4f]/[0.03] transition-all disabled:opacity-40"
            >
              <Upload size={24} className="text-[#fc9e4f]/50" />
              <span className="font-mono text-xs text-[#edd382]/40">
                {uploading ? "Uploading…" : "Click to upload a photo"}
              </span>
              <span className="font-mono text-[10px] text-[#edd382]/25">JPEG · PNG · WebP · TIFF</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/tiff"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Manual URL fallback */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#edd382]/30 shrink-0">or paste URL</span>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="flex-1 bg-[#f2f3ae]/[0.04] border border-[#f2f3ae]/10 px-3 py-1.5 text-xs text-[#f2f3ae] placeholder:text-[#edd382]/20 focus:outline-none focus:border-[#fc9e4f]/40"
            />
          </div>
        </div>

        {/* Name */}
        <div>
          <label className={LABEL}>Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Carina Nebula — Cosmic Cliffs"
            className={INPUT}
          />
        </div>

        {/* Description */}
        <div>
          <label className={LABEL}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this image captures, the story behind it…"
            rows={3}
            className={`${INPUT} resize-y`}
          />
        </div>

        {/* Equipment */}
        <div>
          <label className={LABEL}>Equipment</label>
          <input
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            placeholder="Telescope: Redcat 51 · Camera: ASI2600MC · Mount: EQ6-R"
            className={INPUT}
          />
        </div>

        {/* Two-column row: Captured At + Technique */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Time of Capture</label>
            <input
              value={capturedAt}
              onChange={(e) => setCapturedAt(e.target.value)}
              placeholder="March 2025, Zurich"
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>Technique</label>
            <input
              value={technique}
              onChange={(e) => setTechnique(e.target.value)}
              placeholder="HOO narrowband · 120×300s"
              className={INPUT}
            />
          </div>
        </div>

        {/* Software */}
        <div>
          <label className={LABEL}>Software Used</label>
          <input
            value={software}
            onChange={(e) => setSoftware(e.target.value)}
            placeholder="PixInsight · Lightroom · Photoshop"
            className={INPUT}
          />
        </div>

        {/* Published toggle */}
        <div className="flex items-center justify-between border border-[#f2f3ae]/10 p-4">
          <div>
            <p className="text-sm font-semibold text-[#f2f3ae]">Published</p>
            <p className="font-mono text-xs text-[#edd382]/35 mt-0.5">Show in the public gallery</p>
          </div>
          <button
            type="button"
            onClick={() => setPublished((v) => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors ${published ? "bg-[#fc9e4f]" : "bg-[#f2f3ae]/15"}`}
            aria-label={published ? "Unpublish" : "Publish"}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-[#020122] transition-all duration-200 ${published ? "left-5" : "left-0.5"}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
