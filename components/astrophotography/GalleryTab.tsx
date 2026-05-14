"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { X, Calendar, Cpu, Layers, Wrench, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import type { GalleryPhoto } from "@/lib/schema";

function formatCapturedAt(raw: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleString("en-US", {
    year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className="text-accent/60 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="font-mono text-[10px] text-muted/40 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-muted/80 text-sm leading-relaxed">{value}</p>
      </div>
    </div>
  );
}

function Lightbox({ photo, onClose }: { photo: GalleryPhoto; onClose: () => void }) {
  const images = [photo.imageUrl, ...(photo.additionalImages ?? [])];
  const [currentIdx, setCurrentIdx] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setCurrentIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setCurrentIdx((i) => Math.min(images.length - 1, i + 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, images.length]);

  function handleImageClick() {
    const el = imgRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen?.();
    }
  }

  return (
    <m.div
      className="fixed inset-0 z-50 flex items-stretch"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-base/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <m.div
        className="relative z-10 flex flex-col lg:flex-row w-full max-w-6xl mx-auto my-4 sm:my-8 overflow-hidden"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Image area */}
        <div className="lg:flex-1 bg-base flex flex-col items-center justify-center overflow-hidden gap-3 p-2">
          {/* Image + fullscreen trigger */}
          <div className="relative group flex items-center justify-center w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={images[currentIdx]}
              alt={photo.name}
              className="max-w-full max-h-[55vh] lg:max-h-[80vh] w-auto object-contain cursor-zoom-in"
              onClick={handleImageClick}
            />
            <button
              onClick={handleImageClick}
              className="absolute top-2 right-2 p-1.5 bg-base/60 text-muted/50 hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="View fullscreen"
            >
              <Maximize2 size={14} />
            </button>
          </div>

          {/* Multi-image navigation */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 pb-1">
              <button
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
                className="p-1 text-muted/40 hover:text-accent disabled:opacity-20 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i === currentIdx ? "bg-accent" : "bg-surface/30 hover:bg-surface/60"
                    }`}
                    aria-label={`Image ${i + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setCurrentIdx((i) => Math.min(images.length - 1, i + 1))}
                disabled={currentIdx === images.length - 1}
                className="p-1 text-muted/40 hover:text-accent disabled:opacity-20 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Details sidebar */}
        <div className="lg:w-80 xl:w-96 bg-base border-t lg:border-t-0 lg:border-l border-surface/20 flex flex-col overflow-y-auto shrink-0">
          <div className="flex items-start justify-between p-5 border-b border-surface/10">
            <div>
              <h2 className="text-surface font-bold text-lg leading-tight">{photo.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-muted/40 hover:text-accent transition-colors ml-4 shrink-0 mt-0.5"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-5 flex-1">
            {photo.description && (
              <p className="text-muted/65 text-sm leading-relaxed">{photo.description}</p>
            )}

            <div className="space-y-4 pt-1">
              <MetaRow icon={<Cpu size={14} />} label="Equipment" value={photo.equipment} />
              <MetaRow icon={<Calendar size={14} />} label="Captured" value={formatCapturedAt(photo.capturedAt)} />
              <MetaRow icon={<Layers size={14} />} label="Technique" value={photo.technique} />
              <MetaRow icon={<Wrench size={14} />} label="Software" value={photo.software} />
            </div>
          </div>
        </div>
      </m.div>

      {/* Close button (top-right) */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 text-muted/40 hover:text-accent transition-colors"
        aria-label="Close"
      >
        <X size={22} />
      </button>
    </m.div>
  );
}

export default function GalleryTab() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GalleryPhoto | null>(null);

  useEffect(() => {
    fetch("/api/gallery")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setPhotos(Array.isArray(data) ? data : []))
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  }, []);

  const handleClose = useCallback(() => setSelected(null), []);

  if (loading) {
    return <p className="font-mono text-xs text-muted/30 py-16 text-center">Loading…</p>;
  }

  if (photos.length === 0) {
    return (
      <p className="font-mono text-sm text-muted/30 py-16 text-center">
        No photos published yet.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((photo, i) => (
          <m.button
            key={photo.id}
            className="w-full block group relative overflow-hidden cursor-pointer focus:outline-none aspect-square"
            onClick={() => setSelected(photo)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
          >
            <Image
              src={photo.imageUrl}
              alt={photo.name}
              fill
              sizes="(min-width: 640px) 33vw, 50vw"
              className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-base/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
              <p className="text-surface font-semibold text-sm text-left leading-tight">{photo.name}</p>
            </div>
            {/* Multi-image indicator */}
            {(photo.additionalImages?.length ?? 0) > 0 && (
              <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {Array.from({ length: Math.min((photo.additionalImages?.length ?? 0) + 1, 4) }).map((_, i) => (
                  <span key={i} className="w-1 h-1 rounded-full bg-white/70" />
                ))}
              </div>
            )}
          </m.button>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && <Lightbox photo={selected} onClose={handleClose} />}
      </AnimatePresence>
    </>
  );
}
