"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Cpu, Wrench, Layers, ExternalLink, X, ChevronLeft, ChevronRight } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import type { AstroGear, GearImage } from "@/lib/schema";

type Marquee = { x: number; y: number; w: number; h: number };

function parseMarquee(m: string | null | undefined): Marquee | null {
  if (!m) return null;
  try { return JSON.parse(m); } catch { return null; }
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  equipment: { label: "Equipment", icon: <Cpu size={14} /> },
  software:  { label: "Software",  icon: <Wrench size={14} /> },
  technique: { label: "Technique", icon: <Layers size={14} /> },
};

const TYPE_ORDER = ["equipment", "software", "technique"];

// ── Corner marks ─────────────────────────────────────────────────────────────

function CornerMarks({ color = "rgba(255,200,100,0.95)", size = 12 }: { color?: string; size?: number }) {
  const s = `${size}px`;
  const t = "2px";
  return (
    <>
      <span style={{ position:"absolute", top:0,    left:0,  width:s, height:s, borderTop:   `${t} solid ${color}`, borderLeft:  `${t} solid ${color}` }} />
      <span style={{ position:"absolute", top:0,    right:0, width:s, height:s, borderTop:   `${t} solid ${color}`, borderRight: `${t} solid ${color}` }} />
      <span style={{ position:"absolute", bottom:0, left:0,  width:s, height:s, borderBottom:`${t} solid ${color}`, borderLeft:  `${t} solid ${color}` }} />
      <span style={{ position:"absolute", bottom:0, right:0, width:s, height:s, borderBottom:`${t} solid ${color}`, borderRight: `${t} solid ${color}` }} />
    </>
  );
}

// ── Equipment modal ───────────────────────────────────────────────────────────

