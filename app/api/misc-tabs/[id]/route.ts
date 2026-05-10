import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { badRequest, notFound } from "@/lib/api";
import { withAuth } from "@/lib/with-auth";
import { getDb } from "@/lib/db";
import { articles, miscTabs } from "@/lib/schema";
import { slugify } from "@/lib/utils";
import { logTelemetryEvent } from "@/lib/observability/server";
import { cleanText, parseId } from "@/lib/validation";

export const PUT = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid tab id");

  const body = await req.json();
  const title = cleanText(body.title);
  const slug = cleanText(body.slug) || slugify(title);
  const description = cleanText(body.description);
  const position = Number(body.position ?? 99);

  if (!title) return badRequest("Tab title is required");
  if (!slug) return badRequest("Tab slug is required");
  if (!Number.isInteger(position)) return badRequest("Position must be a whole number");

  const [tab] = await getDb()
    .update(miscTabs)
    .set({ title, slug, description, position, updatedAt: new Date() })
    .where(eq(miscTabs.id, id))
    .returning();

  if (!tab) return notFound("Tab not found");
  logTelemetryEvent({
    name: "admin.misc_tab.updated",
    section: "misc",
    targetType: "misc_tab",
    targetId: tab.id,
    attributes: { slug: tab.slug, position: tab.position },
  });
  return NextResponse.json(tab);
});

export const DELETE = withAuth(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid tab id");

  const db = getDb();
  await db
    .update(articles)
    .set({ miscTabId: null, updatedAt: new Date() })
    .where(eq(articles.miscTabId, id));

  const [deleted] = await db.delete(miscTabs).where(eq(miscTabs.id, id)).returning();
  if (!deleted) return notFound("Tab not found");
  logTelemetryEvent({
    name: "admin.misc_tab.deleted",
    section: "misc",
    targetType: "misc_tab",
    targetId: id,
  });
  return NextResponse.json({ ok: true });
});
