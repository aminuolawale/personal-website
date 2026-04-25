import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import ClientShell from "@/components/ClientShell";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "Aminu Olawale — Software Engineer · Astrophotographer · Writer",
  description:
    "Software Engineer based in Zurich, Switzerland. Building software since 2022. I also capture deep-sky objects and write.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${spaceMono.variable}`}
    >
      <body className="bg-[#020122] text-[#edd382] font-sans antialiased">
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
