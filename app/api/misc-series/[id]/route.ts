import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { badRequest, notFound } from "@/lib/api";
import { withAuth } from "@/lib/with-auth";
import { getDb } from "@/lib/db";
import { articles, miscSeries } from "@/lib/schema";
import { logTelemetryEvent } from "@/lib/observability/server";
import { cleanText, parseId } from "@/lib/validation";

export const PUT = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid series id");

  const body = await req.json();
  const title = cleanText(body.title);
  const description = cleanText(body.description);
  if (!title) return badRequest("Series title is required");

  const [series] = await getDb()
    .update(miscSeries)
    .set({ title, description, updatedAt: new Date() })
    .where(eq(miscSeries.id, id))
    .returning();

  if (!series) return notFound("Series not found");
  logTelemetryEvent({
    name: "admin.misc_series.updated",
    section: "misc",
    targetType: "misc_series",
    targetId: series.id,
  });
  return NextResponse.json(series);
});

export const DELETE = withAuth(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid series id");

  const db = getDb();
  await db
    .update(articles)
    .set({ seriesId: null, updatedAt: new Date() })
    .where(eq(articles.seriesId, id));

  const [deleted] = await db.delete(miscSeries).where(eq(miscSeries.id, id)).returning();
  if (!deleted) return notFound("Series not found");
  logTelemetryEvent({
    name: "admin.misc_series.deleted",
    section: "misc",
    targetType: "misc_series",
    targetId: id,
  });
  return NextResponse.json({ ok: true });
});
