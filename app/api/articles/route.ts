import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { articles } from "@/lib/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { unauthorized, withDb, PUBLIC_CACHE } from "@/lib/api";
import { withAuth } from "@/lib/with-auth";
import { createUpdate } from "@/lib/updates";
import { logTelemetryEvent } from "@/lib/observability/server";
import { SECTION_LABEL, articleLink } from "@/lib/articles";
import { paginatedResponse, paginationMeta, parsePagination } from "@/lib/pagination";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const adminMode = searchParams.get("admin") === "true";
  const allMode = searchParams.get("all") === "true";

  if (adminMode && !(await getSession())) return unauthorized();

  return withDb(async (db) => {
    const conditions = [];
    if (type) conditions.push(eq(articles.type, type));
    if (!adminMode) conditions.push(eq(articles.published, true));
    const where = conditions.length ? and(...conditions) : undefined;
    const { page: requestedPage, pageSize } = parsePagination(searchParams, adminMode ? 20 : 10);

    const [{ total }] = await db
      .select({ total: count() })
      .from(articles)
      .where(where);
    const totalItems = Number(total);

    if (allMode) {
      const rows = await db
        .select()
        .from(articles)
        .where(where)
        .orderBy(desc(articles.createdAt), desc(articles.id));

      const res = NextResponse.json(paginatedResponse(rows, 1, Math.max(totalItems, 1), totalItems));
      if (!adminMode) res.headers.set("Cache-Control", PUBLIC_CACHE);
      return res;
    }
    const meta = paginationMeta(requestedPage, pageSize, totalItems);

    const rows = await db
      .select()
      .from(articles)
      .where(where)
      .orderBy(desc(articles.createdAt), desc(articles.id))
      .limit(pageSize)
      .offset(meta.offset);

    const res = NextResponse.json(paginatedResponse(rows, meta.page, pageSize, meta.totalItems));
    if (!adminMode) res.headers.set("Cache-Control", PUBLIC_CACHE);
    return res;
  });
}


export const POST = withAuth(async (req: NextRequest) => {
  const { publishAsUpdate, ...body } = await req.json();
  const slug = body.slug || slugify(body.title);

  const [article] = await getDb()
    .insert(articles)
    .values({ ...body, slug })
    .returning();
  logTelemetryEvent({
    name: "admin.article.created",
    section: article.type,
    targetType: "article",
    targetId: article.id,
    attributes: { published: article.published, slug: article.slug },
  });
  if (publishAsUpdate) {
    const section = SECTION_LABEL[article.type] ?? article.type;
    await createUpdate({
      text: `Aminu published a new ${article.type === "writing" ? "book review" : "article"} — ${article.title} — in ${section}`,
      linkUrl: articleLink(article),
    });
  }
  return NextResponse.json(article, { status: 201 });
});
