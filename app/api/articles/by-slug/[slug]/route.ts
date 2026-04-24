import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { articles } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const type = new URL(req.url).searchParams.get("type");

  try {
    const db = getDb();
    const conditions = [eq(articles.slug, slug), eq(articles.published, true)];
    if (type) conditions.push(eq(articles.type, type));

    const [article] = await db
      .select()
      .from(articles)
      .where(and(...conditions));

    if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(article);
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
