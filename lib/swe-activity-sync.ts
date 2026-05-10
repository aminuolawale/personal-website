import fs from "fs";
import path from "path";
import { getDb } from "@/lib/db";
import { siteConfig, sweActivity } from "@/lib/schema";
import { sql, eq } from "drizzle-orm";
import type { ActivityItem } from "@/lib/vercel-activity";
import type { CommitMetrics } from "@/lib/coding-agents/types";

const SYNC_STATE_KEY = "swe-activity-sync-state";
const LOCK_MS = 2 * 60 * 1000;

export type SweActivitySyncState = {
  lastStartedAt?: string;
  lastCompletedAt?: string;
  lastSuccessAt?: string;
  lockedUntil?: string;
  lastError?: string;
  lastStats?: SyncActivitiesResult;
};

export type SyncActivitiesResult = {
  received: number;
  afterCutoff: number;
  deduped: number;
  synced: number;
  failed: number;
  skipped?: "locked";
};

/**
 * Persists activities to the database using an optimized batch upsert strategy.
 * Prevents overwriting manual notes and hidden state if the activity already exists.
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

async function readSyncState(db: ReturnType<typeof getDb>): Promise<SweActivitySyncState> {
  const [row] = await db.select().from(siteConfig).where(eq(siteConfig.key, SYNC_STATE_KEY));
  if (!row) return {};
  try {
    return JSON.parse(row.value) as SweActivitySyncState;
  } catch {
    return {};
  }
}

async function writeSyncState(db: ReturnType<typeof getDb>, state: SweActivitySyncState) {
  await db
    .insert(siteConfig)
    .values({ key: SYNC_STATE_KEY, value: JSON.stringify(state), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: siteConfig.key,
      set: { value: JSON.stringify(state), updatedAt: new Date() },
    });
}

export async function getSweActivitySyncState(): Promise<SweActivitySyncState> {
  return readSyncState(getDb());
}

export async function syncActivitiesToDb(items: ActivityItem[]): Promise<SyncActivitiesResult> {
  const CUTOFF_DATE = new Date("2026-04-24T00:00:00Z");
  const db = getDb();
  const now = new Date();
  const state = await readSyncState(db);
  if (state.lockedUntil && new Date(state.lockedUntil) > now) {
    return {
      received: items.length,
      afterCutoff: 0,
      deduped: 0,
      synced: 0,
      failed: 0,
      skipped: "locked",
    };
  }

  await writeSyncState(db, {
    ...state,
    lastStartedAt: now.toISOString(),
    lockedUntil: new Date(now.getTime() + LOCK_MS).toISOString(),
    lastError: undefined,
  });

  const afterCutoffItems = items.filter(item => new Date(item.timestamp) >= CUTOFF_DATE);

  const filteredItems = dedupeByExternalId(
    afterCutoffItems
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
          ...(item.commitMetadata ? { commitMetadata: item.commitMetadata } : {}),
        };
      })
  );

  const result: SyncActivitiesResult = {
    received: items.length,
    afterCutoff: afterCutoffItems.length,
    deduped: filteredItems.length,
    synced: 0,
    failed: 0,
  };

  if (filteredItems.length === 0) {
    await writeSyncState(db, {
      ...(await readSyncState(db)),
      lastCompletedAt: new Date().toISOString(),
      lastSuccessAt: new Date().toISOString(),
      lockedUntil: undefined,
      lastStats: result,
    });
    return result;
  }
  
  try {
    // Perform a batch upsert. 
    // We use onConflictDoUpdate to update the dynamic fields (message, url, updatedAt)
    // while explicitly preserving user-managed fields (note and hidden state).
    await db.insert(sweActivity)
      .values(filteredItems)
      .onConflictDoUpdate({
        target: sweActivity.externalId,
        set: {
          // Preserve admin-edited display messages, notes, and hidden state.
          url: sql`EXCLUDED.url`,
          timestamp: sql`EXCLUDED.timestamp`,
          // Only write metrics on conflict if the incoming row has them and the existing row doesn't.
          metrics: sql`COALESCE(swe_activity.metrics, EXCLUDED.metrics)`,
          commitMetadata: sql`COALESCE(swe_activity.commit_metadata, EXCLUDED.commit_metadata)`,
          updatedAt: new Date(),
        },
      });
    result.synced = filteredItems.length;
  } catch (err) {
    console.error("Batch activity sync failed:", err);
    // Fallback to sequential updates if batch fails (e.g. payload too large)
    for (const item of filteredItems) {
        await db.insert(sweActivity)
          .values(item)
          .onConflictDoUpdate({
            target: sweActivity.externalId,
            set: {
              url: item.url,
              timestamp: item.timestamp,
              updatedAt: new Date(),
            },
          })
          .then(() => { result.synced += 1; })
          .catch(e => {
            result.failed += 1;
            console.error(`Fallback sync failed for ${item.externalId}:`, e);
          });
    }
  } finally {
    const completedAt = new Date().toISOString();
    await writeSyncState(db, {
      ...(await readSyncState(db)),
      lastCompletedAt: completedAt,
      ...(result.failed === 0 ? { lastSuccessAt: completedAt } : { lastError: `${result.failed} activity sync rows failed` }),
      lockedUntil: undefined,
      lastStats: result,
    });
  }

  return result;
}
