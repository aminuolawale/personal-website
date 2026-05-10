import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { siteUpdates } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { badRequest } from "@/lib/api";
import { withAuth } from "@/lib/with-auth";
import { parseId } from "@/lib/validation";

export const PUT = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid id");

  const { text } = await req.json();
  if (!text?.trim()) return badRequest("text is required");

  const [row] = await getDb()
    .update(siteUpdates)
    .set({ text: text.trim() })
    .where(eq(siteUpdates.id, id))
    .returning();
  return NextResponse.json(row);
});

export const DELETE = withAuth(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid id");

  await getDb().delete(siteUpdates).where(eq(siteUpdates.id, id));
  return NextResponse.json({ ok: true });
});
