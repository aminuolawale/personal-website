import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ClientShell from "@/components/ClientShell";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SITE } from "@/lib/site";
import { COLOR_PALETTE_PRESETS } from "@/lib/theme-config";
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
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

const paletteCycleScript = (() => {
  const palettes = JSON.stringify(COLOR_PALETTE_PRESETS.map((preset) => preset.palette)).replace(/</g, "\\u003c");
  return `(function(){try{var t=localStorage.getItem('theme');document.documentElement.setAttribute('data-theme',t||'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}try{var presets=${palettes};if(presets.length){var raw=localStorage.getItem('palette-cycle-index'),current=Number.parseInt(raw||'-1',10);if(!Number.isFinite(current))current=-1;var next=(current+1)%presets.length;localStorage.setItem('palette-cycle-index',String(next));var c=presets[next];localStorage.setItem('color-palette',JSON.stringify(c));var s=document.createElement('style');s.id='palette-overrides';s.textContent=':root{--color-base:'+c.dark.base+';--color-accent:'+c.dark.accent+';--color-surface:'+c.dark.surface+';--color-muted:'+c.dark.muted+'}[data-theme="light"]{--color-base:'+c.light.base+';--color-accent:'+c.light.accent+';--color-surface:'+c.light.surface+';--color-muted:'+c.light.muted+'}';document.head.appendChild(s);}}catch(e){}try{var f=localStorage.getItem('font-choice');if(f){var fc=JSON.parse(f);if(fc.googleUrl){var l=document.createElement('link');l.rel='stylesheet';l.href=fc.googleUrl;document.head.appendChild(l);}var fs=document.createElement('style');fs.id='font-overrides';fs.textContent=':root{--font-space-grotesk:"'+fc.sans+'",sans-serif;--font-space-mono:"'+fc.mono+'",monospace}';document.head.appendChild(fs);}}catch(e){}})();`;
})();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetBrainsMono.variable}`}
    >
      <head>
        {/* Runs synchronously before first paint to avoid flash of wrong theme/colors/fonts */}
        <script dangerouslySetInnerHTML={{ __html: paletteCycleScript }} />
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
