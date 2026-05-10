import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { astroGear } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { badRequest, serverError, PUBLIC_CACHE } from "@/lib/api";
import { withAuth } from "@/lib/with-auth";
import { createUpdate } from "@/lib/updates";

const VALID_TYPES = new Set(["equipment", "software", "technique"]);

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  try {
    const db = getDb();
    const rows = type
      ? await db.select().from(astroGear).where(eq(astroGear.type, type)).orderBy(asc(astroGear.name))
      : await db.select().from(astroGear).orderBy(asc(astroGear.type), asc(astroGear.name));
    const res = NextResponse.json(rows);
    res.headers.set("Cache-Control", PUBLIC_CACHE);
    return res;
  } catch {
    return serverError();
  }
}

export const POST = withAuth(async (req: NextRequest) => {
  const { type, name, imageUrl, link, publishAsUpdate } = await req.json();
  if (!VALID_TYPES.has(type) || !name?.trim()) return badRequest("Valid type and name are required");
  const db = getDb();
  const [item] = await db
    .insert(astroGear)
    .values({ type, name: name.trim(), imageUrl: imageUrl ?? null, link: link?.trim() || null })
    .returning();
  if (publishAsUpdate) {
    await createUpdate({
      text: `Aminu added new ${type} — ${item.name} — to the Gear Library`,
      linkUrl: "/astrophotography?tab=gear",
      thumbnailUrl: item.imageUrl ?? null,
    });
  }
  return NextResponse.json(item, { status: 201 });
});
