"use client";

import { motion } from "framer-motion";
import { Mail, Phone } from "lucide-react";
import { GitHubIcon, LinkedInIcon, TwitterIcon } from "./icons";

const links = [
  {
    icon: Phone,
    href: "tel:+2348111279627",
    label: "+234 811 127 9627",
  },
  {
    icon: Mail,
    href: "mailto:aminuolawalekan@gmail.com",
    label: "aminuolawalekan@gmail.com",
  },
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
];

export default function Contact() {
  return (
    <section id="contact" className="py-36 px-6 sm:px-16 max-w-6xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        <p className="font-mono text-[#fc9e4f] text-sm">04. What&apos;s Next?</p>
        <h2 className="text-[#f2f3ae] text-4xl sm:text-5xl font-bold">
          Get In Touch
        </h2>
        <p className="text-[#edd382]/60 max-w-md mx-auto text-base leading-relaxed">
          Feel free to reach out through any of these channels. I&apos;ll make
          sure to get back to you.
        </p>

        <div className="pt-4">
          <a
            href="mailto:aminuolawalekan@gmail.com"
            className="inline-block font-mono text-sm text-[#fc9e4f] border border-[#fc9e4f] px-10 py-4 hover:bg-[#fc9e4f]/10 hover:shadow-[0_0_28px_rgba(252,158,79,0.18)] transition-all duration-300"
          >
            Say Hello
          </a>
        </div>

        <div className="flex items-center justify-center flex-wrap gap-8 pt-8">
          {links.map(({ icon: Icon, href, label }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              aria-label={label}
              className="flex items-center gap-2.5 text-[#edd382]/40 hover:text-[#fc9e4f] transition-all duration-200 group"
            >
              <span className="group-hover:scale-110 transition-transform duration-200">
                <Icon size={20} />
              </span>
              <span className="font-mono text-xs hidden sm:inline">{label}</span>
            </a>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
