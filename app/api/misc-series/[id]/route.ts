import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { badRequest, serverError, unauthorized } from "@/lib/api";
import { getDb } from "@/lib/db";
import { articles, miscSeries } from "@/lib/schema";
import { logTelemetryEvent } from "@/lib/observability/server";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return unauthorized();

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Invalid series id");

  const body = await req.json();
  const title = cleanText(body.title);
  const description = cleanText(body.description);

  if (!title) return badRequest("Series title is required");

  try {
    const [series] = await getDb()
      .update(miscSeries)
      .set({ title, description, updatedAt: new Date() })
      .where(eq(miscSeries.id, id))
      .returning();

    if (!series) return NextResponse.json({ error: "Series not found" }, { status: 404 });
    logTelemetryEvent({
      name: "admin.misc_series.updated",
      section: "misc",
      targetType: "misc_series",
      targetId: series.id,
    });
    return NextResponse.json(series);
  } catch (err) {
    console.error(err);
    return serverError();
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return unauthorized();

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Invalid series id");

  try {
    const db = getDb();
    await db
      .update(articles)
      .set({ seriesId: null, updatedAt: new Date() })
      .where(eq(articles.seriesId, id));

    const [deleted] = await db.delete(miscSeries).where(eq(miscSeries.id, id)).returning();
    if (!deleted) return NextResponse.json({ error: "Series not found" }, { status: 404 });
    logTelemetryEvent({
      name: "admin.misc_series.deleted",
      section: "misc",
      targetType: "misc_series",
      targetId: id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
