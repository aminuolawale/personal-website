import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { comments } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { notFound, badRequest } from "@/lib/api";
import { withAuth } from "@/lib/with-auth";
import { parseId } from "@/lib/validation";

export const PUT = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid id");

  const { approved } = await req.json();
  const [comment] = await getDb()
    .update(comments)
    .set({ approved })
    .where(eq(comments.id, id))
    .returning();
  if (!comment) return notFound();
  return NextResponse.json(comment);
});

export const DELETE = withAuth(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid id");

  await getDb().delete(comments).where(eq(comments.id, id));
  return NextResponse.json({ ok: true });
});
