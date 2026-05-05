"use client";

import { useMemo } from "react";
import katex from "katex";

interface RichTextContentProps {
  html: string;
  className?: string;
}

function renderMath(html: string) {
  if (typeof window === "undefined") return html;

  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll<HTMLElement>("[data-latex-formula]").forEach((node) => {
    const latex = node.dataset.latex ?? node.textContent ?? "";
    const displayMode = node.dataset.display === "block";
    try {
      node.innerHTML = katex.renderToString(latex, {
        displayMode,
        throwOnError: false,
        strict: false,
        trust: false,
        output: "htmlAndMathml",
      });
      node.classList.add("latex-formula-rendered");
    } catch {
      node.textContent = latex;
      node.classList.add("latex-formula-error");
    }
  });

  return doc.body.innerHTML;
}

export default function RichTextContent({ html, className = "" }: RichTextContentProps) {
  const renderedHtml = useMemo(() => renderMath(html), [html]);

  return (
    <div
      className={`article-content ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}
