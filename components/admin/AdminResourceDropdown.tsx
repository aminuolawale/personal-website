"use client";

import Link from "next/link";
import { ChevronDown, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type AdminResourceAction = {
  href: string;
  label: string;
  description?: string;
};

type Props = {
  label?: string;
  actions: AdminResourceAction[];
};

export default function AdminResourceDropdown({ label = "Create", actions }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (actions.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-2 border border-accent px-4 py-2 font-mono text-xs text-accent transition-all hover:bg-accent/10"
        aria-expanded={open}
      >
        <Plus size={13} />
        {label}
        <ChevronDown size={13} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 border border-surface/15 bg-base shadow-xl">
          {actions.map((action) => (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              onClick={() => setOpen(false)}
              className="block border-b border-surface/[0.06] px-3 py-3 transition-colors last:border-b-0 hover:bg-surface/[0.04]"
            >
              <span className="block text-sm font-medium text-surface">{action.label}</span>
              {action.description && (
                <span className="mt-1 block text-xs leading-5 text-muted/45">{action.description}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
