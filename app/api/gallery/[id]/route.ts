import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { galleryPhotos } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { notFound, badRequest } from "@/lib/api";
import { withAuth } from "@/lib/with-auth";
import { parseId } from "@/lib/validation";

export const GET = withAuth(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid id");

  const [photo] = await getDb().select().from(galleryPhotos).where(eq(galleryPhotos.id, id));
  if (!photo) return notFound();
  return NextResponse.json(photo);
});

export const PUT = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid id");

  const body = await req.json();
  const [photo] = await getDb()
    .update(galleryPhotos)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(galleryPhotos.id, id))
    .returning();
  if (!photo) return notFound();
  return NextResponse.json(photo);
});

export const DELETE = withAuth(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid id");

  await getDb().delete(galleryPhotos).where(eq(galleryPhotos.id, id));
  return NextResponse.json({ ok: true });
});
