"use client";

import { motion } from "framer-motion";

export interface TabConfig {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: TabConfig[];
  activeId: string;
  onChange: (id: string) => void;
  /** Must be unique per page to avoid conflicting Framer Motion layout IDs. */
  layoutId: string;
}

export default function TabBar({
  tabs,
  activeId,
  onChange,
  layoutId,
}: TabBarProps) {
  return (
    <div className="flex border-b border-[#f2f3ae]/10">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative font-mono text-sm px-5 py-3 transition-colors duration-200 ${
            activeId === tab.id
              ? "text-[#fc9e4f]"
              : "text-[#edd382]/40 hover:text-[#edd382]/70"
          }`}
        >
          {tab.label}
          {activeId === tab.id && (
            <motion.div
              layoutId={layoutId}
              className="absolute bottom-0 left-0 right-0 h-px bg-[#fc9e4f]"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
