import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sweActivity } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { serverError } from "@/lib/api";
import { fetchVercelActivity } from "@/lib/vercel-activity";
import { syncActivitiesToDb } from "@/lib/swe-activity-sync";

const ACTIVITY_CACHE =
  "public, max-age=300, s-maxage=600, stale-while-revalidate=86400";

// Sync threshold: 5 minutes
const SYNC_THRESHOLD_MS = 5 * 60 * 1000;

export async function GET() {
  try {
    const db = getDb();
    
    // 1. Fetch from DB immediately (Always fast)
    const persisted = await db
      .select()
      .from(sweActivity)
      .orderBy(desc(sweActivity.timestamp))
      .limit(50);

    // 2. Check if we need to sync (Live data requirement)
    // We sync if the DB is empty, OR if the most recent update is older than the threshold.
    const mostRecent = persisted[0];
    const isStale = !mostRecent || (Date.now() - new Date(mostRecent.updatedAt).getTime() > SYNC_THRESHOLD_MS);

    if (isStale) {
      // Trigger sync logic. 
      // NOTE: In personal website scale, we can just await this. 
      // External APIs are fast, and batch DB upsert is now optimized.
      // This ensures the current user gets the absolute latest data.
      const externalItems = await fetchVercelActivity();
      
      if (externalItems.length > 0) {
        await syncActivitiesToDb(externalItems);
        
        // Refetch if we actually updated something during the request
        const freshData = await db
          .select()
          .from(sweActivity)
          .orderBy(desc(sweActivity.timestamp))
          .limit(50);
        
        const res = NextResponse.json(freshData);
        res.headers.set("Cache-Control", ACTIVITY_CACHE);
        return res;
      }
    }

    const res = NextResponse.json(persisted);
    res.headers.set("Cache-Control", ACTIVITY_CACHE);
    return res;
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
