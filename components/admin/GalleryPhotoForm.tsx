"use client";

import { useState, useRef, useEffect } from "react";
import { useUnsavedChangesGuard } from "@/lib/hooks/use-unsaved-changes-guard";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Upload, X, LayoutTemplate, Plus } from "lucide-react";
import Link from "next/link";
import { upload } from "@vercel/blob/client";
import type { GalleryPhoto, AstroGear } from "@/lib/schema";

const INPUT =
  "w-full bg-surface/[0.04] border border-surface/15 px-3 py-2 text-sm text-surface placeholder:text-muted/20 focus:outline-none focus:border-accent/50";
const LABEL = "block font-mono text-xs text-muted/50 uppercase tracking-widest mb-1.5";

function GearMultiSelect({
  items,
  selected,
  onChange,
  placeholder,
}: {
  items: AstroGear[];
  selected: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  function toggle(name: string) {
    onChange(
      selected.includes(name) ? selected.filter((s) => s !== name) : [...selected, name]
    );
  }

  if (items.length === 0) {
    return (
      <p className="font-mono text-xs text-muted/30">
        No entries yet — add them in{" "}
        <Link href="/admin/dashboard/astro-gear" className="text-accent hover:underline">
          Gear Library
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = selected.includes(item.name);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => toggle(item.name)}
            className={`font-mono text-xs px-3 py-1.5 border transition-all ${
              active
                ? "bg-accent text-base border-accent"
                : "text-muted/60 border-surface/20 hover:border-accent/40"
            }`}
          >
            {item.name}
          </button>
        );
      })}
      {selected.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="font-mono text-[10px] text-muted/30 hover:text-red-400 transition-colors px-1"
        >
          clear
        </button>
      )}
    </div>
  );
}

