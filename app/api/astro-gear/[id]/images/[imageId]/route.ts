import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { gearImages } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { badRequest } from "@/lib/api";
import { withAuth } from "@/lib/with-auth";
import { parseId } from "@/lib/validation";

export const PATCH = withAuth(async (req: NextRequest, { params }: { params: Promise<{ imageId: string }> }) => {
  const imageId = parseId((await params).imageId);
  if (!imageId) return badRequest("Invalid id");

  const body = await req.json();
  const update: Record<string, unknown> = {};
  if ("description" in body) update.description = String(body.description ?? "");
  if ("marquee" in body) update.marquee = body.marquee ?? null;

  const [row] = await getDb()
    .update(gearImages)
    .set(update)
    .where(eq(gearImages.id, imageId))
    .returning();
  return NextResponse.json(row);
});

export const DELETE = withAuth(async (_req: NextRequest, { params }: { params: Promise<{ imageId: string }> }) => {
  const imageId = parseId((await params).imageId);
  if (!imageId) return badRequest("Invalid id");

  await getDb().delete(gearImages).where(eq(gearImages.id, imageId));
  return NextResponse.json({ ok: true });
});
