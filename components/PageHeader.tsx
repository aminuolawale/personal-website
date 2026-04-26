"use client";

import {m} from "framer-motion";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  /** Optional slot rendered below the description (e.g. a tab bar). */
  children?: React.ReactNode;
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: PageHeaderProps) {
  return (
    <section className="pt-24 sm:pt-40 pb-0 px-6 sm:px-16 max-w-6xl mx-auto">
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="font-mono text-accent text-sm mb-4">{eyebrow}</p>
        <h1 className="text-[clamp(32px,6vw,64px)] font-bold text-surface leading-tight mb-4 sm:mb-6">
          {title}
        </h1>
        <p className="text-muted/65 text-base sm:text-lg max-w-xl leading-relaxed mb-8 sm:mb-12">
          {description}
        </p>
        {children}
      </m.div>
    </section>
  );
}
