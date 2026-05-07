"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

const CelestialBackground = dynamic(() => import("./CelestialBackground"), { ssr: false });

export default function PageShell({ children }: { children: React.ReactNode }) {
  const [showBackground, setShowBackground] = useState(false);

  useEffect(() => {
    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    if (connection?.saveData || connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g") {
      return;
    }

    const scheduleIdle = window.requestIdleCallback ?? ((cb: IdleRequestCallback) => {
      const id = window.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 0 }), 1400);
      return id;
    });
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
    const idleId = scheduleIdle(() => setShowBackground(true), { timeout: 2200 });
    return () => cancelIdle(idleId);
  }, []);

  return (
    <>
      {showBackground && (
        <div className="celestial-bg" aria-hidden>
          <CelestialBackground showObjects={true} forceBright={false} />
        </div>
      )}
      <Navbar />
      <div>
        {children}
        <Footer />
      </div>
    </>
  );
}