function splitValues(raw: string): string[] {
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export default function GalleryPhotoForm({ photo }: { photo?: GalleryPhoto }) {
  const router = useRouter();
  const isEdit = !!photo;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(photo?.name ?? "");
  const [description, setDescription] = useState(photo?.description ?? "");
  const [imageUrl, setImageUrl] = useState(photo?.imageUrl ?? "");
  const [additionalImages, setAdditionalImages] = useState<string[]>(photo?.additionalImages ?? []);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);
  const [additionalUploading, setAdditionalUploading] = useState(false);
  const [capturedAt, setCapturedAt] = useState(photo?.capturedAt ?? "");
  const [published, setPublished] = useState(photo?.published ?? true);

  // Gear selections
  const [equipmentItems, setEquipmentItems] = useState<AstroGear[]>([]);
  const [softwareItems, setSoftwareItems] = useState<AstroGear[]>([]);
  const [techniqueItems, setTechniqueItems] = useState<AstroGear[]>([]);

  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(
    splitValues(photo?.equipment ?? "")
  );
  const [selectedSoftware, setSelectedSoftware] = useState<string[]>(
    splitValues(photo?.software ?? "")
  );
  const [selectedTechnique, setSelectedTechnique] = useState<string[]>(
    splitValues(photo?.technique ?? "")
  );

  const [publishAsUpdate, setPublishAsUpdate] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { clearDirty } = useUnsavedChangesGuard([
    name, description, imageUrl, capturedAt, published,
    JSON.stringify(selectedEquipment), JSON.stringify(selectedSoftware), JSON.stringify(selectedTechnique),
    JSON.stringify(additionalImages),
  ]);

  useEffect(() => {
    async function loadGear() {
      const [eq, sw, te] = await Promise.all([
        fetch("/api/astro-gear?type=equipment").then((r) => r.json()),
        fetch("/api/astro-gear?type=software").then((r) => r.json()),
        fetch("/api/astro-gear?type=technique").then((r) => r.json()),
      ]);
      setEquipmentItems(Array.isArray(eq) ? eq : []);
      setSoftwareItems(Array.isArray(sw) ? sw : []);
      setTechniqueItems(Array.isArray(te) ? te : []);
    }
    loadGear();
  }, []);

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

  async function handleAdditionalFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAdditionalUploading(true);
    setError("");
    try {
      const blob = await upload(`gallery/${Date.now()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/gallery/upload",
      });
      setAdditionalImages((prev) => [...prev, blob.url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setAdditionalUploading(false);
      if (additionalFileInputRef.current) additionalFileInputRef.current.value = "";
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
      additionalImages: additionalImages.length > 0 ? additionalImages : null,
      equipment: selectedEquipment.join(", "),
      capturedAt: capturedAt.trim(),
      technique: selectedTechnique.join(", "),
      software: selectedSoftware.join(", "),
      published,
      ...(isEdit ? {} : { publishAsUpdate }),
    };
    try {
      const res = await fetch(
        isEdit ? `/api/gallery/${photo!.id}` : "/api/gallery",
        { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );
      if (!res.ok) throw new Error(await res.text());
      clearDirty();
      router.push("/admin/dashboard/gallery");
    } catch {
      setError("Failed to save. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-base text-muted">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 border-b border-surface/10 bg-base">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link
            href="/admin/dashboard/gallery"
            className="flex items-center gap-2 font-mono text-xs text-muted/40 hover:text-accent transition-colors shrink-0"
          >
            <ArrowLeft size={13} />
            Gallery
          </Link>
          <div className="flex items-center gap-3 min-w-0">
            {error && <span className="font-mono text-xs text-red-400 max-w-sm">{error}</span>}
            <button
              type="button"
              onClick={() => setPreviewMode((v) => !v)}
              className={`flex items-center gap-1.5 font-mono text-xs px-3 py-2 border transition-all ${
                previewMode
                  ? "text-base bg-accent/80 border-accent/80"
                  : "text-muted/40 border-surface/15 hover:border-accent/40"
              } shrink-0`}
            >
              <LayoutTemplate size={13} />
              {previewMode ? "Edit" : "Preview"}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="flex items-center gap-2 font-mono text-xs text-base bg-accent px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
            >
              <Save size={13} />
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      {previewMode && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="border border-surface/10 bg-surface/[0.015] px-4 py-2 mb-6 font-mono text-[10px] text-muted/30 uppercase tracking-widest">
            Preview
          </div>
          <div className="border border-surface/10 bg-surface/[0.02] overflow-hidden">
            {imageUrl ? (
              <img src={imageUrl} alt={name} className="w-full max-h-80 object-cover" />
            ) : (
              <div className="w-full h-48 bg-surface/5 flex items-center justify-center">
                <span className="font-mono text-xs text-muted/20">No image yet</span>
              </div>
            )}
            <div className="p-5 space-y-2">
              <h2 className="text-base font-semibold text-surface">{name || <span className="text-muted/25 italic">Untitled</span>}</h2>
              {description && <p className="text-sm text-muted/55 leading-relaxed">{description}</p>}
              {capturedAt && <p className="font-mono text-[11px] text-muted/30">{capturedAt}</p>}
              {(selectedEquipment.length > 0 || selectedTechnique.length > 0 || selectedSoftware.length > 0) && (
                <div className="pt-1 space-y-1">
                  {selectedEquipment.length > 0 && (
                    <p className="font-mono text-[10px] text-muted/35">
                      <span className="text-muted/20">Equipment: </span>{selectedEquipment.join(", ")}
                    </p>
                  )}
                  {selectedTechnique.length > 0 && (
                    <p className="font-mono text-[10px] text-muted/35">
                      <span className="text-muted/20">Technique: </span>{selectedTechnique.join(", ")}
                    </p>
                  )}
                  {selectedSoftware.length > 0 && (
                    <p className="font-mono text-[10px] text-muted/35">
                      <span className="text-muted/20">Software: </span>{selectedSoftware.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6 ${previewMode ? "hidden" : ""}`}>

        {/* Image upload */}
        <div className="space-y-3">
          <label className={LABEL}>Photo *</label>

          {imageUrl ? (
            <div className="flex items-center gap-3 border border-surface/10 bg-surface/[0.02] p-2">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-16 h-16 object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[10px] text-muted/35 truncate">{imageUrl.split("/").pop()}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 font-mono text-xs text-muted/50 border border-surface/15 px-2.5 py-1 hover:border-accent/40 hover:text-accent transition-all disabled:opacity-40"
                >
                  <Upload size={11} />
                  {uploading ? "Uploading…" : "Replace"}
                </button>
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="p-1 text-muted/30 hover:text-red-400 transition-colors"
                  aria-label="Remove"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full h-48 border border-dashed border-surface/20 flex flex-col items-center justify-center gap-3 hover:border-accent/40 hover:bg-accent/[0.03] transition-all disabled:opacity-40"
            >
              <Upload size={24} className="text-accent/50" />
              <span className="font-mono text-xs text-muted/40">
                {uploading ? "Uploading…" : "Click to upload a photo"}
              </span>
              <span className="font-mono text-[10px] text-muted/25">JPEG · PNG · WebP · TIFF</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/tiff"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted/30 shrink-0">or paste URL</span>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="flex-1 bg-surface/[0.04] border border-surface/10 px-3 py-1.5 text-xs text-surface placeholder:text-muted/20 focus:outline-none focus:border-accent/40"
            />
          </div>
        </div>

        {/* Additional images */}
        <div className="space-y-3">
          <label className={LABEL}>Additional Images</label>
          {additionalImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {additionalImages.map((url, i) => (
                <div key={i} className="relative group shrink-0">
                  <img
                    src={url}
                    alt={`Additional ${i + 1}`}
                    className="w-16 h-16 object-cover border border-surface/10"
                  />
                  <button
                    type="button"
                    onClick={() => setAdditionalImages((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 p-0.5 bg-base/80 text-muted/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove image"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => additionalFileInputRef.current?.click()}
            disabled={additionalUploading}
            className="flex items-center gap-2 font-mono text-xs text-muted/50 border border-dashed border-surface/20 px-4 py-2.5 hover:border-accent/40 hover:text-accent transition-all disabled:opacity-40"
          >
            <Plus size={13} />
            {additionalUploading ? "Uploading…" : "Add another image"}
          </button>
          <input
            ref={additionalFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/tiff"
            className="hidden"
            onChange={handleAdditionalFileChange}
          />
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

        {/* Equipment — multi-select */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={LABEL.replace("mb-1.5", "")}>Equipment</label>
            <Link
              href="/admin/dashboard/astro-gear"
              className="font-mono text-[10px] text-muted/30 hover:text-accent transition-colors"
            >
              Manage →
            </Link>
          </div>
          <GearMultiSelect
            items={equipmentItems}
            selected={selectedEquipment}
            onChange={setSelectedEquipment}
            placeholder="equipment"
          />
          {selectedEquipment.length > 0 && (
            <p className="font-mono text-[10px] text-muted/25 mt-2">
              Saved as: {selectedEquipment.join(", ")}
            </p>
          )}
        </div>

        {/* Captured At — datetime picker */}
        <div>
          <label className={LABEL}>Time of Capture</label>
          <input
            type="datetime-local"
            value={capturedAt}
            onChange={(e) => setCapturedAt(e.target.value)}
            className={INPUT + " [color-scheme:dark]"}
          />
        </div>

        {/* Technique — multi-select */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={LABEL.replace("mb-1.5", "")}>Technique</label>
            <Link
              href="/admin/dashboard/astro-gear"
              className="font-mono text-[10px] text-muted/30 hover:text-accent transition-colors"
            >
              Manage →
            </Link>
          </div>
          <GearMultiSelect
            items={techniqueItems}
            selected={selectedTechnique}
            onChange={setSelectedTechnique}
            placeholder="technique"
          />
          {selectedTechnique.length > 0 && (
            <p className="font-mono text-[10px] text-muted/25 mt-2">
              Saved as: {selectedTechnique.join(", ")}
            </p>
          )}
        </div>

        {/* Software — multi-select */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={LABEL.replace("mb-1.5", "")}>Software</label>
            <Link
              href="/admin/dashboard/astro-gear"
              className="font-mono text-[10px] text-muted/30 hover:text-accent transition-colors"
            >
              Manage →
            </Link>
          </div>
          <GearMultiSelect
            items={softwareItems}
            selected={selectedSoftware}
            onChange={setSelectedSoftware}
            placeholder="software"
          />
          {selectedSoftware.length > 0 && (
            <p className="font-mono text-[10px] text-muted/25 mt-2">
              Saved as: {selectedSoftware.join(", ")}
            </p>
          )}
        </div>

        {/* Publish as Update (new items only) */}
        {!isEdit && (
          <div className="flex items-center justify-between border border-surface/10 p-4">
            <div>
              <p className="text-sm font-semibold text-surface">Publish as Update</p>
              <p className="font-mono text-xs text-muted/35 mt-0.5">Add to the Updates feed on the homepage</p>
            </div>
            <button
              type="button"
              onClick={() => setPublishAsUpdate((v) => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${publishAsUpdate ? "bg-accent" : "bg-surface/15"}`}
              aria-label={publishAsUpdate ? "Remove from updates" : "Add to updates"}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-base transition-all duration-200 ${publishAsUpdate ? "left-5" : "left-0.5"}`} />
            </button>
          </div>
        )}

        {/* Published toggle */}
        <div className="flex items-center justify-between border border-surface/10 p-4">
          <div>
            <p className="text-sm font-semibold text-surface">Published</p>
            <p className="font-mono text-xs text-muted/35 mt-0.5">Show in the public gallery</p>
          </div>
          <button
            type="button"
            onClick={() => setPublished((v) => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors ${published ? "bg-accent" : "bg-surface/15"}`}
            aria-label={published ? "Unpublish" : "Publish"}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-base transition-all duration-200 ${published ? "left-5" : "left-0.5"}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
