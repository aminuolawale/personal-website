import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { galleryPhotos } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { unauthorized, notFound, serverError } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) return unauthorized();
  const { id } = await params;
  try {
    const db = getDb();
    const [photo] = await db.select().from(galleryPhotos).where(eq(galleryPhotos.id, Number(id)));
    if (!photo) return notFound();
    return NextResponse.json(photo);
  } catch {
    return serverError();
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) return unauthorized();
  const { id } = await params;
  try {
    const body = await req.json();
    const db = getDb();
    const [photo] = await db
      .update(galleryPhotos)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(galleryPhotos.id, Number(id)))
      .returning();
    if (!photo) return notFound();
    return NextResponse.json(photo);
  } catch {
    return serverError();
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) return unauthorized();
  const { id } = await params;
  try {
    const db = getDb();
    await db.delete(galleryPhotos).where(eq(galleryPhotos.id, Number(id)));
    return NextResponse.json({ ok: true });
  } catch {
    return serverError();
  }
}
