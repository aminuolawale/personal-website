import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { articles, siteUpdates } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const adminMode = searchParams.get("admin") === "true";

  if (adminMode && !(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    if (!adminMode) {
      res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    }
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

const SECTION_LABEL: Record<string, string> = {
  writing: "Writing",
  astrophotography: "Astrophotography",
  swe: "SWE",
};

export async function POST(req: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { publishAsUpdate, ...body } = await req.json();
  const slug = body.slug || slugify(body.title);

  try {
    const db = getDb();
    const [article] = await db
      .insert(articles)
      .values({ ...body, slug })
      .returning();
    if (publishAsUpdate) {
      const section = SECTION_LABEL[article.type] ?? article.type;
      const linkUrl = `/${article.type === "swe" ? "swe" : article.type}/${article.slug}`;
      await db.insert(siteUpdates).values({
        text: `Aminu published a new article — ${article.title} — in ${section}`,
        linkUrl,
      });
    }
    return NextResponse.json(article, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

