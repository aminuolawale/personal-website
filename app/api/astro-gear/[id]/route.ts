import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { astroGear } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { unauthorized, badRequest, serverError } from "@/lib/api";
import { parseId } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSession())) return unauthorized();
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Invalid id");
  try {
    const body = await req.json();
    if (!body.name?.trim()) return badRequest("Name is required");
    const update: Record<string, unknown> = { name: body.name.trim() };
    if ("link" in body)     update.link     = body.link?.trim() || null;
    if ("imageUrl" in body) update.imageUrl = body.imageUrl || null;
    const db = getDb();
    const [item] = await db
      .update(astroGear)
      .set(update)
      .where(eq(astroGear.id, id))
      .returning();
    return NextResponse.json(item);
  } catch {
    return serverError();
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSession())) return unauthorized();
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Invalid id");
  try {
    const db = getDb();
    await db.delete(astroGear).where(eq(astroGear.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return serverError();
  }
}
