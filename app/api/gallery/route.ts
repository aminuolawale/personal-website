import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { galleryPhotos } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const adminMode = new URL(req.url).searchParams.get("admin") === "true";

  if (adminMode && !(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(galleryPhotos)
      .where(adminMode ? undefined : eq(galleryPhotos.published, true))
      .orderBy(asc(galleryPhotos.createdAt));

    const res = NextResponse.json(rows);
    if (!adminMode) {
      res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    }
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const db = getDb();
    const [photo] = await db.insert(galleryPhotos).values(body).returning();
    return NextResponse.json(photo, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
