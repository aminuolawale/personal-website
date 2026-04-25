"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import GalleryPhotoForm from "@/components/admin/GalleryPhotoForm";
import type { GalleryPhoto } from "@/lib/schema";

export default function EditGalleryPhotoPage() {
  const { id } = useParams<{ id: string }>();
  const [photo, setPhoto] = useState<GalleryPhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/gallery/${id}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then((d) => { if (d) setPhoto(d); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020122] flex items-center justify-center">
        <p className="font-mono text-xs text-[#edd382]/30">Loading…</p>
      </div>
    );
  }
  if (notFound || !photo) {
    return (
      <div className="min-h-screen bg-[#020122] flex items-center justify-center">
        <p className="font-mono text-sm text-[#edd382]/50">Photo not found.</p>
      </div>
    );
  }

  return <GalleryPhotoForm photo={photo} />;
}
