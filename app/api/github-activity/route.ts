import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sweActivity } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { serverError } from "@/lib/api";

const ACTIVITY_CACHE =
  "public, max-age=60, s-maxage=300, stale-while-revalidate=600";

export async function GET() {
  try {
    const db = getDb();
    const persisted = await db
      .select()
      .from(sweActivity)
      .where(eq(sweActivity.hidden, false))
      .orderBy(desc(sweActivity.timestamp))
      .limit(50);

    const res = NextResponse.json(persisted);
    res.headers.set("Cache-Control", ACTIVITY_CACHE);
    return res;
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
