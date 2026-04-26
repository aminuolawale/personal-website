import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { comments, articles } from "@/lib/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { getSession, getReaderSession } from "@/lib/auth";
import { unauthorized, badRequest, serverError, PUBLIC_CACHE } from "@/lib/api";

// GET ?articleId=123 — public: approved comments for one article.
// GET ?admin=true   — admin: all comments with article info for moderation.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const articleId = searchParams.get("articleId");
  const adminMode = searchParams.get("admin") === "true";

  if (adminMode && !(await getSession())) return unauthorized();
  if (!adminMode && !articleId) return badRequest("articleId required");

  try {
    const db = getDb();
    const conditions = [];
    if (articleId) conditions.push(eq(comments.articleId, Number(articleId)));
    if (!adminMode) conditions.push(eq(comments.approved, true));

    const rows = await db
      .select()
      .from(comments)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(comments.createdAt));

    if (adminMode && rows.length) {
      // Attach article title so the admin page can display context without extra fetches.
      const articleIds = [...new Set(rows.map((c) => c.articleId))];
      const arts = await db
        .select({ id: articles.id, title: articles.title, slug: articles.slug, type: articles.type })
        .from(articles)
        .where(inArray(articles.id, articleIds));
      const result = rows.map((c) => ({
        ...c,
        article: arts.find((a) => a.id === c.articleId) ?? null,
      }));
      return NextResponse.json(result);
    }

    const res = NextResponse.json(rows);
    if (!adminMode) res.headers.set("Cache-Control", PUBLIC_CACHE);
    return res;
  } catch {
    return serverError();
  }
}

// POST { articleId, content } — submit a comment (requires sign-in; awaits admin approval).
export async function POST(req: NextRequest) {
  const reader = await getReaderSession();
  if (!reader) return unauthorized();
  try {
    const { articleId, content } = await req.json();
    if (!articleId || !content?.trim()) return badRequest("articleId and content required");
    const db = getDb();
    const [comment] = await db
      .insert(comments)
      .values({
        articleId: Number(articleId),
        readerEmail: reader.email,
        readerName: reader.name,
        readerAvatarUrl: reader.image,
        content: content.trim(),
      })
      .returning();
    return NextResponse.json(comment, { status: 201 });
  } catch {
    return serverError();
  }
}
