"use client";

import { motion, type Transition } from "framer-motion";
import { Mail, ExternalLink } from "lucide-react";
import { GitHubIcon, LinkedInIcon, TwitterIcon } from "./icons";

const socials = [
  {
    icon: GitHubIcon,
    href: "https://github.com/aminuolawale",
    label: "GitHub",
  },
  {
    icon: LinkedInIcon,
    href: "https://www.linkedin.com/in/mohammed-aminu-b94468195",
    label: "LinkedIn",
  },
  {
    icon: TwitterIcon,
    href: "https://twitter.com/aminuolawalekan",
    label: "Twitter",
  },
  {
    icon: Mail,
    href: "mailto:aminuolawalekan@gmail.com",
    label: "Email",
  },
];

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: "easeOut" } as Transition,
});

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center px-6 sm:px-16 max-w-6xl mx-auto">
      {/* Ambient background blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 right-0 w-[600px] h-[600px] bg-[#fc9e4f]/[0.04] rounded-full blur-[130px]" />
        <div className="absolute bottom-16 -left-16 w-[500px] h-[500px] bg-[#edd382]/[0.04] rounded-full blur-[110px]" />
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
            className="text-[#f2f3ae]/45 hover:text-[#fc9e4f] hover:-translate-y-1 transition-all duration-200"
          >
            <Icon size={18} />
          </a>
        ))}
        <div className="w-px h-24 bg-[#f2f3ae]/25 mt-1" />
      </div>

      {/* Right email rail – desktop */}
      <div className="hidden lg:flex fixed right-10 bottom-0 flex-col items-center gap-4 pb-2 z-10">
        <a
          href="mailto:aminuolawalekan@gmail.com"
          className="text-[#f2f3ae]/45 hover:text-[#fc9e4f] transition-colors font-mono text-xs tracking-[0.18em] hover:-translate-y-1 duration-200"
          style={{ writingMode: "vertical-rl" }}
        >
          aminuolawalekan@gmail.com
        </a>
        <div className="w-px h-24 bg-[#f2f3ae]/25" />
      </div>

      {/* Main content */}
      <div className="pt-24 pb-16">
        <motion.p
          className="font-mono text-[#fc9e4f] text-sm mb-5"
          {...fadeUp(0.2)}
        >
          Hi, my name is
        </motion.p>

        <motion.h1
          className="text-[clamp(42px,8vw,82px)] font-bold text-[#f2f3ae] leading-[1.05] mb-3"
          {...fadeUp(0.3)}
        >
          Aminu Olawale.
        </motion.h1>

        <motion.h2
          className="text-[clamp(22px,4vw,46px)] font-bold text-[#edd382]/35 leading-[1.1] mb-8"
          {...fadeUp(0.4)}
        >
          Software Engineer · Astrophotographer · Writer.
        </motion.h2>

        <motion.p
          className="max-w-[520px] text-[#edd382]/75 text-lg leading-relaxed mb-12"
          {...fadeUp(0.5)}
        >
          Based in{" "}
          <span className="text-[#fc9e4f]">Zurich, Switzerland</span>. Building
          software since 2022. I also capture deep-sky objects and write.
        </motion.p>

        <motion.div className="flex flex-wrap gap-4" {...fadeUp(0.6)}>
          <a
            href="#work"
            className="font-mono text-sm text-[#fc9e4f] border border-[#fc9e4f] px-8 py-4 hover:bg-[#fc9e4f]/10 hover:shadow-[0_0_24px_rgba(252,158,79,0.18)] transition-all duration-300"
          >
            Explore My Work
          </a>
          <a
            href="mailto:aminuolawalekan@gmail.com"
            className="font-mono text-sm text-[#edd382]/70 hover:text-[#fc9e4f] transition-colors py-4 flex items-center gap-2"
          >
            Get In Touch <ExternalLink size={14} />
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-6 sm:left-16 flex items-center gap-3 text-[#f2f3ae]/25"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
      >
        <motion.div
          className="w-px h-12 bg-gradient-to-b from-[#f2f3ae]/40 to-transparent"
          animate={{ scaleY: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        />
        <span className="font-mono text-[10px] tracking-[0.25em]">SCROLL</span>
      </motion.div>
    </section>
  );
}
