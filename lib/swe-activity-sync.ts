import fs from "fs";
import path from "path";
import { getDb } from "@/lib/db";
import { sweActivity } from "@/lib/schema";
import { sql, eq } from "drizzle-orm";
import type { ActivityItem } from "@/lib/vercel-activity";
import type { CommitMetrics } from "@/lib/coding-agents/types";

/**
 * Persists activities to the database using an optimized batch upsert strategy.
 * Prevents overwriting manual notes/scs if the activity already exists.
 * Filters for activities on or after April 24th, 2026.
 */
// Load cached metrics written by the git post-commit hook for a commit SHA.
function loadCachedMetrics(sha: string): CommitMetrics | null {
  try {
    // Works in local dev; process.cwd() is the repo root when running via Next.js dev server.
    const cacheFile = path.join(process.cwd(), ".git", "commit_metrics", `${sha}.json`);
    if (!fs.existsSync(cacheFile)) return null;
    return JSON.parse(fs.readFileSync(cacheFile, "utf8")) as CommitMetrics;
  } catch {
    return null;
  }
}

function dedupeByExternalId<T extends { externalId: string; timestamp: Date }>(items: T[]): T[] {
  const byId = new Map<string, T>();

  for (const item of items) {
    const existing = byId.get(item.externalId);
    if (!existing || item.timestamp > existing.timestamp) {
      byId.set(item.externalId, item);
    }
  }

  return Array.from(byId.values());
}

export async function syncActivitiesToDb(items: ActivityItem[]) {
  const CUTOFF_DATE = new Date("2026-04-24T00:00:00Z");

  const filteredItems = dedupeByExternalId(
    items
      .filter(item => new Date(item.timestamp) >= CUTOFF_DATE)
      .map(item => {
        // For commit items, try to attach cached metrics written by the post-commit hook.
        // externalId format: "vercel-commit-<sha>"
        const sha = item.type === "commit" ? item.id.replace(/^vercel-commit-/, "") : null;
        const metrics = sha ? loadCachedMetrics(sha) : null;
        return {
          externalId: item.id,
          type: item.type,
          message: item.message,
          repo: item.repo,
          timestamp: new Date(item.timestamp),
          url: item.url,
          ...(metrics ? { metrics } : {}),
        };
      })
  );

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
          // Only write metrics on conflict if the incoming row has them and the existing row doesn't.
          metrics: sql`COALESCE(swe_activity.metrics, EXCLUDED.metrics)`,
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
