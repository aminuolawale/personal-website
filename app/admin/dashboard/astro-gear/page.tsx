"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Plus, Trash2, ExternalLink, ImageIcon, ChevronRight, ChevronDown, Scan, Pencil, X } from "lucide-react";
import { upload } from "@vercel/blob/client";
import type { AstroGear, GearImage } from "@/lib/schema";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

// ── Types ─────────────────────────────────────────────────────────────────────

type GearType = "equipment" | "software" | "technique";
type Marquee  = { x: number; y: number; w: number; h: number };

// A locally-staged image (not yet uploaded) held in the create form.
type StagedImage = {
  id: string;
  file: File;
  previewUrl: string;
  description: string;
  marquee: Marquee | null;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS: { id: GearType; label: string }[] = [
  { id: "equipment", label: "Equipment" },
  { id: "software",  label: "Software"  },
  { id: "technique", label: "Technique" },
];

const INPUT =
  "w-full bg-surface/[0.04] border border-surface/15 px-3 py-2 text-sm text-surface placeholder:text-muted/20 focus:outline-none focus:border-accent/50";

const INPUT_SM =
  "w-full bg-surface/[0.04] border border-surface/15 px-2 py-1.5 text-xs text-surface placeholder:text-muted/20 focus:outline-none focus:border-accent/50 font-mono";

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseMarquee(m: string | null | undefined): Marquee | null {
  if (!m) return null;
  try { return JSON.parse(m); } catch { return null; }
}

function linkLabel(type: GearType) {
  if (type === "equipment") return "Product Link";
  if (type === "software")  return "Website";
  return "Reference Link";
}

// ── Corner marks ──────────────────────────────────────────────────────────────

function CornerMarks({
  color = "rgba(255,200,100,0.95)",
  size  = 10,
  thick = 2,
}: {
  color?: string;
  size?:  number;
  thick?: number;
}) {
  const s = `${size}px`;
  const t = `${thick}px`;
  return (
    <>
      <span style={{ position:"absolute", top:0,    left:0,  width:s, height:s, borderTop:   `${t} solid ${color}`, borderLeft:  `${t} solid ${color}` }} />
      <span style={{ position:"absolute", top:0,    right:0, width:s, height:s, borderTop:   `${t} solid ${color}`, borderRight: `${t} solid ${color}` }} />
      <span style={{ position:"absolute", bottom:0, left:0,  width:s, height:s, borderBottom:`${t} solid ${color}`, borderLeft:  `${t} solid ${color}` }} />
      <span style={{ position:"absolute", bottom:0, right:0, width:s, height:s, borderBottom:`${t} solid ${color}`, borderRight: `${t} solid ${color}` }} />
    </>
  );
}

// ── Marquee editor (full-screen) ──────────────────────────────────────────────

function MarqueeEditorModal({
  imageUrl,
  initial,
  onSave,
  onClose,
}: {
  imageUrl: string;
  initial:  Marquee | null;
  onSave:   (m: Marquee | null) => void;
  onClose:  () => void;
}) {
  const containerRef              = useRef<HTMLDivElement>(null);
  const [drag, setDrag]           = useState<{ sx: number; sy: number; ex: number; ey: number } | null>(null);
  const [marquee, setMarquee]     = useState<Marquee | null>(initial);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toPercent(e: React.MouseEvent) {
    const r = containerRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, (e.clientX - r.left) / r.width  * 100)),
      y: Math.max(0, Math.min(100, (e.clientY - r.top)  / r.height * 100)),
    };
  }

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const p = toPercent(e);
    setDrag({ sx: p.x, sy: p.y, ex: p.x, ey: p.y });
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag) return;
    const p = toPercent(e);
    setDrag(d => d ? { ...d, ex: p.x, ey: p.y } : null);
  };
  const onMouseUp = () => {
    if (!drag) return;
    const w = Math.abs(drag.ex - drag.sx);
    const h = Math.abs(drag.ey - drag.sy);
    if (w > 1 && h > 1) setMarquee({ x: Math.min(drag.sx, drag.ex), y: Math.min(drag.sy, drag.ey), w, h });
    setDrag(null);
  };

  const preview: Marquee | null = drag
    ? { x: Math.min(drag.sx, drag.ex), y: Math.min(drag.sy, drag.ey), w: Math.abs(drag.ex - drag.sx), h: Math.abs(drag.ey - drag.sy) }
    : marquee;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-base">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface/10 shrink-0">
        <span className="font-mono text-xs text-muted/50 uppercase tracking-widest">Edit Marquee</span>
        <div className="flex gap-2">
          <button type="button" onClick={() => setMarquee(null)}
            className="font-mono text-xs text-red-400/60 hover:text-red-400 border border-surface/15 px-3 py-1.5 transition-colors">
            Clear
          </button>
          <button type="button" onClick={onClose}
            className="font-mono text-xs text-muted/40 hover:text-muted border border-surface/15 px-3 py-1.5 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={() => { onSave(marquee); onClose(); }}
            className="font-mono text-xs text-base bg-accent px-3 py-1.5 hover:opacity-90 transition-opacity">
            Save
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 overflow-hidden">
        <p className="font-mono text-[10px] text-muted/30 uppercase tracking-widest select-none shrink-0">
          Click and drag on the image to draw a selection area
        </p>
        <div className="flex items-center justify-center max-w-full max-h-full overflow-hidden">
          <div
            ref={containerRef}
            className="relative cursor-crosshair select-none"
            style={{ display: "inline-block", lineHeight: 0 }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" draggable={false}
              style={{ display: "block", maxHeight: "65vh", maxWidth: "80vw", objectFit: "contain" }} />
            {preview && preview.w > 0.5 && preview.h > 0.5 && (
              <div className="absolute pointer-events-none"
                style={{ left:`${preview.x}%`, top:`${preview.y}%`, width:`${preview.w}%`, height:`${preview.h}%` }}>
                <CornerMarks color="rgba(255,200,100,0.95)" size={14} thick={2} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Thumbnail picker (reused in create form and edit modal) ───────────────────

function ThumbnailPicker({
  preview,
  onFileChange,
  onClear,
}: {
  preview:      string | null;
  onFileChange: (file: File, previewUrl: string) => void;
  onClear:      () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-14 h-14 border border-surface/15 flex items-center justify-center shrink-0 bg-surface/[0.02] cursor-pointer hover:border-accent/40 transition-colors overflow-hidden"
        onClick={() => ref.current?.click()}
      >
        {preview
          ? <Image src={preview} alt="" width={56} height={56} className="w-full h-full object-cover" unoptimized />
          : <ImageIcon size={16} className="text-muted/20" />
        }
      </div>
      <div className="flex flex-col gap-1.5">
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) { onFileChange(f, URL.createObjectURL(f)); e.target.value = ""; }
          }}
        />
        <button type="button" onClick={() => ref.current?.click()}
          className="font-mono text-[10px] text-muted/40 hover:text-accent border border-surface/15 px-2 py-1 hover:border-accent/30 transition-colors self-start">
          {preview ? "Change" : "Choose image"}
        </button>
        {preview && (
          <button type="button" onClick={onClear}
            className="font-mono text-[10px] text-red-400/50 hover:text-red-400 transition-colors self-start">
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

// ── Staged image row (in create form, before any upload) ──────────────────────

function StagedImageRow({
  image,
  onRemove,
  onDescChange,
  onMarqueeChange,
}: {
  image:           StagedImage;
  onRemove:        (id: string) => void;
  onDescChange:    (id: string, desc: string) => void;
  onMarqueeChange: (id: string, m: Marquee | null) => void;
}) {
  const [editingMarquee, setEditingMarquee] = useState(false);

  return (
    <>
      <div className="flex items-start gap-3 py-3 border-b border-surface/[0.05] last:border-0">
        <div className="relative w-14 h-14 shrink-0 overflow-hidden border border-surface/10 cursor-default">
          <Image src={image.previewUrl} alt="" width={56} height={56} className="w-full h-full object-cover" unoptimized />
          {image.marquee && (
            <div className="absolute pointer-events-none"
              style={{ left:`${image.marquee.x}%`, top:`${image.marquee.y}%`, width:`${image.marquee.w}%`, height:`${image.marquee.h}%` }}>
              <CornerMarks size={6} thick={1.5} />
            </div>
          )}
        </div>
        <textarea
          value={image.description}
          onChange={e => onDescChange(image.id, e.target.value)}
          placeholder="Description…"
          rows={2}
          className={`flex-1 min-w-0 resize-none ${INPUT_SM}`}
        />
        <div className="flex flex-col gap-1 shrink-0">
          <button type="button" onClick={() => setEditingMarquee(true)}
            title={image.marquee ? "Edit marquee" : "Add marquee"}
            className={`p-1.5 transition-colors ${image.marquee ? "text-yellow-400/80 hover:text-yellow-400" : "text-muted/30 hover:text-muted/60"}`}>
            <Scan size={14} />
          </button>
          <button type="button" onClick={() => onRemove(image.id)}
            className="p-1.5 text-muted/30 hover:text-red-400 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {editingMarquee && (
        <MarqueeEditorModal
          imageUrl={image.previewUrl}
          initial={image.marquee}
          onSave={m => onMarqueeChange(image.id, m)}
          onClose={() => setEditingMarquee(false)}
        />
      )}
    </>
  );
}

// ── Existing image row (inside expand panel for a saved gear item) ─────────────

function GearImageRow({
  image,
  gearId,
  onDelete,
  onUpdate,
}: {
  image:    GearImage;
  gearId:   number;
  onDelete: (id: number) => void;
  onUpdate: (id: number, patch: Partial<GearImage>) => void;
}) {
  const [desc, setDesc]         = useState(image.description);
  const [editingMarquee, setEd] = useState(false);
  const marquee                 = parseMarquee(image.marquee);

  async function saveDescription() {
    if (desc === image.description) return;
    await fetch(`/api/astro-gear/${gearId}/images/${image.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: desc }),
    });
    onUpdate(image.id, { description: desc });
  }

  async function handleSaveMarquee(m: Marquee | null) {
    const marqueeStr = m ? JSON.stringify(m) : null;
    await fetch(`/api/astro-gear/${gearId}/images/${image.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marquee: marqueeStr }),
    });
    onUpdate(image.id, { marquee: marqueeStr });
  }

  return (
    <>
      <div className="flex items-start gap-3 py-3 border-b border-surface/[0.05] last:border-0">
        <div className="relative w-14 h-14 shrink-0 overflow-hidden border border-surface/10">
          <Image src={image.imageUrl} alt="" width={56} height={56} className="w-full h-full object-cover" />
          {marquee && (
            <div className="absolute pointer-events-none"
              style={{ left:`${marquee.x}%`, top:`${marquee.y}%`, width:`${marquee.w}%`, height:`${marquee.h}%` }}>
              <CornerMarks size={6} thick={1.5} />
            </div>
          )}
        </div>
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          onBlur={saveDescription}
          placeholder="Description…"
          rows={2}
          className={`flex-1 min-w-0 resize-none ${INPUT_SM}`}
        />
        <div className="flex flex-col gap-1 shrink-0">
          <button type="button" onClick={() => setEd(true)}
            title={marquee ? "Edit marquee" : "Add marquee"}
            className={`p-1.5 transition-colors ${marquee ? "text-yellow-400/80 hover:text-yellow-400" : "text-muted/30 hover:text-muted/60"}`}>
            <Scan size={14} />
          </button>
          <button type="button" onClick={() => onDelete(image.id)}
            className="p-1.5 text-muted/30 hover:text-red-400 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {editingMarquee && (
        <MarqueeEditorModal
          imageUrl={image.imageUrl}
          initial={marquee}
          onSave={handleSaveMarquee}
          onClose={() => setEd(false)}
        />
      )}
    </>
  );
}

