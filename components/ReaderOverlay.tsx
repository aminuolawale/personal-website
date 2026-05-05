"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ExternalLink, X } from "lucide-react";
import RichTextContent from "@/components/RichTextContent";

interface ReaderOverlayProps {
  open: boolean;
  title: string;
  meta?: string;
  html: string;
  href?: string;
  onClose: () => void;
}

export default function ReaderOverlay({
  open,
  title,
  meta,
  html,
  href,
  onClose,
}: ReaderOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-base text-muted">
      <div className="h-full overflow-y-auto">
        <header className="sticky top-0 z-10 border-b border-surface/10 bg-base/95 backdrop-blur-md">
          <div className="max-w-3xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              {meta && (
                <p className="font-mono text-[10px] text-muted/35 uppercase tracking-widest truncate">
                  {meta}
                </p>
              )}
              <h1 className="mt-1 text-surface text-base sm:text-lg font-semibold leading-snug truncate">
                {title}
              </h1>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {href && (
                <Link
                  href={href}
                  className="p-2 text-muted/40 hover:text-accent transition-colors"
                  title="Open page"
                >
                  <ExternalLink size={17} />
                </Link>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-muted/45 hover:text-accent transition-colors"
                aria-label="Close reader"
                title="Close"
              >
                <X size={19} />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
          <div className="mb-8 sm:mb-10 border-b border-surface/10 pb-6">
            <h2 className="text-surface text-3xl sm:text-5xl font-bold leading-tight">
              {title}
            </h2>
            {meta && <p className="mt-4 font-mono text-xs text-muted/40">{meta}</p>}
          </div>
          <RichTextContent html={html} />
        </main>
      </div>
    </div>
  );
}
