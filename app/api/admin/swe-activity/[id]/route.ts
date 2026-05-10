import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sweActivity } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { unauthorized, notFound, badRequest, serverError } from "@/lib/api";
import { parseId } from "@/lib/validation";

/**
 * Updates an activity entry (message, note, scs).
 * Admin-only.
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const id = parseId((await params).id);
    if (!id) return badRequest("Invalid id");

    const body = await req.json();
    const { message, note, scs } = body;

    const db = getDb();
    const [updated] = await db
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
  } catch (err) {
    console.error(err);
    return serverError();
  }
}

/**
 * Deletes an activity entry.
 * Admin-only.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const id = parseId((await params).id);
    if (!id) return badRequest("Invalid id");

    const db = getDb();
    const [deleted] = await db
      .delete(sweActivity)
      .where(eq(sweActivity.id, id))
      .returning();

    if (!deleted) return notFound();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
