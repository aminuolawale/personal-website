import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { badRequest, PUBLIC_CACHE, serverError, unauthorized } from "@/lib/api";
import { getDb } from "@/lib/db";
import { miscSeries } from "@/lib/schema";
import { logTelemetryEvent } from "@/lib/observability/server";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const adminMode = searchParams.get("admin") === "true";

  if (adminMode && !(await getSession())) return unauthorized();

  try {
    const rows = await getDb()
      .select()
      .from(miscSeries)
      .orderBy(asc(miscSeries.title));
    const res = NextResponse.json(rows);
    if (!adminMode) res.headers.set("Cache-Control", PUBLIC_CACHE);
    return res;
  } catch (err) {
    console.error(err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  if (!(await getSession())) return unauthorized();

  const body = await req.json();
  const title = cleanText(body.title);
  const description = cleanText(body.description);

  if (!title) return badRequest("Series title is required");

  try {
    const [series] = await getDb()
      .insert(miscSeries)
      .values({ title, description })
      .returning();
    logTelemetryEvent({
      name: "admin.misc_series.created",
      section: "misc",
      targetType: "misc_series",
      targetId: series.id,
    });
    return NextResponse.json(series, { status: 201 });
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
