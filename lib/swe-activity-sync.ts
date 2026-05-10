import { getDb } from "@/lib/db";
import { sweActivity } from "@/lib/schema";
import { sql, eq } from "drizzle-orm";
import type { ActivityItem } from "@/lib/github-activity";

/**
 * Persists activities to the database using an upsert strategy.
 * Prevents overwriting manual notes/scs if the activity already exists.
 * Filters for activities on or after April 24th, 2026.
 */
export async function syncActivitiesToDb(items: ActivityItem[]) {
  const CUTOFF_DATE = new Date("2026-04-24T00:00:00Z");

  const filteredItems = items.filter(item => new Date(item.timestamp) >= CUTOFF_DATE);

  if (filteredItems.length === 0) return;

  const db = getDb();
  for (const item of filteredItems) {
    try {
      await db.insert(sweActivity)
        .values({
          externalId: item.id,
          type: item.type,
          message: item.message,
          repo: item.repo,
          timestamp: new Date(item.timestamp),
          url: item.url,
          // Default scs and note are handled by schema defaults
        })
        .onConflictDoUpdate({
          target: sweActivity.externalId,
          set: {
            // We update the message and url in case they changed, 
            // but we explicitly do NOT overwrite 'note' or 'scs' 
            // as those are managed manually in the admin panel.
            message: item.message,
            url: item.url,
            updatedAt: new Date(),
          },
        });
    } catch (err) {
      console.error(`Failed to sync activity ${item.id}:`, err);
    }
  }
}
