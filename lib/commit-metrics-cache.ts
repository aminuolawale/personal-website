import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { commitMetricsCache } from "@/lib/schema";
import type { CommitMetrics } from "@/lib/coding-agents/types";

type Db = ReturnType<typeof getDb>;

export async function readCommitMetricsCache(sha: string, db: Db = getDb()): Promise<CommitMetrics | null> {
  const [row] = await db
    .select({ metrics: commitMetricsCache.metrics })
    .from(commitMetricsCache)
    .where(eq(commitMetricsCache.sha, sha));

  return row?.metrics ?? null;
}

export async function upsertCommitMetricsCache(
  sha: string,
  metrics: CommitMetrics,
  db: Db = getDb(),
): Promise<void> {
  await db
    .insert(commitMetricsCache)
    .values({ sha, metrics, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: commitMetricsCache.sha,
      set: { metrics, updatedAt: new Date() },
    });
}
