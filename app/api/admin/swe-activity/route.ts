import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sweActivity } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { unauthorized, serverError } from "@/lib/api";

/**
 * Lists all persisted SWE activities.
 * Admin-only.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const db = getDb();
    const activities = await db
      .select()
      .from(sweActivity)
      .orderBy(desc(sweActivity.timestamp))
      .limit(200);

    return NextResponse.json(activities);
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
