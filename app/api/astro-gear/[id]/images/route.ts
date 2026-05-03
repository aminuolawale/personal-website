import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { gearImages } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { unauthorized, badRequest, serverError } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(gearImages)
      .where(eq(gearImages.gearId, parseInt(id)))
      .orderBy(asc(gearImages.position), asc(gearImages.createdAt));
    return NextResponse.json(rows);
  } catch {
    return serverError();
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSession())) return unauthorized();
  const { id } = await params;
  try {
    const { imageUrl, description, marquee, position } = await req.json();
    if (!imageUrl?.trim()) return badRequest("imageUrl is required");
    const db = getDb();
    const [row] = await db
      .insert(gearImages)
      .values({
        gearId: parseInt(id),
        imageUrl: imageUrl.trim(),
        description: description?.trim() ?? "",
        marquee: marquee ?? null,
        position: position ?? 0,
      })
      .returning();
    return NextResponse.json(row, { status: 201 });
  } catch {
    return serverError();
  }
}
