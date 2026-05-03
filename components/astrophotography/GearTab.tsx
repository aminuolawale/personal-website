"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Cpu, Wrench, Layers, ExternalLink, X } from "lucide-react";
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

function CornerMarks({
  color = "rgba(255,200,100,0.95)",
  size = 12,
}: {
  color?: string;
  size?: number;
}) {
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
  const [images, setImages]       = useState<GearImage[]>([]);
  const [imgIdx, setImgIdx]       = useState(0);
  const [loadingImgs, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/astro-gear/${item.id}/images`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setImages(Array.isArray(data) ? data : []))
      .catch(() => setImages([]))
      .finally(() => setLoading(false));
  }, [item.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowRight") setImgIdx(i => Math.min(i + 1, images.length - 1));
      if (e.key === "ArrowLeft")  setImgIdx(i => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, images.length]);

  const current  = images[imgIdx] ?? null;
  const marquee  = current ? parseMarquee(current.marquee) : null;
  const hasMulti = images.length > 1;

  // Fall back to the legacy single imageUrl if no gearImages exist
  const legacyImage = !loadingImgs && images.length === 0 ? item.imageUrl : null;

  return (
    <m.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-base/80 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <m.div
        className="relative z-10 bg-base border border-surface/15 max-w-sm w-full shadow-2xl"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2 }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-muted/40 hover:text-muted transition-colors z-10"
        >
          <X size={16} />
        </button>

        {/* Image area */}
        {loadingImgs && (
          <div className="w-full aspect-square bg-surface/5 flex items-center justify-center">
            <p className="font-mono text-xs text-muted/30">Loading…</p>
          </div>
        )}

        {!loadingImgs && images.length > 0 && (
          <>
            {/* Current image with marquee overlay */}
            <div className="relative w-full aspect-square bg-surface/5 overflow-hidden">
              <Image
                src={current!.imageUrl}
                alt={item.name}
                fill
                className="object-contain"
              />
              {marquee && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left:   `${marquee.x}%`,
                    top:    `${marquee.y}%`,
                    width:  `${marquee.w}%`,
                    height: `${marquee.h}%`,
                  }}
                >
                  <CornerMarks color="rgba(255,200,100,0.95)" size={14} />
                </div>
              )}
            </div>

            {/* Carousel nav */}
            {hasMulti && (
              <div className="flex items-center justify-between px-5 pt-3">
                <button
                  onClick={() => setImgIdx(i => Math.max(i - 1, 0))}
                  disabled={imgIdx === 0}
                  className="font-mono text-lg text-muted/40 hover:text-muted disabled:opacity-20 transition-colors leading-none"
                  aria-label="Previous image"
                >
                  ←
                </button>
                <span className="font-mono text-[10px] text-muted/30">
                  {imgIdx + 1} / {images.length}
                </span>
                <button
                  onClick={() => setImgIdx(i => Math.min(i + 1, images.length - 1))}
                  disabled={imgIdx === images.length - 1}
                  className="font-mono text-lg text-muted/40 hover:text-muted disabled:opacity-20 transition-colors leading-none"
                  aria-label="Next image"
                >
                  →
                </button>
              </div>
            )}

            {/* Per-image description */}
            {current?.description && (
              <p className="px-5 pt-2 text-muted/60 text-sm leading-relaxed">
                {current.description}
              </p>
            )}
          </>
        )}

        {/* Legacy single image fallback */}
        {legacyImage && (
          <div className="w-full aspect-square bg-surface/5 overflow-hidden">
            <Image
              src={legacyImage}
              alt={item.name}
              width={400}
              height={400}
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Item metadata */}
        <div className="p-5 space-y-4">
          <div>
            <span className="font-mono text-[10px] text-accent/50 uppercase tracking-widest">
              Equipment
            </span>
            <h2 className="text-surface text-lg font-semibold mt-1 leading-snug">
              {item.name}
            </h2>
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

function GearItem({
  item,
  onSelect,
}: {
  item: AstroGear;
  onSelect?: (item: AstroGear) => void;
}) {
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
        <button
          onClick={() => onSelect?.(item)}
          className="w-full text-left hover:bg-surface/[0.03] -mx-2 px-2 rounded transition-colors cursor-pointer"
        >
          {inner}
        </button>
      </li>
    );
  }

  if (item.link) {
    return (
      <li className="border-b border-surface/[0.05] last:border-0">
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block hover:bg-surface/[0.03] -mx-2 px-2 rounded transition-colors"
        >
          {inner}
        </a>
      </li>
    );
  }

  return (
    <li className="border-b border-surface/[0.05] last:border-0">{inner}</li>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GearTab() {
  const [gear, setGear]       = useState<AstroGear[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AstroGear | null>(null);

  useEffect(() => {
    fetch("/api/astro-gear")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setGear(Array.isArray(data) ? data : []))
      .catch(() => setGear([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="font-mono text-xs text-muted/30 py-16 text-center">Loading…</p>;
  }

  const grouped = TYPE_ORDER.reduce<Record<string, AstroGear[]>>((acc, t) => {
    acc[t] = gear.filter((g) => g.type === t);
    return acc;
  }, {});

  if (gear.length === 0) {
    return (
      <p className="font-mono text-sm text-muted/30 py-16 text-center">
        No gear listed yet.
      </p>
    );
  }

  return (
    <>
      <div className="grid sm:grid-cols-3 gap-8 sm:gap-12">
        {TYPE_ORDER.map((type) => {
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
                {items.map((item) => (
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
