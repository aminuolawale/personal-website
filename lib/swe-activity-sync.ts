import { getDb } from "@/lib/db";
import { sweActivity } from "@/lib/schema";
import { sql, eq } from "drizzle-orm";
import type { ActivityItem } from "@/lib/github-activity";

/**
 * Persists activities to the database using an optimized batch upsert strategy.
 * Prevents overwriting manual notes/scs if the activity already exists.
 * Filters for activities on or after April 24th, 2026.
 */
export async function syncActivitiesToDb(items: ActivityItem[]) {
  const CUTOFF_DATE = new Date("2026-04-24T00:00:00Z");

  const filteredItems = items
    .filter(item => new Date(item.timestamp) >= CUTOFF_DATE)
    .map(item => ({
      externalId: item.id,
      type: item.type,
      message: item.message,
      repo: item.repo,
      timestamp: new Date(item.timestamp),
      url: item.url,
      // note and scs default to "" and 100 via schema
    }));

  if (filteredItems.length === 0) return;

  const db = getDb();
  
  try {
    // Perform a batch upsert. 
    // We use onConflictDoUpdate to update the dynamic fields (message, url, updatedAt)
    // while explicitly preserving user-managed fields (note, scs).
    await db.insert(sweActivity)
      .values(filteredItems)
      .onConflictDoUpdate({
        target: sweActivity.externalId,
        set: {
          message: sql`EXCLUDED.message`,
          url: sql`EXCLUDED.url`,
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    console.error("Batch activity sync failed:", err);
    // Fallback to sequential updates if batch fails (e.g. payload too large)
    for (const item of filteredItems) {
        await db.insert(sweActivity)
          .values(item)
          .onConflictDoUpdate({
            target: sweActivity.externalId,
            set: {
              message: item.message,
              url: item.url,
              updatedAt: new Date(),
            },
          })
          .catch(e => console.error(`Fallback sync failed for ${item.externalId}:`, e));
    }
  }
}
