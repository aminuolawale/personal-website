"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Calendar, Cpu, Layers, Wrench } from "lucide-react";
import {m, AnimatePresence} from "framer-motion";
import type { GalleryPhoto } from "@/lib/schema";

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className="text-[#fc9e4f]/60 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="font-mono text-[10px] text-[#edd382]/40 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-[#edd382]/80 text-sm leading-relaxed">{value}</p>
      </div>
    </div>
  );
}

function Lightbox({ photo, onClose }: { photo: GalleryPhoto; onClose: () => void }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

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
        className="absolute inset-0 bg-[#020122]/90 backdrop-blur-sm"
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
        {/* Image */}
        <div className="flex-1 bg-[#020122] flex items-center justify-center min-h-0 overflow-hidden">
          <img
            src={photo.imageUrl}
            alt={photo.name}
            className="w-full h-full object-contain max-h-[60vh] lg:max-h-full"
          />
        </div>

        {/* Details sidebar */}
        <div className="lg:w-80 xl:w-96 bg-[#04033a] border-t lg:border-t-0 lg:border-l border-[#f2f3ae]/10 flex flex-col overflow-y-auto shrink-0">
          <div className="flex items-start justify-between p-5 border-b border-[#f2f3ae]/10">
            <div>
              <h2 className="text-[#f2f3ae] font-bold text-lg leading-tight">{photo.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-[#edd382]/40 hover:text-[#fc9e4f] transition-colors ml-4 shrink-0 mt-0.5"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-5 flex-1">
            {photo.description && (
              <p className="text-[#edd382]/65 text-sm leading-relaxed">{photo.description}</p>
            )}

            <div className="space-y-4 pt-1">
              <MetaRow icon={<Cpu size={14} />} label="Equipment" value={photo.equipment} />
              <MetaRow icon={<Calendar size={14} />} label="Captured" value={photo.capturedAt} />
              <MetaRow icon={<Layers size={14} />} label="Technique" value={photo.technique} />
              <MetaRow icon={<Wrench size={14} />} label="Software" value={photo.software} />
            </div>
          </div>
        </div>
      </m.div>

      {/* Close button (top-right) */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 text-[#edd382]/40 hover:text-[#fc9e4f] transition-colors"
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
    return <p className="font-mono text-xs text-[#edd382]/30 py-16 text-center">Loading…</p>;
  }

  if (photos.length === 0) {
    return (
      <p className="font-mono text-sm text-[#edd382]/30 py-16 text-center">
        No photos published yet.
      </p>
    );
  }

  return (
    <>
      {/* Masonry grid via CSS columns */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-3 space-y-3">
        {photos.map((photo, i) => (
          <m.button
            key={photo.id}
            className="w-full break-inside-avoid block group relative overflow-hidden cursor-pointer focus:outline-none"
            onClick={() => setSelected(photo)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
          >
            <img
              src={photo.imageUrl}
              alt={photo.name}
              className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-500"
              loading="lazy"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#020122]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
              <p className="text-[#f2f3ae] font-semibold text-sm text-left leading-tight">{photo.name}</p>
            </div>
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
