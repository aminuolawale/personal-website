"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function compactPages(page: number, totalPages: number): Array<number | "..."> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = Array.from(pages)
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

  return sorted.flatMap((value, index) => {
    const previous = sorted[index - 1];
    if (!previous || value - previous === 1) return [value];
    return ["..." as const, value];
  });
}

export default function Pagination({ page, totalPages, onPageChange, className = "" }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = compactPages(page, totalPages);
  const buttonBase = "inline-flex h-9 min-w-9 items-center justify-center border border-surface/15 px-2 font-mono text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-35";

  return (
    <nav
      className={`flex flex-wrap items-center justify-center gap-2 ${className}`}
      aria-label="Pagination"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={`${buttonBase} text-muted/55 hover:border-accent/40 hover:text-accent`}
        aria-label="Previous page"
      >
        <ChevronLeft size={15} />
      </button>

      {pages.map((value, index) => (
        value === "..." ? (
          <span
            key={`ellipsis-${index}`}
            className="inline-flex h-9 min-w-6 items-center justify-center font-mono text-xs text-muted/30"
          >
            ...
          </span>
        ) : (
          <button
            key={value}
            type="button"
            onClick={() => onPageChange(value)}
            aria-current={value === page ? "page" : undefined}
            className={`${buttonBase} ${
              value === page
                ? "border-accent bg-accent text-base"
                : "text-muted/55 hover:border-accent/40 hover:text-accent"
            }`}
          >
            {value}
          </button>
        )
      ))}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={`${buttonBase} text-muted/55 hover:border-accent/40 hover:text-accent`}
        aria-label="Next page"
      >
        <ChevronRight size={15} />
      </button>
    </nav>
  );
}
