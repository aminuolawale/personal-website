"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const FinderPreviewPlayer = dynamic(() => import("@/components/astrophotography/FinderPreviewPlayer"), { ssr: false });

interface RichTextContentProps {
  html: string;
  className?: string;
}

async function renderMath(html: string) {
  if (typeof window === "undefined") return html;
  if (!html.includes("data-latex-formula")) return html;

  const katex = await import("katex");
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
        output: "mathml",
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
  const [renderedHtml, setRenderedHtml] = useState(html);

  useEffect(() => {
    let cancelled = false;
    renderMath(html).then((nextHtml) => {
      if (!cancelled) setRenderedHtml(nextHtml);
    });
    return () => {
      cancelled = true;
    };
  }, [html]);

  const parts = renderedHtml.split(/(<div\b[^>]*data-finder-preview-id="[^"]+"[^>]*>[\s\S]*?<\/div>)/gi);

  return (
    <div className={`article-content ${className}`}>
      {parts.map((part, index) => {
        const match = part.match(/data-finder-preview-id="(\d+)"/i);
        if (match) {
          return <FinderPreviewPlayer key={`${match[1]}-${index}`} previewId={Number(match[1])} compact />;
        }
        return <div key={index} dangerouslySetInnerHTML={{ __html: part }} />;
      })}
    </div>
  );
}
