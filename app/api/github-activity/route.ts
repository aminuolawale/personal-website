import { NextResponse } from "next/server";
import { sweActivity } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { withDb } from "@/lib/api";

const ACTIVITY_CACHE =
  "public, max-age=60, s-maxage=300, stale-while-revalidate=600";

export async function GET() {
  return withDb(async (db) => {
    const persisted = await db
      .select()
      .from(sweActivity)
      .where(eq(sweActivity.hidden, false))
      .orderBy(desc(sweActivity.timestamp))
      .limit(50);

    const res = NextResponse.json(persisted);
    res.headers.set("Cache-Control", ACTIVITY_CACHE);
    return res;
  });
}
