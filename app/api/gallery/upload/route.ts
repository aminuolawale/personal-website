import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/auth";

const MIME_FROM_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  tif: "image/tiff",
  tiff: "image/tiff",
  gif: "image/gif",
};

const ALLOWED_MIME = new Set(Object.values(MIME_FROM_EXT));

function resolveContentType(file: File): string | null {
  if (file.type && ALLOWED_MIME.has(file.type)) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_FROM_EXT[ext] ?? null;
}

export async function POST(req: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Image storage is not configured. Add BLOB_READ_WRITE_TOKEN to your environment variables (create a Vercel Blob store in the Vercel dashboard)." },
      { status: 503 }
    );
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const contentType = resolveContentType(file);
  if (!contentType) {
    return NextResponse.json(
      { error: `Unsupported file type "${file.type || file.name.split(".").pop()}". Use JPEG, PNG, WebP, TIFF, or GIF.` },
      { status: 400 }
    );
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const blob = await put(`gallery/${Date.now()}-${file.name}`, arrayBuffer, {
      access: "public",
      contentType,
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("Blob upload error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
