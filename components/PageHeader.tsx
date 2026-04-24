"use client";

import { motion } from "framer-motion";

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
    <section className="pt-40 pb-0 px-6 sm:px-16 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <p className="font-mono text-[#fc9e4f] text-sm mb-4">{eyebrow}</p>
        <h1 className="text-[clamp(36px,6vw,64px)] font-bold text-[#f2f3ae] leading-tight mb-6">
          {title}
        </h1>
        <p className="text-[#edd382]/65 text-lg max-w-xl leading-relaxed mb-12">
          {description}
        </p>
        {children}
      </motion.div>
    </section>
  );
}
