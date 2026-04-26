import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { comments } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { unauthorized, notFound, serverError } from "@/lib/api";

// PUT { approved: true | false } — admin approves or rejects a comment.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) return unauthorized();
  const { id } = await params;
  try {
    const { approved } = await req.json();
    const db = getDb();
    const [comment] = await db
      .update(comments)
      .set({ approved })
      .where(eq(comments.id, parseInt(id)))
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
  const { id } = await params;
  try {
    const db = getDb();
    await db.delete(comments).where(eq(comments.id, parseInt(id)));
    return NextResponse.json({ ok: true });
  } catch {
    return serverError();
  }
}
