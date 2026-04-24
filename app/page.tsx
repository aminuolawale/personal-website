"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import CelestialBackground from "@/components/CelestialBackground";

export default function Home() {
  const [viewMode, setViewMode] = useState<"immersive" | "minimal" | "cosmos">("immersive");

  return (
    <>
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] bg-[#020122]/80 backdrop-blur-md border border-[#fc9e4f]/40 rounded-full flex p-1 shadow-[0_0_15px_rgba(252,158,79,0.2)]">
        <button
          onClick={() => setViewMode("immersive")}
          className={`px-4 sm:px-6 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 ${
            viewMode === "immersive"
              ? "bg-[#fc9e4f] text-[#020122] shadow-[0_0_10px_rgba(252,158,79,0.6)]"
              : "text-[#edd382] hover:text-[#fc9e4f] hover:bg-[#fc9e4f]/10"
          }`}
        >
          Immersive
        </button>
        <button
          onClick={() => setViewMode("minimal")}
          className={`px-4 sm:px-6 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 ${
            viewMode === "minimal"
              ? "bg-[#fc9e4f] text-[#020122] shadow-[0_0_10px_rgba(252,158,79,0.6)]"
              : "text-[#edd382] hover:text-[#fc9e4f] hover:bg-[#fc9e4f]/10"
          }`}
        >
          Minimal
        </button>
        <button
          onClick={() => setViewMode("cosmos")}
          className={`px-4 sm:px-6 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 ${
            viewMode === "cosmos"
              ? "bg-[#fc9e4f] text-[#020122] shadow-[0_0_10px_rgba(252,158,79,0.6)]"
              : "text-[#edd382] hover:text-[#fc9e4f] hover:bg-[#fc9e4f]/10"
          }`}
        >
          Cosmos
        </button>
      </div>

      <CelestialBackground 
        showObjects={viewMode !== "minimal"} 
        forceBright={viewMode === "cosmos"} 
      />
      
      <div 
        className={`transition-opacity duration-700 ${
          viewMode === "cosmos" ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <Navbar />
        <main>
          <Hero />
          <About />
          <Experience />
          <Projects />
          <Contact />
        </main>
        <Footer />
      </div>
    </>
  );
}
