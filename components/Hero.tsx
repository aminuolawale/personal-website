"use client";

import {m} from "framer-motion";
import { Mail, ExternalLink } from "lucide-react";
import { GitHubIcon, LinkedInIcon, TwitterIcon } from "./icons";
import { useSiteContent } from "@/lib/hooks/use-site-content";

const socials = [
  { icon: GitHubIcon, href: "https://github.com/aminuolawale", label: "GitHub" },
  { icon: LinkedInIcon, href: "https://www.linkedin.com/in/mohammed-aminu-b94468195", label: "LinkedIn" },
  { icon: TwitterIcon, href: "https://twitter.com/aminuolawalekan", label: "Twitter" },
  { icon: Mail, href: "mailto:aminuolawalekan@gmail.com", label: "Email" },
];

export default function Hero() {
  const content = useSiteContent();

  return (
    <section className="relative min-h-screen flex flex-col justify-center px-6 sm:px-16 max-w-6xl mx-auto">
      {/* Ambient background blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 right-0 w-[600px] h-[600px] bg-accent/[0.04] rounded-full blur-[130px]" />
        <div className="absolute bottom-16 -left-16 w-[500px] h-[500px] bg-muted/[0.04] rounded-full blur-[110px]" />
      </div>

      {/* Left social rail – desktop */}
      <div className="hidden lg:flex fixed left-10 bottom-0 flex-col items-center gap-5 pb-2 z-10">
        {socials.map(({ icon: Icon, href, label }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            aria-label={label}
            className="text-surface/45 hover:text-accent hover:-translate-y-1 transition-all duration-200"
          >
            <Icon size={18} />
          </a>
        ))}
        <div className="w-px h-24 bg-surface/25 mt-1" />
      </div>

      {/* Right email rail – desktop */}
      <div className="hidden lg:flex fixed right-10 bottom-0 flex-col items-center gap-4 pb-2 z-10">
        <a
          href="mailto:aminuolawalekan@gmail.com"
          className="text-surface/45 hover:text-accent transition-colors font-mono text-xs tracking-[0.18em] hover:-translate-y-1 duration-200"
          style={{ writingMode: "vertical-rl" }}
        >
          aminuolawalekan@gmail.com
        </a>
        <div className="w-px h-24 bg-surface/25" />
      </div>

      {/* Main content — no entrance animations; content must be visible on first paint */}
      <div className="pt-20 sm:pt-24 pb-12 sm:pb-16">
        <p className="font-mono text-accent text-sm mb-5">{content.greeting}</p>

        <h1 className="text-[clamp(42px,8vw,82px)] font-bold text-surface leading-[1.05] mb-3">
          {content.name}
        </h1>

        <h2 className="text-[clamp(22px,4vw,46px)] font-bold text-muted/35 leading-[1.1] mb-8">
          {content.roles}
        </h2>

        <p className="max-w-[520px] text-muted/75 text-base sm:text-lg leading-relaxed mb-8 sm:mb-12">
          {content.bio}
        </p>

        <div className="flex flex-wrap gap-4">
          <a
            href="#work"
            className="font-mono text-sm text-accent border border-accent px-8 py-4 hover:bg-accent/10 hover:shadow-[0_0_24px_rgba(252,158,79,0.18)] transition-all duration-300"
          >
            Explore My Work
          </a>
          <a
            href="mailto:aminuolawalekan@gmail.com"
            className="font-mono text-sm text-muted/70 hover:text-accent transition-colors py-4 flex items-center gap-2"
          >
            Get In Touch <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Scroll indicator — purely decorative, fine to animate after hydration */}
      <m.div
        className="absolute bottom-10 left-6 sm:left-16 flex items-center gap-3 text-surface/25"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <m.div
          className="w-px h-12 bg-gradient-to-b from-surface/40 to-transparent"
          animate={{ scaleY: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        />
        <span className="font-mono text-[10px] tracking-[0.25em]">SCROLL</span>
      </m.div>
    </section>
  );
}
