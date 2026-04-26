"use client";

import {m} from "framer-motion";
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
    <section id="contact" className="py-20 sm:py-36 px-6 sm:px-16 max-w-6xl mx-auto text-center">
      <m.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="space-y-5 sm:space-y-6"
      >
        <p className="font-mono text-accent text-sm">04. What&apos;s Next?</p>
        <h2 className="text-surface text-3xl sm:text-4xl lg:text-5xl font-bold">
          Get In Touch
        </h2>
        <p className="text-muted/60 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
          Feel free to reach out through any of these channels. I&apos;ll make
          sure to get back to you.
        </p>

        <div className="pt-2 sm:pt-4">
          <a
            href="mailto:aminuolawalekan@gmail.com"
            className="inline-block font-mono text-sm text-accent border border-accent px-8 sm:px-10 py-3 sm:py-4 hover:bg-accent/10 hover:shadow-[0_0_28px_rgba(252,158,79,0.18)] transition-all duration-300"
          >
            Say Hello
          </a>
        </div>

        <div className="flex items-center justify-center flex-wrap gap-6 sm:gap-8 pt-6 sm:pt-8">
          {links.map(({ icon: Icon, href, label }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              aria-label={label}
              className="flex items-center gap-2 text-muted/40 hover:text-accent transition-all duration-200 group"
            >
              <span className="group-hover:scale-110 transition-transform duration-200">
                <Icon size={20} />
              </span>
              <span className="font-mono text-xs">{label}</span>
            </a>
          ))}
        </div>
      </m.div>
    </section>
  );
}
