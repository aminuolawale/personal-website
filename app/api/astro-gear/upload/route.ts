// Gear image upload endpoint — same client-side upload pattern as gallery/upload.
// See app/api/gallery/upload/route.ts for a full explanation of why images are
// uploaded directly from the browser rather than through this function.

import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSession } from "@/lib/auth";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
  "image/gif",
];

export async function POST(req: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Image storage is not configured (BLOB_READ_WRITE_TOKEN missing)." },
      { status: 503 }
    );
  }

  try {
    const body = (await req.json()) as HandleUploadBody;
    if (body.type === "blob.generate-client-token" && !(await getSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_TYPES,
        maximumSizeInBytes: 20 * 1024 * 1024, // 20 MB
        allowOverwrite: true,
      }),
      onUploadCompleted: async () => {
        // No server-side post-processing needed
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("Astro gear upload error:", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