// ── Images panel (expand section under a saved equipment item) ────────────────

function GearImagePanel({ gearId }: { gearId: number }) {
  const [images, setImages]     = useState<GearImage[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [newFile, setNewFile]   = useState<File | null>(null);
  const [newPreview, setNewPrev] = useState<string | null>(null);
  const [newDesc, setNewDesc]   = useState("");
  const [uploading, setUploading] = useState(false);
  const [addError, setAddError] = useState("");
  const fileRef                 = useRef<HTMLInputElement>(null);

  const loadImages = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/astro-gear/${gearId}/images`, { cache: "no-store" });
      const data = await res.json();
      setImages(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  }, [gearId]);

  useEffect(() => { loadImages(); }, [loadImages]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newFile) return;
    setUploading(true); setAddError("");
    try {
      const blob = await upload(newFile.name, newFile, { access: "public", handleUploadUrl: "/api/astro-gear/upload" });
      const res  = await fetch(`/api/astro-gear/${gearId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: blob.url, description: newDesc, position: images.length }),
      });
      if (!res.ok) throw new Error("Failed to add image");
      const newImg = await res.json();
      setImages(prev => [...prev, newImg]);
      setNewFile(null); setNewPrev(null); setNewDesc(""); setShowAdd(false);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Upload failed");
    } finally { setUploading(false); }
  }

  function handleDelete(imageId: number) {
    if (!confirm("Remove this image?")) return;
    fetch(`/api/astro-gear/${gearId}/images/${imageId}`, { method: "DELETE" });
    setImages(prev => prev.filter(i => i.id !== imageId));
  }

  function handleUpdate(imageId: number, patch: Partial<GearImage>) {
    setImages(prev => prev.map(i => i.id === imageId ? { ...i, ...patch } : i));
  }

  return (
    <div className="ml-12 mb-2 border border-surface/10 bg-surface/[0.01]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-surface/[0.06]">
        <span className="font-mono text-[10px] text-muted/40 uppercase tracking-widest">
          Images{!loading && ` (${images.length})`}
        </span>
        <button type="button"
          onClick={() => { setShowAdd(s => !s); setAddError(""); }}
          className="flex items-center gap-1 font-mono text-[10px] text-accent/60 hover:text-accent transition-colors">
          <Plus size={10} /> Add image
        </button>
      </div>

      {loading
        ? <p className="font-mono text-[10px] text-muted/25 px-4 py-3">Loading…</p>
        : (
          <div className="px-4">
            {images.length === 0 && !showAdd && (
              <p className="font-mono text-[10px] text-muted/25 py-4 text-center">No images yet</p>
            )}
            {images.map(img => (
              <GearImageRow key={img.id} image={img} gearId={gearId} onDelete={handleDelete} onUpdate={handleUpdate} />
            ))}
          </div>
        )
      }

      {showAdd && (
        <form onSubmit={handleAdd} className="border-t border-surface/[0.06] px-4 py-3 space-y-3">
          <div className="flex items-start gap-3">
            <div
              className="w-14 h-14 border border-surface/15 flex items-center justify-center shrink-0 cursor-pointer hover:border-accent/40 transition-colors overflow-hidden bg-surface/[0.02]"
              onClick={() => fileRef.current?.click()}>
              {newPreview
                ? <Image src={newPreview} alt="" width={56} height={56} className="w-full h-full object-cover" unoptimized />
                : <ImageIcon size={16} className="text-muted/20" />
              }
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0] ?? null;
                  setNewFile(f); setNewPrev(f ? URL.createObjectURL(f) : null);
                }} />
              <button type="button" onClick={() => fileRef.current?.click()}
                className="font-mono text-[10px] text-muted/40 hover:text-accent border border-surface/15 px-2 py-1 hover:border-accent/30 transition-colors">
                {newFile ? "Change image" : "Choose image"}
              </button>
              <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)}
                placeholder="Description (optional)" rows={2}
                className={`w-full resize-none ${INPUT_SM}`} />
            </div>
          </div>
          {addError && <p className="font-mono text-[10px] text-red-400">{addError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button"
              onClick={() => { setShowAdd(false); setNewFile(null); setNewPrev(null); setNewDesc(""); setAddError(""); }}
              className="font-mono text-[10px] text-muted/40 hover:text-muted border border-surface/15 px-3 py-1.5 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!newFile || uploading}
              className="font-mono text-[10px] text-base bg-accent px-3 py-1.5 disabled:opacity-40 hover:opacity-90 transition-opacity">
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────

function EditGearModal({
  item,
  onClose,
  onSaved,
}: {
  item:    AstroGear;
  onClose: () => void;
  onSaved: (updated: AstroGear) => void;
}) {
  const [name, setName]                 = useState(item.name);
  const [link, setLink]                 = useState(item.link ?? "");
  const [thumbPreview, setThumbPreview] = useState<string | null>(item.imageUrl ?? null);
  const [thumbFile, setThumbFile]       = useState<File | null>(null);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true); setError("");
    try {
      const body: Record<string, unknown> = { name: name.trim(), link: link.trim() || null };

      if (item.type === "equipment") {
        if (thumbFile) {
          const blob  = await upload(thumbFile.name, thumbFile, { access: "public", handleUploadUrl: "/api/astro-gear/upload" });
          body.imageUrl = blob.url;
        } else if (!thumbPreview && item.imageUrl) {
          // user cleared the thumbnail
          body.imageUrl = null;
        }
      }

      const res = await fetch(`/api/astro-gear/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to save");
      }
      onSaved(await res.json());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-base/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-base border border-surface/15 max-w-sm w-full shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface/10">
          <span className="font-mono text-xs text-muted/50 uppercase tracking-widest">
            Edit {item.type}
          </span>
          <button onClick={onClose} className="p-1 text-muted/40 hover:text-muted transition-colors">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="font-mono text-[10px] text-muted/40 uppercase tracking-widest block mb-1">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className={INPUT} required />
          </div>

          <div>
            <label className="font-mono text-[10px] text-muted/40 uppercase tracking-widest block mb-1">
              {linkLabel(item.type as GearType)}
            </label>
            <input value={link} onChange={e => setLink(e.target.value)} placeholder="https://" type="url" className={INPUT} />
          </div>

          {item.type === "equipment" && (
            <div>
              <label className="font-mono text-[10px] text-muted/40 uppercase tracking-widest block mb-1">Thumbnail</label>
              <ThumbnailPicker
                preview={thumbPreview}
                onFileChange={(f, url) => { setThumbFile(f); setThumbPreview(url); }}
                onClear={() => { setThumbFile(null); setThumbPreview(null); }}
              />
            </div>
          )}

          {error && <p className="font-mono text-[10px] text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="font-mono text-xs text-muted/40 hover:text-muted border border-surface/15 px-3 py-1.5 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving || !name.trim()}
              className="font-mono text-xs text-base bg-accent px-4 py-1.5 disabled:opacity-40 hover:opacity-90 transition-opacity">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AstroGearPage() {
  const [tab, setTab]               = useState<GearType>("equipment");
  const [items, setItems]           = useState<AstroGear[]>([]);
  const [loading, setLoading]       = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<AstroGear | null>(null);
  const [error, setError]           = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Create form state
  const [newName, setNewName]           = useState("");
  const [newLink, setNewLink]           = useState("");
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [thumbFile, setThumbFile]       = useState<File | null>(null);
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
  const [publishAsUpdate, setPublish]   = useState(false);
  const [adding, setAdding]             = useState(false);
  const [addProgress, setAddProgress]   = useState("");

  // Hidden file input to trigger when user clicks "Add image" in create form
  const stagedFileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/astro-gear?type=${tab}`, { cache: "no-store" });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  }, [tab]);

  useEffect(() => {
    load();
    resetCreateForm();
    setExpandedId(null);
    setError("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  function resetCreateForm() {
    setNewName(""); setNewLink("");
    setThumbFile(null); setThumbPreview(null);
    setStagedImages([]);
    setPublish(false);
  }

  // Add a staged image entry when user selects a file
  function onStagedFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStagedImages(prev => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, file, previewUrl: URL.createObjectURL(file), description: "", marquee: null },
    ]);
    e.target.value = ""; // reset so same file can be picked again
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true); setError("");
    try {
      // 1. Upload thumbnail
      let imageUrl: string | null = null;
      if (tab === "equipment" && thumbFile) {
        setAddProgress("Uploading thumbnail…");
        const blob = await upload(thumbFile.name, thumbFile, { access: "public", handleUploadUrl: "/api/astro-gear/upload" });
        imageUrl = blob.url;
      }

      // 2. Create gear item
      setAddProgress("Saving…");
      const res = await fetch("/api/astro-gear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: tab, name: newName.trim(), imageUrl, link: newLink.trim() || null, publishAsUpdate }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to add");
      }
      const newItem: AstroGear = await res.json();

      // 3. Upload and link staged images (equipment only)
      for (let i = 0; i < stagedImages.length; i++) {
        const staged = stagedImages[i];
        setAddProgress(`Uploading image ${i + 1} of ${stagedImages.length}…`);
        const blob = await upload(staged.file.name, staged.file, { access: "public", handleUploadUrl: "/api/astro-gear/upload" });
        await fetch(`/api/astro-gear/${newItem.id}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl: blob.url,
            description: staged.description,
            marquee: staged.marquee ? JSON.stringify(staged.marquee) : null,
            position: i,
          }),
        });
      }

      resetCreateForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setAdding(false); setAddProgress("");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Remove this item?")) return;
    setDeletingId(id); setError("");
    try {
      const res = await fetch(`/api/astro-gear/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to delete");
      }
      setItems(prev => prev.filter(i => i.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally { setDeletingId(null); }
  }

  return (
    <div className="min-h-screen bg-base text-muted">
      <AdminPageHeader title="Gear Library" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`font-mono text-xs px-3 py-1.5 border transition-all ${
                tab === t.id ? "bg-accent text-base border-accent" : "text-muted/50 border-surface/15 hover:border-accent/40"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Create form ── */}
        <form onSubmit={handleAdd} className="space-y-4 mb-8 border border-surface/10 p-5">
          <p className="font-mono text-[10px] text-muted/40 uppercase tracking-widest -mb-1">
            Add {tab}
          </p>

          <div>
            <label className="font-mono text-[10px] text-muted/40 uppercase tracking-widest block mb-1">Name</label>
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder={
                tab === "equipment" ? "e.g. William Optics Redcat 51"
                : tab === "software" ? "e.g. PixInsight"
                : "e.g. HOO narrowband · 120×300s"
              }
              className={INPUT} />
          </div>

          <div>
            <label className="font-mono text-[10px] text-muted/40 uppercase tracking-widest block mb-1">
              {linkLabel(tab)}
            </label>
            <input value={newLink} onChange={e => setNewLink(e.target.value)}
              placeholder="https://" type="url" className={INPUT} />
          </div>

          {tab === "equipment" && (
            <>
              <div>
                <label className="font-mono text-[10px] text-muted/40 uppercase tracking-widest block mb-2">Thumbnail (optional)</label>
                <ThumbnailPicker
                  preview={thumbPreview}
                  onFileChange={(f, url) => { setThumbFile(f); setThumbPreview(url); }}
                  onClear={() => { setThumbFile(null); setThumbPreview(null); }}
                />
              </div>

              {/* Staged images */}
              <div className="border-t border-surface/[0.07] pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[10px] text-muted/40 uppercase tracking-widest">
                    Images{stagedImages.length > 0 && ` (${stagedImages.length})`}
                  </label>
                  <button type="button" onClick={() => stagedFileRef.current?.click()}
                    className="flex items-center gap-1 font-mono text-[10px] text-accent/60 hover:text-accent transition-colors">
                    <Plus size={10} /> Add image
                  </button>
                  <input ref={stagedFileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={onStagedFileChange} className="hidden" />
                </div>

                {stagedImages.length === 0 && (
                  <p className="font-mono text-[10px] text-muted/25 text-center py-2">
                    No images added — click &#34;Add image&#34; to attach photos
                  </p>
                )}

                {stagedImages.map(img => (
                  <StagedImageRow
                    key={img.id}
                    image={img}
                    onRemove={id => setStagedImages(prev => prev.filter(i => i.id !== id))}
                    onDescChange={(id, desc) => setStagedImages(prev => prev.map(i => i.id === id ? { ...i, description: desc } : i))}
                    onMarqueeChange={(id, m) => setStagedImages(prev => prev.map(i => i.id === id ? { ...i, marquee: m } : i))}
                  />
                ))}
              </div>
            </>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-surface/[0.07]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={publishAsUpdate} onChange={e => setPublish(e.target.checked)} className="accent-accent" />
              <span className="font-mono text-xs text-muted/50">Publish as update</span>
            </label>
            <button type="submit" disabled={adding || !newName.trim()}
              className="flex items-center gap-2 font-mono text-xs text-base bg-accent px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-40">
              <Plus size={13} />
              {addProgress || (adding ? "Working…" : "Add")}
            </button>
          </div>
        </form>

        {error && <p className="font-mono text-xs text-red-400 mb-4">{error}</p>}

        {/* ── Item list ── */}
        {loading ? (
          <p className="font-mono text-xs text-muted/30 py-8 text-center">Loading…</p>
        ) : items.length === 0 ? (
          <div className="py-16 text-center border border-surface/10">
            <p className="font-mono text-sm text-muted/30">No {tab} entries yet.</p>
          </div>
        ) : (
          <div>
            {items.map(item => (
              <div key={item.id}>
                <div className="py-3 flex items-center gap-3 hover:bg-surface/[0.015] -mx-3 px-3 transition-colors">
                  {/* Thumbnail */}
                  {item.imageUrl ? (
                    <div className="w-9 h-9 shrink-0 overflow-hidden border border-surface/10">
                      <Image src={item.imageUrl} alt={item.name} width={36} height={36} className="w-full h-full object-cover" />
                    </div>
                  ) : tab === "equipment" ? (
                    <div className="w-9 h-9 shrink-0 border border-surface/10 flex items-center justify-center">
                      <ImageIcon size={13} className="text-muted/20" />
                    </div>
                  ) : null}

                  {/* Name + link */}
                  <div className="flex-1 min-w-0">
                    <span className="text-surface text-sm">{item.name}</span>
                    {item.link && <p className="font-mono text-[10px] text-muted/30 truncate mt-0.5">{item.link}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    {/* Images expand toggle (equipment only) */}
                    {tab === "equipment" && (
                      <button onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                        className="p-1.5 text-muted/30 hover:text-accent transition-colors" title="Manage images">
                        {expandedId === item.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    )}
                    {/* External link */}
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 text-muted/30 hover:text-accent transition-colors" title="Open link">
                        <ExternalLink size={13} />
                      </a>
                    )}
                    {/* Edit */}
                    <button onClick={() => setEditingItem(item)}
                      className="p-1.5 text-muted/30 hover:text-accent transition-colors" title="Edit">
                      <Pencil size={13} />
                    </button>
                    {/* Delete */}
                    <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}
                      className="p-1.5 text-muted/40 hover:text-red-400 transition-colors disabled:opacity-40">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {tab === "equipment" && expandedId === item.id && (
                  <GearImagePanel gearId={item.id} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingItem && (
        <EditGearModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={updated => {
            setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}
