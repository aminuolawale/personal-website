"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { X, Calendar, Cpu, Layers, Wrench, ChevronLeft, ChevronRight, Maximize2, Link } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useFetchJson } from "@/lib/hooks/use-fetch-json";
import type { GalleryPhoto, ImageRegion } from "@/lib/schema";

function formatCapturedAt(raw: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleString("en-US", {
    year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className="text-accent/60 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="font-mono text-[10px] text-muted/40 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-muted/80 text-sm leading-relaxed">{value}</p>
      </div>
    </div>
  );
}

function LabelCarousel({
  regions,
  activeRegionId,
  onToggle,
}: {
  regions: ImageRegion[];
  activeRegionId: string | null;
  onToggle: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);

  function checkScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", checkScroll); ro.disconnect(); };
  }, [regions]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !activeRegionId) return;
    const btn = buttonRefs.current[activeRegionId];
    if (!btn) return;
    const offset = btn.offsetLeft - container.clientWidth / 2 + btn.offsetWidth / 2;
    container.scrollTo({ left: offset, behavior: "smooth" });
  }, [activeRegionId]);

  return (
    <>
      {/* Mobile: horizontal scrolling carousel */}
      <div className="relative w-full lg:hidden">
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 w-full"
        >
          {regions.map((r) => (
            <button
              key={r.id}
              ref={(el) => { buttonRefs.current[r.id] = el; }}
              type="button"
              onClick={() => onToggle(r.id)}
              className={`shrink-0 font-mono text-xs px-3 py-1.5 border transition-all ${
                activeRegionId === r.id
                  ? "bg-accent/10 border-accent/40 text-accent"
                  : "border-surface/20 text-muted/50 hover:border-accent/30 hover:text-muted/70"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-10 transition-opacity duration-200"
          style={{
            background: "linear-gradient(to right, transparent, var(--color-base))",
            opacity: canScrollRight ? 1 : 0,
          }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-10 transition-opacity duration-200"
          style={{
            background: "linear-gradient(to left, transparent, var(--color-base))",
            opacity: canScrollLeft ? 1 : 0,
          }}
        />
      </div>

      {/* Desktop: vertical list */}
      <div className="hidden lg:flex flex-col gap-1.5">
        {regions.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onToggle(r.id)}
            className={`font-mono text-xs px-3 py-1.5 border text-left transition-all ${
              activeRegionId === r.id
                ? "bg-accent/10 border-accent/40 text-accent"
                : "border-surface/20 text-muted/50 hover:border-accent/30 hover:text-muted/70"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </>
  );
}

function RegionOverlay({
  regions,
  activeRegionId,
}: {
  regions: ImageRegion[];
  activeRegionId: string | null;
}) {
  const activeRegion = regions.find((r) => r.id === activeRegionId) ?? null;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none"
    >

      {/* Spotlight when a region is active */}
      {activeRegion && (
        <>
          {/* Thin border on the active ellipse */}
          <ellipse
            cx={activeRegion.cx}
            cy={activeRegion.cy}
            rx={activeRegion.rx}
            ry={activeRegion.ry}
            fill="none"
            stroke="rgba(220,38,38,0.8)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}
    </svg>
  );
}

function Lightbox({ photo, onClose }: { photo: GalleryPhoto; onClose: () => void }) {
  const images = [photo.imageUrl, ...(photo.additionalImages ?? [])];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [activeRegionId, setActiveRegionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const allRegions = photo.regions ?? [];
  const imageRegions = allRegions.filter((r) => r.imageIndex === currentIdx);

  useEffect(() => {
    setActiveRegionId(null);
  }, [currentIdx]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeRegionId) { setActiveRegionId(null); return; }
        onClose();
      }
      if (e.key === "ArrowLeft") setCurrentIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setCurrentIdx((i) => Math.min(images.length - 1, i + 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, images.length, activeRegionId]);

  function handleImageClick() {
    const el = imgRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen?.();
    }
  }

  function toggleRegion(id: string) {
    setActiveRegionId((prev) => (prev === id ? null : id));
  }

  const touchStartX = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    touchStartX.current = null;
    if (Math.abs(delta) < 50) return;
    if (delta > 0) setCurrentIdx((i) => Math.min(images.length - 1, i + 1));
    else setCurrentIdx((i) => Math.max(0, i - 1));
  }

  return (
    <m.div
      className="fixed inset-0 z-50 flex items-stretch"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-base/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <m.div
        className="relative z-10 flex flex-col lg:flex-row w-full max-w-6xl mx-auto my-4 sm:my-8 overflow-hidden"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Image area */}
        <div
          className="lg:flex-1 bg-base flex flex-col items-center justify-center overflow-hidden gap-3 p-2"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Image + overlay */}
          <div className="relative group flex items-center justify-center w-full">
            {/* Wrapper auto-sizes to image so SVG overlay aligns exactly */}
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={images[currentIdx]}
                alt={photo.name}
                className="max-w-full max-h-[55vh] lg:max-h-[80vh] w-auto object-contain cursor-zoom-in block"
                onClick={handleImageClick}
              />
              {imageRegions.length > 0 && (
                <RegionOverlay
                  regions={imageRegions}
                  activeRegionId={activeRegionId}
                />
              )}
            </div>
            <button
              onClick={handleImageClick}
              className="absolute top-2 right-2 p-1.5 bg-base/60 text-muted/50 hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="View fullscreen"
            >
              <Maximize2 size={14} />
            </button>
          </div>

          {/* Multi-image navigation */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 pb-1">
              <button
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
                className="p-1 text-muted/40 hover:text-accent disabled:opacity-20 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i === currentIdx ? "bg-accent" : "bg-surface/30 hover:bg-surface/60"
                    }`}
                    aria-label={`Image ${i + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setCurrentIdx((i) => Math.min(images.length - 1, i + 1))}
                disabled={currentIdx === images.length - 1}
                className="p-1 text-muted/40 hover:text-accent disabled:opacity-20 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Details sidebar */}
        <div className="lg:w-80 xl:w-96 bg-base border-t lg:border-t-0 lg:border-l border-surface/20 flex flex-col overflow-y-auto shrink-0">
          <div className="p-5 border-b border-surface/10 space-y-3">
            <div className="flex items-start justify-between">
              <h2 className="text-surface font-bold text-lg leading-tight">{photo.name}</h2>
              <div className="flex items-center gap-2 ml-4 shrink-0 mt-0.5">
                <button
                  onClick={handleShare}
                  className="text-muted/40 hover:text-accent transition-colors"
                  aria-label="Copy link"
                >
                  {copied
                    ? <span className="font-mono text-[10px] text-accent">Copied</span>
                    : <Link size={15} />}
                </button>
                <button
                  onClick={onClose}
                  className="text-muted/40 hover:text-accent transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            {imageRegions.length > 0 && (
              <LabelCarousel
                regions={imageRegions}
                activeRegionId={activeRegionId}
                onToggle={toggleRegion}
              />
            )}
          </div>

          <div className="p-5 space-y-5 flex-1">
            {photo.description && (
              <p className="text-muted/65 text-sm leading-relaxed">{photo.description}</p>
            )}

            <div className="space-y-4 pt-1">
              <MetaRow icon={<Cpu size={14} />} label="Equipment" value={photo.equipment} />
              <MetaRow icon={<Calendar size={14} />} label="Captured" value={formatCapturedAt(photo.capturedAt)} />
              <MetaRow icon={<Layers size={14} />} label="Technique" value={photo.technique} />
              <MetaRow icon={<Wrench size={14} />} label="Software" value={photo.software} />
            </div>
          </div>
        </div>
      </m.div>

      {/* Close button (top-right) */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 text-muted/40 hover:text-accent transition-colors"
        aria-label="Close"
      >
        <X size={22} />
      </button>
    </m.div>
  );
}

