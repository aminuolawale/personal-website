"use client";

import dynamic from "next/dynamic";
import Navbar from "./Navbar";
import Footer from "./Footer";

const CelestialBackground = dynamic(() => import("./CelestialBackground"), { ssr: false });

export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="celestial-bg">
        <CelestialBackground showObjects={true} forceBright={false} />
      </div>
      <Navbar />
      <div>
        {children}
        <Footer />
      </div>
    </>
  );
}
