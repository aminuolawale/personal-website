"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Cpu, Wrench, Layers, ExternalLink, X } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import type { AstroGear } from "@/lib/schema";

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  equipment: { label: "Equipment", icon: <Cpu size={14} /> },
  software:  { label: "Software",  icon: <Wrench size={14} /> },
  technique: { label: "Technique", icon: <Layers size={14} /> },
};

const TYPE_ORDER = ["equipment", "software", "technique"];

function EquipmentModal({ item, onClose }: { item: AstroGear; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <m.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-base/80 backdrop-blur-sm"
        onClick={onClose}
      />

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

        {item.imageUrl && (
          <div className="w-full aspect-square bg-surface/5 overflow-hidden">
            <Image
              src={item.imageUrl}
              alt={item.name}
              width={400}
              height={400}
              className="w-full h-full object-contain"
            />
          </div>
        )}

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
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </m.div>
    </m.div>
  );
}

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
          <Image
            src={item.imageUrl}
            alt={item.name}
            width={36}
            height={36}
            className="w-full h-full object-cover"
          />
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

export default function GearTab() {
  const [gear, setGear] = useState<AstroGear[]>([]);
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
