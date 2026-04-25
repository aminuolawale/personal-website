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
          background: "linear-gradient(135deg, #020122 0%, #05033a 60%, #0a0550 100%)",
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
              "radial-gradient(circle, #edd382 1px, transparent 1px), radial-gradient(circle, #edd382 1px, transparent 1px)",
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
            background: "linear-gradient(90deg, #fc9e4f, #edd382)",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "900px" }}>
          <span style={{ color: "#fc9e4f", fontSize: "20px", letterSpacing: "0.15em", fontFamily: "monospace" }}>
            aminuolawale.com
          </span>

          <h1 style={{ color: "#f2f3ae", fontSize: "64px", fontWeight: "700", lineHeight: 1.1, margin: 0 }}>
            {SITE.name}
          </h1>

          <p style={{ color: "#edd382", fontSize: "28px", margin: 0, opacity: 0.75 }}>
            Software Engineer · Astrophotographer · Writer
          </p>

          <p style={{ color: "#edd382", fontSize: "20px", margin: 0, opacity: 0.5 }}>
            Based in Zurich, Switzerland
          </p>
        </div>
      </div>
    ),
    { ...size }
  );
}