function EquipmentModal({ item, onClose }: { item: AstroGear; onClose: () => void }) {
  const [images, setImages]   = useState<GearImage[]>([]);
  const [imgIdx, setImgIdx]   = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/astro-gear/${item.id}/images`)
      .then(r => {
        if (!r.ok) { console.warn("gear images fetch failed", r.status); return []; }
        return r.json();
      })
      .then(data => setImages(Array.isArray(data) ? data : []))
      .catch(err => { console.warn("gear images fetch error", err); setImages([]); })
      .finally(() => setLoading(false));
  }, [item.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape")      { onClose(); return; }
      if (e.key === "ArrowRight")  setImgIdx(i => Math.min(i + 1, images.length - 1));
      if (e.key === "ArrowLeft")   setImgIdx(i => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, images.length]);

  const current    = images[imgIdx] ?? null;
  const marquee    = current ? parseMarquee(current.marquee) : null;
  const hasMulti   = images.length > 1;
  const legacyImg  = !loading && images.length === 0 ? item.imageUrl : null;

  function prev() { setImgIdx(i => Math.max(i - 1, 0)); }
  function next() { setImgIdx(i => Math.min(i + 1, images.length - 1)); }

  return (
    <m.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-base/80 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <m.div
        className="relative z-10 bg-base border border-surface/15 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[92vh]"
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.2 }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-muted/40 hover:text-muted transition-colors z-20"
        >
          <X size={16} />
        </button>

        {/* ── Image area ── */}
        <div className="relative w-full bg-surface/[0.04] overflow-hidden" style={{ aspectRatio: "4/3" }}>

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="font-mono text-xs text-muted/30">Loading…</p>
            </div>
          )}

          {/* Cross-fade between images */}
          <AnimatePresence mode="wait" initial={false}>
            {current && (
              <m.div
                key={imgIdx}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Image
                  src={current.imageUrl}
                  alt={item.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 100vw, 512px"
                />
                {marquee && (
                  <div
                    className="absolute pointer-events-none"
                    style={{ left:`${marquee.x}%`, top:`${marquee.y}%`, width:`${marquee.w}%`, height:`${marquee.h}%` }}
                  >
                    <CornerMarks color="rgba(255,200,100,0.95)" size={14} />
                  </div>
                )}
              </m.div>
            )}
          </AnimatePresence>

          {/* Legacy single image (no gearImages) */}
          {legacyImg && (
            <Image
              src={legacyImg}
              alt={item.name}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 100vw, 512px"
            />
          )}

          {/* Prev / Next buttons overlaid on image */}
          {hasMulti && (
            <>
              <button
                onClick={prev}
                disabled={imgIdx === 0}
                aria-label="Previous image"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-base/60 backdrop-blur-sm text-surface/70 hover:text-surface hover:bg-base/80 disabled:opacity-0 disabled:pointer-events-none transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={next}
                disabled={imgIdx === images.length - 1}
                aria-label="Next image"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-base/60 backdrop-blur-sm text-surface/70 hover:text-surface hover:bg-base/80 disabled:opacity-0 disabled:pointer-events-none transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {/* ── Dot indicators ── */}
        {hasMulti && (
          <div className="flex items-center justify-center gap-1.5 pt-3 px-5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                aria-label={`Image ${i + 1}`}
                className={`rounded-full transition-all ${
                  i === imgIdx
                    ? "w-4 h-1.5 bg-accent"
                    : "w-1.5 h-1.5 bg-surface/30 hover:bg-surface/50"
                }`}
              />
            ))}
          </div>
        )}

        {/* ── Per-image description ── */}
        {current?.description && (
          <p className="px-5 pt-3 text-muted/70 text-sm leading-relaxed">
            {current.description}
          </p>
        )}

        {/* ── Item metadata ── */}
        <div className="p-5 space-y-4">
          <div>
            <span className="font-mono text-[10px] text-accent/50 uppercase tracking-widest">Equipment</span>
            <h2 className="text-surface text-lg font-semibold mt-1 leading-snug">{item.name}</h2>
          </div>

          {item.link && (
            <div className="space-y-1">
              <p className="font-mono text-[10px] text-muted/40 uppercase tracking-widest">Link</p>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 font-mono text-xs text-accent/70 hover:text-accent transition-colors break-all"
              >
                <ExternalLink size={11} className="shrink-0" />
                {item.link}
              </a>
            </div>
          )}

          <div className="space-y-1">
            <p className="font-mono text-[10px] text-muted/40 uppercase tracking-widest">Added</p>
            <p className="font-mono text-xs text-muted/60">
              {new Date(item.createdAt).toLocaleDateString(undefined, {
                year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          </div>
        </div>
      </m.div>
    </m.div>
  );
}

// ── Gear item (list row) ──────────────────────────────────────────────────────

function GearItem({ item, onSelect }: { item: AstroGear; onSelect?: (item: AstroGear) => void }) {
  const isEquipment = item.type === "equipment";

  const inner = (
    <div className="flex items-center gap-3 group py-2.5">
      {item.imageUrl && (
        <div className="w-9 h-9 shrink-0 overflow-hidden border border-surface/10">
          <Image src={item.imageUrl} alt={item.name} width={36} height={36} className="w-full h-full object-cover" />
        </div>
      )}
      <span className="text-surface/80 text-sm leading-relaxed flex-1">{item.name}</span>
      {isEquipment ? (
        <span className="font-mono text-[10px] text-accent/30 group-hover:text-accent/60 transition-colors shrink-0 uppercase tracking-widest">
          Details
        </span>
      ) : item.link ? (
        <ExternalLink size={12} className="text-accent/30 group-hover:text-accent/60 transition-colors shrink-0" />
      ) : null}
    </div>
  );

  if (isEquipment) {
    return (
      <li className="border-b border-surface/[0.05] last:border-0">
        <button onClick={() => onSelect?.(item)}
          className="w-full text-left hover:bg-surface/[0.03] -mx-2 px-2 rounded transition-colors cursor-pointer">
          {inner}
        </button>
      </li>
    );
  }

  if (item.link) {
    return (
      <li className="border-b border-surface/[0.05] last:border-0">
        <a href={item.link} target="_blank" rel="noopener noreferrer"
          className="block hover:bg-surface/[0.03] -mx-2 px-2 rounded transition-colors">
          {inner}
        </a>
      </li>
    );
  }

  return <li className="border-b border-surface/[0.05] last:border-0">{inner}</li>;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GearTab() {
  const [gear, setGear]         = useState<AstroGear[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<AstroGear | null>(null);

  useEffect(() => {
    fetch("/api/astro-gear")
      .then(r => r.ok ? r.json() : [])
      .then(data => setGear(Array.isArray(data) ? data : []))
      .catch(() => setGear([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="font-mono text-xs text-muted/30 py-16 text-center">Loading…</p>;

  const grouped = TYPE_ORDER.reduce<Record<string, AstroGear[]>>((acc, t) => {
    acc[t] = gear.filter(g => g.type === t);
    return acc;
  }, {});

  if (gear.length === 0) {
    return <p className="font-mono text-sm text-muted/30 py-16 text-center">No gear listed yet.</p>;
  }

  return (
    <>
      <div className="grid sm:grid-cols-3 gap-8 sm:gap-12">
        {TYPE_ORDER.map(type => {
          const items = grouped[type];
          if (items.length === 0) return null;
          const { label, icon } = TYPE_CONFIG[type];
          return (
            <div key={type}>
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-surface/10">
                <span className="text-accent/60">{icon}</span>
                <h3 className="font-mono text-xs uppercase tracking-widest text-muted/50">{label}</h3>
              </div>
              <ul>
                {items.map(item => (
                  <GearItem key={item.id} item={item} onSelect={setSelected} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {selected && (
          <EquipmentModal item={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
