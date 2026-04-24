import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { articles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const db = getDb();
    const [article] = await db
      .select()
      .from(articles)
      .where(eq(articles.id, parseInt(id)));
    if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(article);
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  try {
    const db = getDb();
    const [article] = await db
      .update(articles)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(articles.id, parseInt(id)))
      .returning();
    return NextResponse.json(article);
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const db = getDb();
    await db.delete(articles).where(eq(articles.id, parseInt(id)));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
