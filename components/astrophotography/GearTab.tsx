"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Cpu, Wrench, Layers, ExternalLink } from "lucide-react";
import type { AstroGear } from "@/lib/schema";

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  equipment: { label: "Equipment", icon: <Cpu size={14} /> },
  software:  { label: "Software",  icon: <Wrench size={14} /> },
  technique: { label: "Technique", icon: <Layers size={14} /> },
};

const TYPE_ORDER = ["equipment", "software", "technique"];

function GearItem({ item }: { item: AstroGear }) {
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
      {item.link && (
        <ExternalLink
          size={12}
          className="text-accent/30 group-hover:text-accent/60 transition-colors shrink-0"
        />
      )}
    </div>
  );

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
    <li className="border-b border-surface/[0.05] last:border-0">
      {inner}
    </li>
  );
}

export default function GearTab() {
  const [gear, setGear] = useState<AstroGear[]>([]);
  const [loading, setLoading] = useState(true);

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
                <GearItem key={item.id} item={item} />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
