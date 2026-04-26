import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { siteUpdates } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const adminMode = new URL(req.url).searchParams.get("admin") === "true";
  if (adminMode && !(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getDb();
  const rows = await db
    .select()
    .from(siteUpdates)
    .where(adminMode ? undefined : eq(siteUpdates.published, true))
    .orderBy(desc(siteUpdates.createdAt))
    .limit(adminMode ? 200 : 20);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { text, linkUrl } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "text is required" }, { status: 400 });
  const db = getDb();
  const [row] = await db.insert(siteUpdates).values({ text: text.trim(), linkUrl: linkUrl ?? null }).returning();
  return NextResponse.json(row, { status: 201 });
}
