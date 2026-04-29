import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { comments, articles } from "@/lib/schema";
import { asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { unauthorized, serverError } from "@/lib/api";

export type ReaderProfile = {
  email: string;
  name: string | null;
  avatarUrl: string | null;
  country: string | null;
  firstSeen: string;
  commentCount: number;
  comments: Array<{
    id: number;
    articleId: number;
    content: string;
    approved: boolean;
    createdAt: string;
    article: { id: number; title: string; slug: string; type: string } | null;
  }>;
};

export async function GET() {
  if (!(await getSession())) return unauthorized();
  try {
    const db = getDb();
    const [allComments, allArticles] = await Promise.all([
      db.select().from(comments).orderBy(asc(comments.createdAt)),
      db.select({ id: articles.id, title: articles.title, slug: articles.slug, type: articles.type }).from(articles),
    ]);

    const articleMap = new Map(allArticles.map((a) => [a.id, a]));
    const readerMap = new Map<string, ReaderProfile>();

    for (const c of allComments) {
      if (!readerMap.has(c.readerEmail)) {
        readerMap.set(c.readerEmail, {
          email: c.readerEmail,
          name: c.readerName ?? null,
          avatarUrl: c.readerAvatarUrl ?? null,
          country: c.country ?? null,
          firstSeen: c.createdAt.toISOString(),
          commentCount: 0,
          comments: [],
        });
      }
      const r = readerMap.get(c.readerEmail)!;
      if (new Date(c.createdAt) < new Date(r.firstSeen)) r.firstSeen = c.createdAt.toISOString();
      r.name = r.name ?? c.readerName ?? null;
      r.avatarUrl = r.avatarUrl ?? c.readerAvatarUrl ?? null;
      r.country = r.country ?? c.country ?? null;
      r.commentCount++;
      r.comments.push({
        id: c.id,
        articleId: c.articleId,
        content: c.content,
        approved: c.approved,
        createdAt: c.createdAt.toISOString(),
        article: articleMap.get(c.articleId) ?? null,
      });
    }

    const readers = [...readerMap.values()].sort(
      (a, b) => new Date(b.firstSeen).getTime() - new Date(a.firstSeen).getTime()
    );

    return NextResponse.json({ readers, total: readers.length });
  } catch (err) {
    console.error("GET /api/admin/analytics:", err);
    return serverError();
  }
}
