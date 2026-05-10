import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { astroGear } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { badRequest } from "@/lib/api";
import { withAuth } from "@/lib/with-auth";
import { parseId } from "@/lib/validation";

export const PATCH = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid id");

  const body = await req.json();
  if (!body.name?.trim()) return badRequest("Name is required");

  const update: Record<string, unknown> = { name: body.name.trim() };
  if ("link" in body)     update.link     = body.link?.trim() || null;
  if ("imageUrl" in body) update.imageUrl = body.imageUrl || null;

  const [item] = await getDb()
    .update(astroGear)
    .set(update)
    .where(eq(astroGear.id, id))
    .returning();
  return NextResponse.json(item);
});

export const DELETE = withAuth(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid id");

  await getDb().delete(astroGear).where(eq(astroGear.id, id));
  return NextResponse.json({ ok: true });
});
