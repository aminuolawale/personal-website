"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {AnimatePresence, m} from "framer-motion";
import { Menu, X } from "lucide-react";

const navItems = [
  { label: "SWE", href: "/swe" },
  { label: "Astrophotography", href: "/astrophotography" },
  { label: "Writing", href: "/writing" },
];

interface NavbarProps {
  viewMode: "immersive" | "minimal" | "cosmos";
  setViewMode: (mode: "immersive" | "minimal" | "cosmos") => void;
}

const toggleItems = [
  { id: "immersive", label: "Immersive" },
  { id: "minimal", label: "Minimal" },
  { id: "cosmos", label: "Cosmos" },
] as const;

export default function Navbar({ viewMode, setViewMode }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#020122]/90 backdrop-blur-md shadow-[0_1px_0_rgba(242,243,174,0.08)]"
          : ""
      }`}
    >
      <nav className="max-w-6xl mx-auto px-6 sm:px-16 py-5 flex items-center justify-between">
        <Link
          href="/"
          className={`font-mono text-[#fc9e4f] text-xl font-bold hover:opacity-75 transition-all duration-500 ${
            viewMode === "cosmos" ? "opacity-0 pointer-events-none -translate-x-4" : "opacity-100"
          }`}
        >
          AO.
        </Link>

        {/* Center Toggle (Desktop) */}
        <div className="hidden md:flex bg-[#020122]/40 backdrop-blur-sm border border-[#fc9e4f]/20 rounded-full p-1 mx-4 shadow-sm">
          {toggleItems.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all duration-300 ${
                viewMode === mode.id
                  ? "bg-[#fc9e4f] text-[#020122] shadow-[0_0_8px_rgba(252,158,79,0.5)]"
                  : "text-[#edd382] hover:text-[#fc9e4f] hover:bg-[#fc9e4f]/5"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Desktop nav */}
        <ul
          className={`hidden sm:flex items-center gap-1 transition-all duration-500 ${
            viewMode === "cosmos" ? "opacity-0 pointer-events-none translate-x-4" : "opacity-100"
          }`}
        >
          {navItems.map((item, i) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="relative px-4 py-2 font-mono text-sm text-[#f2f3ae] hover:text-[#fc9e4f] transition-colors group inline-block"
                >
                  <span className="text-[#fc9e4f]/60 text-xs mr-1">0{i + 1}.</span>
                  {item.label}
                  <span
                    className={`absolute bottom-1 left-4 right-4 h-px bg-[#fc9e4f] transition-transform duration-200 origin-left ${
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Mobile menu button */}
        <button
          className={`sm:hidden text-[#fc9e4f] p-1 transition-all duration-500 ${
            viewMode === "cosmos" ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {viewMode === "cosmos" && (
          <div className="sm:hidden absolute left-1/2 -translate-x-1/2 flex bg-[#020122]/40 backdrop-blur-sm border border-[#fc9e4f]/20 rounded-full p-1 shadow-sm">
            {toggleItems.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all duration-300 ${
                  viewMode === mode.id ? "bg-[#fc9e4f] text-[#020122]" : "text-[#edd382]"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && viewMode !== "cosmos" && (
          <m.div
            className="sm:hidden border-t border-[#f2f3ae]/10 bg-[#020122]/95 backdrop-blur-md overflow-hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-6 pt-6 pb-2">
              <div className="bg-[#020122]/40 border border-[#fc9e4f]/20 rounded-full flex p-1 justify-center">
                {toggleItems.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id)}
                    className={`flex-1 px-2 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all duration-300 ${
                      viewMode === mode.id
                        ? "bg-[#fc9e4f] text-[#020122]"
                        : "text-[#edd382] hover:text-[#fc9e4f]"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <ul className="px-6 py-5 flex flex-col gap-4">
              {navItems.map((item, i) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`font-mono text-sm transition-colors block ${
                      pathname === item.href ? "text-[#fc9e4f]" : "text-[#f2f3ae] hover:text-[#fc9e4f]"
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="text-[#fc9e4f]/60 text-xs mr-2">0{i + 1}.</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}
