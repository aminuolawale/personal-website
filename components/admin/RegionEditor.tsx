"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import type { ImageRegion } from "@/lib/schema";

interface Props {
  imageUrl: string;
  imageIndex: number;
  regions: ImageRegion[];
  onChange: (regions: ImageRegion[]) => void;
}

interface DrawState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export default function RegionEditor({ imageUrl, imageIndex, regions, onChange }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [drawing, setDrawing] = useState<DrawState | null>(null);
  const [pending, setPending] = useState<{ cx: number; cy: number; rx: number; ry: number } | null>(null);
  const [labelInput, setLabelInput] = useState("");

  const myRegions = regions.filter((r) => r.imageIndex === imageIndex);

  function getCoords(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }

  function handleMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    if (!isEditMode) return;
    e.preventDefault();
    const { x, y } = getCoords(e);
    setDrawing({ startX: x, startY: y, currentX: x, currentY: y });
    setPending(null);
    setLabelInput("");
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!drawing) return;
    const { x, y } = getCoords(e);
    setDrawing((d) => (d ? { ...d, currentX: x, currentY: y } : null));
  }

  function handleMouseUp() {
    if (!drawing) return;
    const cx = (drawing.startX + drawing.currentX) / 2;
    const cy = (drawing.startY + drawing.currentY) / 2;
    const rx = Math.abs(drawing.currentX - drawing.startX) / 2;
    const ry = Math.abs(drawing.currentY - drawing.startY) / 2;
    setDrawing(null);
    if (rx > 1 && ry > 1) {
      setPending({ cx, cy, rx, ry });
      setTimeout(() => labelInputRef.current?.focus(), 0);
    }
  }

  function confirmLabel() {
    if (!pending || !labelInput.trim()) return;
    const newRegion: ImageRegion = {
      id: crypto.randomUUID(),
      imageIndex,
      label: labelInput.trim(),
      ...pending,
    };
    onChange([...regions, newRegion]);
    setPending(null);
    setLabelInput("");
  }

  function deleteRegion(id: string) {
    onChange(regions.filter((r) => r.id !== id));
  }

  const liveEllipse = drawing
    ? {
        cx: (drawing.startX + drawing.currentX) / 2,
        cy: (drawing.startY + drawing.currentY) / 2,
        rx: Math.abs(drawing.currentX - drawing.startX) / 2,
        ry: Math.abs(drawing.currentY - drawing.startY) / 2,
      }
    : null;

  return (
    <div className="space-y-3">
      {/* Image + SVG overlay */}
      <div className="relative select-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="w-full block" draggable={false} />

        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
          style={{ cursor: isEditMode ? "crosshair" : "default" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {myRegions.map((r) => (
            <ellipse
              key={r.id}
              cx={r.cx}
              cy={r.cy}
              rx={r.rx}
              ry={r.ry}
              fill="rgba(0,255,136,0.08)"
              stroke="#00ff88"
              strokeWidth="1"
              strokeDasharray="4 2"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {liveEllipse && liveEllipse.rx > 0 && liveEllipse.ry > 0 && (
            <ellipse
              cx={liveEllipse.cx}
              cy={liveEllipse.cy}
              rx={liveEllipse.rx}
              ry={liveEllipse.ry}
              fill="rgba(0,255,136,0.12)"
              stroke="#00ff88"
              strokeWidth="1"
              strokeDasharray="4 2"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {pending && (
            <ellipse
              cx={pending.cx}
              cy={pending.cy}
              rx={pending.rx}
              ry={pending.ry}
              fill="rgba(0,255,136,0.15)"
              stroke="#00ff88"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {/* Label overlays */}
        <div className="absolute inset-0 pointer-events-none">
          {myRegions.map((r) => (
            <span
              key={r.id}
              style={{
                position: "absolute",
                left: `${r.cx}%`,
                top: `${Math.max(0, r.cy - r.ry)}%`,
                transform: "translate(-50%, -100%)",
              }}
              className="font-mono text-[9px] bg-base/75 text-accent px-1.5 py-0.5 whitespace-nowrap leading-none"
            >
              {r.label}
            </span>
          ))}
        </div>
      </div>

      {/* Label input after drawing */}
      {pending && (
        <div className="flex gap-2">
          <input
            ref={labelInputRef}
            type="text"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmLabel();
              if (e.key === "Escape") { setPending(null); setLabelInput(""); }
            }}
            placeholder="Label for this region…"
            className="flex-1 bg-surface/[0.04] border border-surface/20 px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-accent/50"
          />
          <button
            type="button"
            onClick={confirmLabel}
            disabled={!labelInput.trim()}
            className="px-3 py-1.5 bg-accent text-base text-xs font-mono disabled:opacity-40"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => { setPending(null); setLabelInput(""); }}
            className="px-3 py-1.5 border border-surface/20 text-xs font-mono text-muted/50"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Edit mode toggle */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setIsEditMode((v) => !v);
            setPending(null);
            setDrawing(null);
          }}
          className={`font-mono text-xs px-3 py-1.5 border transition-all ${
            isEditMode
              ? "bg-accent text-base border-accent"
              : "border-surface/20 text-muted/50 hover:border-accent/40"
          }`}
        >
          {isEditMode ? "Done" : "Draw a region"}
        </button>
        {isEditMode && (
          <span className="font-mono text-[10px] text-muted/35">click and drag to draw an ellipse</span>
        )}
        {!isEditMode && myRegions.length > 0 && (
          <span className="font-mono text-[10px] text-muted/35">
            {myRegions.length} label{myRegions.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Label chips */}
      {myRegions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {myRegions.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-1.5 border border-surface/15 bg-surface/[0.04] px-2 py-1"
            >
              <span className="font-mono text-[11px] text-muted/65">{r.label}</span>
              <button
                type="button"
                onClick={() => deleteRegion(r.id)}
                className="text-muted/30 hover:text-red-400 transition-colors"
                aria-label={`Remove ${r.label}`}
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
