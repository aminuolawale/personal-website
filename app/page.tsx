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
      <CelestialBackground 
        showObjects={viewMode !== "minimal"} 
        forceBright={viewMode === "cosmos"} 
      />
      
      <Navbar viewMode={viewMode} setViewMode={setViewMode} />
      
      <div 
        className={`transition-opacity duration-700 ${
          viewMode === "cosmos" ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
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
