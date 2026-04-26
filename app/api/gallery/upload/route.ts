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

export async function POST(req: NextRequest): Promise<Response> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Image storage is not configured (BLOB_READ_WRITE_TOKEN missing)." },
      { status: 503 }
    );
  }

  const body = (await req.json()) as HandleUploadBody;

  // Only check auth for token generation; upload-completed is called by Vercel Blob servers
  if (body.type === "blob.generate-client-token" && !(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_TYPES,
        maximumSizeInBytes: 25 * 1024 * 1024, // 25 MB
      }),
      onUploadCompleted: async () => {
        // no server-side post-processing needed
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("Blob upload error:", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
