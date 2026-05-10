import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sweActivity } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { withAuth } from "@/lib/with-auth";
import { getSweActivitySyncState } from "@/lib/swe-activity-sync";

export const GET = withAuth(async () => {
  const activities = await getDb()
    .select()
    .from(sweActivity)
    .where(eq(sweActivity.hidden, false))
    .orderBy(desc(sweActivity.timestamp))
    .limit(200);
  return NextResponse.json({ activities, syncState: await getSweActivitySyncState() });
});
