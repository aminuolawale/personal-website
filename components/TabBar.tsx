"use client";

import { useRef, useEffect, useState } from "react";

export interface TabConfig {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: TabConfig[];
  activeId: string;
  onChange: (id: string) => void;
}

export default function TabBar({ tabs, activeId, onChange }: TabBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showFade, setShowFade] = useState(false);

  // Scroll the active tab into view whenever it changes
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const btn = el.querySelector<HTMLElement>(`[data-tab-id="${activeId}"]`);
    btn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [activeId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function update() {
      const canScrollRight = el!.scrollWidth > el!.clientWidth + 1;
      const isAtEnd = el!.scrollLeft + el!.clientWidth >= el!.scrollWidth - 1;
      setShowFade(canScrollRight && !isAtEnd);
    }

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [tabs]);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex border-b border-surface/10 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative shrink-0 font-mono text-sm px-5 py-3 transition-colors duration-200 ${
              activeId === tab.id
                ? "text-accent"
                : "text-muted/40 hover:text-muted/70"
            }`}
          >
            {tab.label}
            <span
              className="absolute bottom-0 left-0 right-0 h-px bg-accent transition-transform duration-200 origin-left"
              style={{ transform: activeId === tab.id ? "scaleX(1)" : "scaleX(0)" }}
            />
          </button>
        ))}
      </div>

      {/* Right-edge fade — visible when there are tabs beyond the viewport */}
      <div
        aria-hidden
        className={`absolute right-0 top-0 bottom-0 w-12 pointer-events-none transition-opacity duration-300 ${showFade ? "opacity-100" : "opacity-0"}`}
        style={{ background: "linear-gradient(to right, transparent, var(--color-base))" }}
      />
    </div>
  );
}
