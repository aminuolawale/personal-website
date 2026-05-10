import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { comments } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { unauthorized, notFound, badRequest, serverError } from "@/lib/api";
import { parseId } from "@/lib/validation";

// PUT { approved: true | false } — admin approves or rejects a comment.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) return unauthorized();
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Invalid id");
  try {
    const { approved } = await req.json();
    const db = getDb();
    const [comment] = await db
      .update(comments)
      .set({ approved })
      .where(eq(comments.id, id))
      .returning();
    if (!comment) return notFound();
    return NextResponse.json(comment);
  } catch {
    return serverError();
  }
}

// DELETE — admin permanently removes a comment.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) return unauthorized();
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Invalid id");
  try {
    const db = getDb();
    await db.delete(comments).where(eq(comments.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return serverError();
  }
}
