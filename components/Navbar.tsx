"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {AnimatePresence, m} from "framer-motion";
import { Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import AuthButton from "./AuthButton";

const navItems = [
  { label: "SWE", href: "/swe" },
  { label: "Astrophotography", href: "/astrophotography" },
  { label: "Writing", href: "/writing" },
];

export default function Navbar() {
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
          ? "bg-base/90 backdrop-blur-md shadow-[0_1px_0_rgba(242,243,174,0.08)]"
          : ""
      }`}
    >
      <nav className="max-w-6xl mx-auto px-6 sm:px-16 py-5 flex items-center justify-between">
        <Link
          href="/"
          className="font-mono text-accent text-xl font-bold hover:opacity-75 transition-all duration-500"
        >
          AO.
        </Link>

        {/* Desktop nav */}
        <ul className="hidden sm:flex items-center gap-1">
          {navItems.map((item, i) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="relative px-4 py-2 font-mono text-sm text-surface hover:text-accent transition-colors group inline-block"
                >
                  <span className="text-accent/60 text-xs mr-1">0{i + 1}.</span>
                  {item.label}
                  <span
                    className={`absolute bottom-1 left-4 right-4 h-px bg-accent transition-transform duration-200 origin-left ${
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Auth + theme — desktop */}
        <div className="hidden sm:flex items-center gap-3">
          <AuthButton />
          <ThemeToggle />
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="sm:hidden flex items-center gap-1">
          <ThemeToggle />
          <button
            className="text-accent p-1"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <m.div
            className="sm:hidden border-t border-surface/10 bg-base/95 backdrop-blur-md overflow-hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ul className="px-6 py-5 flex flex-col gap-4">
              {navItems.map((item, i) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`font-mono text-sm transition-colors block ${
                      pathname === item.href ? "text-accent" : "text-surface hover:text-accent"
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="text-accent/60 text-xs mr-2">0{i + 1}.</span>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2 border-t border-surface/10">
                <AuthButton />
              </li>
            </ul>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}
