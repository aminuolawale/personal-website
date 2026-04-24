"use client";

import { useState } from "react";
import CelestialBackground from "./CelestialBackground";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function PageShell({ children }: { children: React.ReactNode }) {
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
        {children}
        <Footer />
      </div>
    </>
  );
}
