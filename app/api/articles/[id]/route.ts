import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { articles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { notFound, badRequest, serverError } from "@/lib/api";
import { withAuth } from "@/lib/with-auth";
import { logTelemetryEvent } from "@/lib/observability/server";
import { createUpdate } from "@/lib/updates";
import { SECTION_LABEL, articleLink } from "@/lib/articles";
import { parseId } from "@/lib/validation";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Invalid id");
  try {
    const [article] = await getDb().select().from(articles).where(eq(articles.id, id));
    if (!article) return notFound();
    return NextResponse.json(article);
  } catch {
    return serverError();
  }
}

export const PUT = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid id");

  const { publishAsUpdate, ...body } = await req.json();
  const [article] = await getDb()
    .update(articles)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(articles.id, id))
    .returning();
  if (article) {
    logTelemetryEvent({
      name: "admin.article.updated",
      section: article.type,
      targetType: "article",
      targetId: article.id,
      attributes: { published: article.published, slug: article.slug },
    });
    if (publishAsUpdate) {
      const section = SECTION_LABEL[article.type] ?? article.type;
      await createUpdate({
        text: `Aminu updated ${article.type === "writing" ? "a book review" : "an article"} — ${article.title} — in ${section}`,
        linkUrl: articleLink(article),
      });
    }
  }
  return NextResponse.json(article);
});

export const DELETE = withAuth(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid id");

  await getDb().delete(articles).where(eq(articles.id, id));
  logTelemetryEvent({
    name: "admin.article.deleted",
    targetType: "article",
    targetId: id,
  });
  return NextResponse.json({ ok: true });
});
