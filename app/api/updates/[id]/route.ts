import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { siteUpdates } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { unauthorized, badRequest, serverError } from "@/lib/api";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) return unauthorized();
  const { id } = await params;
  try {
    const { text } = await req.json();
    if (!text?.trim()) return badRequest("text is required");
    const db = getDb();
    const [row] = await db
      .update(siteUpdates)
      .set({ text: text.trim() })
      .where(eq(siteUpdates.id, parseInt(id)))
      .returning();
    return NextResponse.json(row);
  } catch {
    return serverError();
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) return unauthorized();
  const { id } = await params;
  try {
    const db = getDb();
    await db.delete(siteUpdates).where(eq(siteUpdates.id, parseInt(id)));
    return NextResponse.json({ ok: true });
  } catch {
    return serverError();
  }
}
