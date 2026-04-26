import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { articles } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { notFound, serverError, PUBLIC_CACHE } from "@/lib/api";

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

    if (!article) return notFound();
    const res = NextResponse.json(article);
    res.headers.set("Cache-Control", PUBLIC_CACHE);
    return res;
  } catch {
    return serverError();
  }
}