export default function GalleryTab() {
  const { data: photos, isLoading } = useFetchJson<GalleryPhoto[]>("/api/gallery", []);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const selectedId = searchParams.get("photo");
  const selected = photos.find((p) => String(p.id) === selectedId) ?? null;

  const openPhoto = useCallback((photo: GalleryPhoto) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("photo", String(photo.id));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const handleClose = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("photo");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  if (isLoading) {
    return <p className="font-mono text-xs text-muted/30 py-16 text-center">Loading…</p>;
  }

  if (photos.length === 0) {
    return (
      <p className="font-mono text-sm text-muted/30 py-16 text-center">
        No photos published yet.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((photo, i) => (
          <m.button
            key={photo.id}
            className="w-full block group relative overflow-hidden cursor-pointer focus:outline-none aspect-square"
            onClick={() => openPhoto(photo)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
          >
            <Image
              src={photo.imageUrl}
              alt={photo.name}
              fill
              sizes="(min-width: 640px) 33vw, 50vw"
              className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-base/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
              <p className="text-surface font-semibold text-sm text-left leading-tight">{photo.name}</p>
            </div>
            {/* Multi-image indicator */}
            {(photo.additionalImages?.length ?? 0) > 0 && (
              <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {Array.from({ length: Math.min((photo.additionalImages?.length ?? 0) + 1, 4) }).map((_, i) => (
                  <span key={i} className="w-1 h-1 rounded-full bg-white/70" />
                ))}
              </div>
            )}
          </m.button>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && <Lightbox photo={selected} onClose={handleClose} />}
      </AnimatePresence>
    </>
  );
}
