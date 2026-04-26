import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { articles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { unauthorized, notFound, serverError } from "@/lib/api";

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
    if (!article) return notFound();
    return NextResponse.json(article);
  } catch {
    return serverError();
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) return unauthorized();

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
    await db.delete(articles).where(eq(articles.id, parseInt(id)));
    return NextResponse.json({ ok: true });
  } catch {
    return serverError();
  }
}
