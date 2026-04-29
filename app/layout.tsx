import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import ClientShell from "@/components/ClientShell";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SITE } from "@/lib/site";
import { Analytics } from "@vercel/analytics/next"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    url: SITE.url,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SITE.title }],
  },
  twitter: {
    card: "summary_large_image",
    site: SITE.twitter,
    creator: SITE.twitter,
    title: SITE.title,
    description: SITE.description,
    images: ["/opengraph-image"],
  },
  alternates: { canonical: SITE.url },
  robots: { index: true, follow: true },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: SITE.name,
  url: SITE.url,
  sameAs: [SITE.github, SITE.linkedin],
  jobTitle: "Software Engineer",
  description: SITE.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${spaceMono.variable}`}
    >
      <head>
        {/* Runs synchronously before first paint to avoid flash of wrong theme/colors/fonts */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');document.documentElement.setAttribute('data-theme',t||'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}try{var p=localStorage.getItem('color-palette');if(p){var c=JSON.parse(p),s=document.createElement('style');s.id='palette-overrides';s.textContent=':root{--color-base:'+c.dark.base+';--color-accent:'+c.dark.accent+';--color-surface:'+c.dark.surface+';--color-muted:'+c.dark.muted+'}[data-theme="light"]{--color-base:'+c.light.base+';--color-accent:'+c.light.accent+';--color-surface:'+c.light.surface+';--color-muted:'+c.light.muted+'}';document.head.appendChild(s);}}catch(e){}try{var f=localStorage.getItem('font-choice');if(f){var fc=JSON.parse(f);if(fc.googleUrl){var l=document.createElement('link');l.rel='stylesheet';l.href=fc.googleUrl;document.head.appendChild(l);}var fs=document.createElement('style');fs.id='font-overrides';fs.textContent=':root{--font-space-grotesk:"'+fc.sans+'",sans-serif;--font-space-mono:"'+fc.mono+'",monospace}';document.head.appendChild(fs);}}catch(e){}})();` }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <ClientShell>{children}</ClientShell>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
