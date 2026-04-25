import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { galleryPhotos } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const db = getDb();
    const [photo] = await db.select().from(galleryPhotos).where(eq(galleryPhotos.id, Number(id)));
    if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(photo);
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await req.json();
    const db = getDb();
    const [photo] = await db
      .update(galleryPhotos)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(galleryPhotos.id, Number(id)))
      .returning();
    if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(photo);
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const db = getDb();
    await db.delete(galleryPhotos).where(eq(galleryPhotos.id, Number(id)));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
