import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { articles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { unauthorized, notFound, badRequest, serverError } from "@/lib/api";
import { parseId } from "@/lib/validation";
import { logTelemetryEvent } from "@/lib/observability/server";
import { createUpdate } from "@/lib/updates";
import { SECTION_LABEL, articleLink } from "@/lib/articles";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Invalid id");
  try {
    const db = getDb();
    const [article] = await db
      .select()
      .from(articles)
      .where(eq(articles.id, id));
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

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Invalid id");
  const { publishAsUpdate, ...body } = await req.json();

  try {
    const db = getDb();
    const [article] = await db
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
  } catch {
    return serverError();
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) return unauthorized();

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Invalid id");
  try {
    const db = getDb();
    await db.delete(articles).where(eq(articles.id, id));
    logTelemetryEvent({
      name: "admin.article.deleted",
      targetType: "article",
      targetId: id,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return serverError();
  }
}
