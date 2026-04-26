import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { siteUpdates } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "text is required" }, { status: 400 });
  const db = getDb();
  const [row] = await db
    .update(siteUpdates)
    .set({ text: text.trim() })
    .where(eq(siteUpdates.id, parseInt(id)))
    .returning();
  return NextResponse.json(row);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const db = getDb();
  await db.delete(siteUpdates).where(eq(siteUpdates.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
