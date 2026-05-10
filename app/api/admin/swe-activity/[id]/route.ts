import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sweActivity } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { notFound, badRequest } from "@/lib/api";
import { withAuth } from "@/lib/with-auth";
import { parseId } from "@/lib/validation";

export const PUT = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid id");

  const { message, note, scs } = await req.json();
  const [updated] = await getDb()
    .update(sweActivity)
    .set({
      message: message !== undefined ? message : undefined,
      note: note !== undefined ? note : undefined,
      scs: scs !== undefined ? scs : undefined,
      updatedAt: new Date(),
    })
    .where(eq(sweActivity.id, id))
    .returning();

  if (!updated) return notFound();
  return NextResponse.json(updated);
});

export const DELETE = withAuth(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid id");

  const [deleted] = await getDb()
    .delete(sweActivity)
    .where(eq(sweActivity.id, id))
    .returning();

  if (!deleted) return notFound();
  return NextResponse.json({ success: true });
});
