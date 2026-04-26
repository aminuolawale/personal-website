import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { bookmarks, articles } from "@/lib/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getReaderSession } from "@/lib/auth";
import { unauthorized, badRequest, serverError } from "@/lib/api";

// GET — returns all bookmarked articles for the signed-in reader.
export async function GET() {
  const reader = await getReaderSession();
  if (!reader) return unauthorized();
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.readerEmail, reader.email));
    if (!rows.length) return NextResponse.json([]);
    const articleIds = rows.map((r) => r.articleId);
    const arts = await db.select().from(articles).where(inArray(articles.id, articleIds));
    const result = rows.map((b) => ({
      ...b,
      article: arts.find((a) => a.id === b.articleId) ?? null,
    }));
    return NextResponse.json(result);
  } catch {
    return serverError();
  }
}

// POST { articleId } — add a bookmark.
export async function POST(req: NextRequest) {
  const reader = await getReaderSession();
  if (!reader) return unauthorized();
  try {
    const { articleId } = await req.json();
    if (!articleId) return badRequest("articleId required");
    const db = getDb();
    await db
      .insert(bookmarks)
      .values({ readerEmail: reader.email, articleId: Number(articleId) })
      .onConflictDoNothing();
    return NextResponse.json({ bookmarked: true });
  } catch {
    return serverError();
  }
}

// DELETE ?articleId=123 — remove a bookmark.
export async function DELETE(req: NextRequest) {
  const reader = await getReaderSession();
  if (!reader) return unauthorized();
  const articleId = new URL(req.url).searchParams.get("articleId");
  if (!articleId) return badRequest("articleId required");
  try {
    const db = getDb();
    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.readerEmail, reader.email), eq(bookmarks.articleId, Number(articleId))));
    return NextResponse.json({ bookmarked: false });
  } catch {
    return serverError();
  }
}
