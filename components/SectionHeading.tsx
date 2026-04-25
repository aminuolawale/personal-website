"use client";

import { motion } from "framer-motion";

interface SectionHeadingProps {
  number: string;
  title: string;
}

export default function SectionHeading({ number, title }: SectionHeadingProps) {
  return (
    <motion.div
      className="flex items-center gap-6 mb-10 sm:mb-16"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="font-mono text-[#fc9e4f] text-xl sm:text-2xl whitespace-nowrap">
        <span className="text-sm sm:text-base mr-2 opacity-70">{number}.</span>
        {title}
      </h2>
      <div className="h-px bg-[#f2f3ae]/15 flex-1 max-w-xs" />
    </motion.div>
  );
}
