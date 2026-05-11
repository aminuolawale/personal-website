#!/usr/bin/env node
// Called by .git/hooks/post-commit:
//   npx tsx --env-file=.env.local scripts/capture-commit-metrics.ts <sha> [prevSha]
//
// Reads coding-agent sessions for the window [prevCommit, commit],
// computes metrics and specificity score, then upserts into the DB.

import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { computeCommitMetrics } from "../lib/commit-metrics";
import { getDb } from "../lib/db";
import { commitMetricsCache, sweActivity } from "../lib/schema";
import { eq } from "drizzle-orm";

function parseDatabaseUrl(envContent: string): string | null {
  const match = envContent.match(/^DATABASE_URL=(.+)$/m);
  return match?.[1]?.trim() ?? null;
}

function configureMetricsDatabaseUrl(repoPath: string) {
  if (process.env.METRICS_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.METRICS_DATABASE_URL;
    return "METRICS_DATABASE_URL";
  }

  const prodEnvPath = path.join(repoPath, ".env.prod.forsync");
  if (fs.existsSync(prodEnvPath)) {
    const prodUrl = parseDatabaseUrl(fs.readFileSync(prodEnvPath, "utf8"));
    if (prodUrl) {
      process.env.DATABASE_URL = prodUrl;
      return ".env.prod.forsync";
    }
  }

  return "DATABASE_URL";
}

async function main() {
  const [, , sha, prevSha] = process.argv;

  if (!sha) {
    console.error("[metrics] Usage: capture-commit-metrics.ts <sha> [prevSha]");
    process.exit(1);
  }

  const repoPath = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
  const workingDir = repoPath;
  const dbSource = configureMetricsDatabaseUrl(repoPath);

  console.log(`[metrics] Computing metrics for ${sha.slice(0, 7)} …`);

  const metrics = await computeCommitMetrics({
    sha,
    prevSha: prevSha ?? "",
    workingDir,
    repoPath,
  });
  if (!metrics) {
    console.log(`[metrics] No coding-agent sessions found for ${sha.slice(0, 7)}; skipping.`);
    return;
  }

  console.log(
    `[metrics] OCS=${metrics.scores.ocs}  tokens=${metrics.tokenMetrics.totalTokens}  LOC=${metrics.loc.net}`,
  );

  // Look up the sweActivity row for this commit.
  // externalId is "vercel-commit-<sha>" or may not exist yet if Vercel hasn't deployed.
  const externalId = `vercel-commit-${sha}`;

  const db = getDb();
  await db
    .insert(commitMetricsCache)
    .values({ sha, metrics, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: commitMetricsCache.sha,
      set: { metrics, updatedAt: new Date() },
    });
  console.log(`[metrics] Cached ${sha.slice(0, 7)} metrics via ${dbSource}`);

  const [existing] = await db
    .select({ id: sweActivity.id })
    .from(sweActivity)
    .where(eq(sweActivity.externalId, externalId));

  if (existing) {
    await db
      .update(sweActivity)
      .set({ metrics, updatedAt: new Date() })
      .where(eq(sweActivity.id, existing.id));
    console.log(`[metrics] Updated activity ${existing.id}`);
  } else {
    console.log(`[metrics] No activity row yet for ${sha.slice(0, 7)}; cache will hydrate it later`);
  }
}

main().catch((err) => {
  console.error("[metrics] Failed:", err.message);
  process.exit(1);
});
