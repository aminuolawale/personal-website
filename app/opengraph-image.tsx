import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const runtime = "edge";
export const alt = SITE.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "64px",
          background: "linear-gradient(135deg, #0f172a 0%, #111827 58%, #0c4a6e 100%)",
          fontFamily: "monospace",
        }}
      >
        {/* Decorative star dots */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "radial-gradient(circle, #cbd5e1 1px, transparent 1px), radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
            backgroundSize: "200px 200px, 300px 300px",
            backgroundPosition: "0 0, 100px 100px",
            opacity: 0.08,
          }}
        />

        {/* Accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #38bdf8, #cbd5e1)",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "900px" }}>
          <span style={{ color: "#38bdf8", fontSize: "20px", letterSpacing: "0.15em", fontFamily: "monospace" }}>
            aminuolawale.com
          </span>

          <h1 style={{ color: "#f8fafc", fontSize: "64px", fontWeight: "700", lineHeight: 1.1, margin: 0 }}>
            {SITE.name}
          </h1>

          <p style={{ color: "#cbd5e1", fontSize: "28px", margin: 0, opacity: 0.75 }}>
            Software Engineer · Astrophotographer · Writer
          </p>

          <p style={{ color: "#cbd5e1", fontSize: "20px", margin: 0, opacity: 0.5 }}>
            Based in Zurich, Switzerland
          </p>
        </div>
      </div>
    ),
    { ...size }
  );
}
