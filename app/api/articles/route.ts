import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { articles } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { unauthorized, serverError, PUBLIC_CACHE } from "@/lib/api";
import { withAuth } from "@/lib/with-auth";
import { createUpdate } from "@/lib/updates";
import { logTelemetryEvent } from "@/lib/observability/server";
import { SECTION_LABEL, articleLink } from "@/lib/articles";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const adminMode = searchParams.get("admin") === "true";

  if (adminMode && !(await getSession())) return unauthorized();

  try {
    const db = getDb();
    const conditions = [];
    if (type) conditions.push(eq(articles.type, type));
    if (!adminMode) conditions.push(eq(articles.published, true));

    const rows = await db
      .select()
      .from(articles)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(articles.createdAt));

    const res = NextResponse.json(rows);
    if (!adminMode) res.headers.set("Cache-Control", PUBLIC_CACHE);
    return res;
  } catch (err) {
    console.error(err);
    return serverError();
  }
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
