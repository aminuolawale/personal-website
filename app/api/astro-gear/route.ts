import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { astroGear, siteUpdates } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

const VALID_TYPES = new Set(["equipment", "software", "technique"]);

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const db = getDb();
  const rows = type
    ? await db.select().from(astroGear).where(eq(astroGear.type, type)).orderBy(asc(astroGear.name))
    : await db.select().from(astroGear).orderBy(asc(astroGear.type), asc(astroGear.name));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { type, name, publishAsUpdate } = await req.json();
  if (!VALID_TYPES.has(type) || !name?.trim()) {
    return NextResponse.json({ error: "Valid type and name are required" }, { status: 400 });
  }
  const db = getDb();
  const [item] = await db.insert(astroGear).values({ type, name: name.trim() }).returning();
  if (publishAsUpdate) {
    await db.insert(siteUpdates).values({
      text: `Aminu added new ${type} — ${item.name} — to the Gear Library`,
      linkUrl: "/astrophotography?tab=gear",
    });
  }
  return NextResponse.json(item, { status: 201 });
}
