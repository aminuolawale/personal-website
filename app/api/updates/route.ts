import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { siteUpdates } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { unauthorized, badRequest, serverError, PUBLIC_CACHE } from "@/lib/api";

export async function GET(req: NextRequest) {
  const adminMode = new URL(req.url).searchParams.get("admin") === "true";
  if (adminMode && !(await getSession())) return unauthorized();
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(siteUpdates)
      .where(adminMode ? undefined : eq(siteUpdates.published, true))
      .orderBy(desc(siteUpdates.createdAt))
      .limit(adminMode ? 200 : 20);
    const res = NextResponse.json(rows);
    if (!adminMode) res.headers.set("Cache-Control", PUBLIC_CACHE);
    return res;
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  if (!(await getSession())) return unauthorized();
  try {
    const { text, linkUrl } = await req.json();
    if (!text?.trim()) return badRequest("text is required");
    const db = getDb();
    const [row] = await db.insert(siteUpdates).values({ text: text.trim(), linkUrl: linkUrl ?? null }).returning();
    return NextResponse.json(row, { status: 201 });
  } catch {
    return serverError();
  }
}
