import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { gearImages } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { badRequest, serverError } from "@/lib/api";
import { withAuth } from "@/lib/with-auth";
import { parseId } from "@/lib/validation";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid id");
  try {
    const rows = await getDb()
      .select()
      .from(gearImages)
      .where(eq(gearImages.gearId, id))
      .orderBy(asc(gearImages.position), asc(gearImages.createdAt));
    return NextResponse.json(rows);
  } catch {
    return serverError();
  }
}

export const POST = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid id");

  const { imageUrl, description, marquee, position } = await req.json();
  if (!imageUrl?.trim()) return badRequest("imageUrl is required");

  const [row] = await getDb()
    .insert(gearImages)
    .values({
      gearId: id,
      imageUrl: imageUrl.trim(),
      description: description?.trim() ?? "",
      marquee: marquee ?? null,
      position: position ?? 0,
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
});
