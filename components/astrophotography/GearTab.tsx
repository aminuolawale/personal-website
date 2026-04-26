"use client";

import { useEffect, useState } from "react";
import { Cpu, Wrench, Layers } from "lucide-react";
import type { AstroGear } from "@/lib/schema";

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  equipment: { label: "Equipment", icon: <Cpu size={14} /> },
  software:  { label: "Software",  icon: <Wrench size={14} /> },
  technique: { label: "Technique", icon: <Layers size={14} /> },
};

const TYPE_ORDER = ["equipment", "software", "technique"];

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

  const hasAny = gear.length > 0;

  if (!hasAny) {
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
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-surface/10">
              <span className="text-accent/60">{icon}</span>
              <h3 className="font-mono text-xs uppercase tracking-widest text-muted/50">{label}</h3>
            </div>
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="text-surface/80 text-sm leading-relaxed">
                  {item.name}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
