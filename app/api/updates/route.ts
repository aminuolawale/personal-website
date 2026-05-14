import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { siteUpdates } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { unauthorized, badRequest, withDb, PUBLIC_CACHE } from "@/lib/api";
import { withAuth } from "@/lib/with-auth";

export async function GET(req: NextRequest) {
  const adminMode = new URL(req.url).searchParams.get("admin") === "true";
  if (adminMode && !(await getSession())) return unauthorized();
  return withDb(async (db) => {
    const rows = await db
      .select()
      .from(siteUpdates)
      .where(adminMode ? undefined : eq(siteUpdates.published, true))
      .orderBy(desc(siteUpdates.createdAt))
      .limit(adminMode ? 200 : 20);
    const res = NextResponse.json(rows);
    if (!adminMode) res.headers.set("Cache-Control", PUBLIC_CACHE);
    return res;
  });
}

export const POST = withAuth(async (req: NextRequest) => {
  const { text, linkUrl } = await req.json();
  if (!text?.trim()) return badRequest("text is required");
  const [row] = await getDb()
    .insert(siteUpdates)
    .values({ text: text.trim(), linkUrl: linkUrl ?? null })
    .returning();
  return NextResponse.json(row, { status: 201 });
});
