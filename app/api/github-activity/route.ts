import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sweActivity } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { serverError } from "@/lib/api";
import { fetchGitHubActivity, fetchVercelActivity } from "@/lib/github-activity";
import { syncActivitiesToDb } from "@/lib/swe-activity-sync";

const ACTIVITY_CACHE =
  "public, max-age=300, s-maxage=600, stale-while-revalidate=86400";

export async function GET() {
  try {
    const db = getDb();
    
    // 1. Check DB first (Fast)
    let persisted = await db
      .select()
      .from(sweActivity)
      .orderBy(desc(sweActivity.timestamp))
      .limit(50);

    // 2. If DB is empty, trigger an initial sync (Only happens once)
    if (persisted.length === 0) {
      const [githubItems, vercelItems] = await Promise.all([
        fetchGitHubActivity(),
        fetchVercelActivity(),
      ]);
      await syncActivitiesToDb([...githubItems, ...vercelItems]);
      
      persisted = await db
        .select()
        .from(sweActivity)
        .orderBy(desc(sweActivity.timestamp))
        .limit(50);
    }

    const res = NextResponse.json(persisted);
    res.headers.set("Cache-Control", ACTIVITY_CACHE);
    return res;
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
