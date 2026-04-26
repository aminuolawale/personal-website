"use client";

export interface TabConfig {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: TabConfig[];
  activeId: string;
  onChange: (id: string) => void;
  layoutId?: string;
}

export default function TabBar({ tabs, activeId, onChange }: TabBarProps) {
  return (
    <div className="flex border-b border-surface/10 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((tab) => (
        <button
          key={tab.id}
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
  );
}
