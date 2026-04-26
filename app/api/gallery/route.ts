import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { galleryPhotos } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { unauthorized, serverError, PUBLIC_CACHE } from "@/lib/api";
import { createUpdate } from "@/lib/updates";

export async function GET(req: NextRequest) {
  const adminMode = new URL(req.url).searchParams.get("admin") === "true";

  if (adminMode && !(await getSession())) return unauthorized();

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(galleryPhotos)
      .where(adminMode ? undefined : eq(galleryPhotos.published, true))
      .orderBy(asc(galleryPhotos.createdAt));

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
  try {
    const { publishAsUpdate, ...photoData } = await req.json();
    const db = getDb();
    const [photo] = await db.insert(galleryPhotos).values(photoData).returning();
    if (publishAsUpdate) {
      await createUpdate({
        text: `Aminu added a new photo — ${photo.name} — to Astrophotography`,
        linkUrl: "/astrophotography?tab=gallery",
        thumbnailUrl: photo.imageUrl,
      });
    }
    return NextResponse.json(photo, { status: 201 });
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
