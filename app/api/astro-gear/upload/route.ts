// Gear image upload endpoint — same client-side upload pattern as gallery/upload.
// See app/api/gallery/upload/route.ts for a full explanation of why images are
// uploaded directly from the browser rather than through this function.

import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSession } from "@/lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const body = (await req.json()) as HandleUploadBody;
  if (body.type === "blob.generate-client-token" && !(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const jsonResponse = await handleUpload({
    body,
    request: req,
    onBeforeGenerateToken: async () => ({
      allowedContentTypes: ALLOWED_TYPES,
      maximumSizeInBytes: 10 * 1024 * 1024, // 10 MB
      allowOverwrite: true,
    }),
    onUploadCompleted: async () => {},
  });
  return NextResponse.json(jsonResponse);
}
