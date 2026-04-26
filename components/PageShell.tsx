"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Navbar from "./Navbar";
import Footer from "./Footer";

const CelestialBackground = dynamic(() => import("./CelestialBackground"), { ssr: false });

export default function PageShell({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = useState<"immersive" | "minimal" | "cosmos">("immersive");

  return (
    <>
      <div className="celestial-bg">
        <CelestialBackground
          showObjects={viewMode !== "minimal"}
          forceBright={viewMode === "cosmos"}
        />
      </div>
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
