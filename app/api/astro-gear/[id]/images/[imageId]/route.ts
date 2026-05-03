import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { gearImages } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { unauthorized, serverError } from "@/lib/api";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ imageId: string }> },
) {
  if (!(await getSession())) return unauthorized();
  const { imageId } = await params;
  try {
    const body = await req.json();
    const update: Record<string, unknown> = {};
    if ("description" in body) update.description = String(body.description ?? "");
    if ("marquee" in body) update.marquee = body.marquee ?? null;
    const db = getDb();
    const [row] = await db
      .update(gearImages)
      .set(update)
      .where(eq(gearImages.id, parseInt(imageId)))
      .returning();
    return NextResponse.json(row);
  } catch {
    return serverError();
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ imageId: string }> },
) {
  if (!(await getSession())) return unauthorized();
  const { imageId } = await params;
  try {
    const db = getDb();
    await db.delete(gearImages).where(eq(gearImages.id, parseInt(imageId)));
    return NextResponse.json({ ok: true });
  } catch {
    return serverError();
  }
}
