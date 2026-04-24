"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navItems = [
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Contact", href: "#contact" },
];

interface NavbarProps {
  viewMode: "immersive" | "minimal" | "cosmos";
  setViewMode: (mode: "immersive" | "minimal" | "cosmos") => void;
}

export default function Navbar({ viewMode, setViewMode }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const toggleItems = [
    { id: "immersive", label: "Immersive" },
    { id: "minimal", label: "Minimal" },
    { id: "cosmos", label: "Cosmos" },
  ] as const;

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#020122]/90 backdrop-blur-md shadow-[0_1px_0_rgba(242,243,174,0.08)]"
          : ""
      }`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <nav className="max-w-6xl mx-auto px-6 sm:px-16 py-5 flex items-center justify-between">
        <a
          href="#"
          className={`font-mono text-[#fc9e4f] text-xl font-bold hover:opacity-75 transition-all duration-500 ${
            viewMode === "cosmos" ? "opacity-0 pointer-events-none -translate-x-4" : "opacity-100"
          }`}
        >
          AO.
        </a>

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
        <ul className={`hidden sm:flex items-center gap-1 transition-all duration-500 ${
          viewMode === "cosmos" ? "opacity-0 pointer-events-none translate-x-4" : "opacity-100"
        }`}>
          {navItems.map((item, i) => (
            <li key={item.label}>
              <a
                href={item.href}
                className="relative px-4 py-2 font-mono text-sm text-[#f2f3ae] hover:text-[#fc9e4f] transition-colors group inline-block"
              >
                <span className="text-[#fc9e4f]/60 text-xs mr-1">
                  0{i + 1}.
                </span>
                {item.label}
                <span className="absolute bottom-1 left-4 right-4 h-px bg-[#fc9e4f] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
              </a>
            </li>
          ))}
          <li className="ml-3">
            <a
              href="#"
              className="font-mono text-sm text-[#fc9e4f] border border-[#fc9e4f] px-5 py-2 hover:bg-[#fc9e4f]/10 transition-all duration-200"
            >
              Resume
            </a>
          </li>
        </ul>

        {/* Mobile toggle */}
        <button
          className={`sm:hidden text-[#fc9e4f] p-1 transition-all duration-500 ${
            viewMode === "cosmos" ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Mobile Center Toggle (if mobileOpen is false and viewMode is cosmos, we need to see it) */}
        {viewMode === "cosmos" && (
          <div className="sm:hidden absolute left-1/2 -translate-x-1/2 flex bg-[#020122]/40 backdrop-blur-sm border border-[#fc9e4f]/20 rounded-full p-1 shadow-sm">
            {toggleItems.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all duration-300 ${
                  viewMode === mode.id
                    ? "bg-[#fc9e4f] text-[#020122]"
                    : "text-[#edd382]"
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
          <motion.div
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
                  <a
                    href={item.href}
                    className="font-mono text-sm text-[#f2f3ae] hover:text-[#fc9e4f] transition-colors block"
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="text-[#fc9e4f]/60 text-xs mr-2">
                      0{i + 1}.
                    </span>
                    {item.label}
                  </a>
                </li>
              ))}
              <li className="pt-1">
                <a
                  href="#"
                  className="font-mono text-sm text-[#fc9e4f] border border-[#fc9e4f] px-5 py-2 inline-block hover:bg-[#fc9e4f]/10 transition-all"
                  onClick={() => setMobileOpen(false)}
                >
                  Resume
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
