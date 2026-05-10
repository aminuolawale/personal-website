#!/usr/bin/env node
// Called by .git/hooks/post-commit:
//   npx tsx --env-file=.env.local scripts/capture-commit-metrics.ts <sha> [prevSha]
//
// Reads coding-agent sessions for the window [prevCommit, commit],
// computes metrics and specificity score, then upserts into the DB.

import path from "path";
import { execSync } from "child_process";
import { computeCommitMetrics } from "../lib/commit-metrics";
import { getDb } from "../lib/db";
import { sweActivity } from "../lib/schema";
import { eq } from "drizzle-orm";

async function main() {
  const [, , sha, prevSha] = process.argv;

  if (!sha) {
    console.error("[metrics] Usage: capture-commit-metrics.ts <sha> [prevSha]");
    process.exit(1);
  }

  const repoPath = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
  const workingDir = repoPath;

  console.log(`[metrics] Computing metrics for ${sha.slice(0, 7)} …`);

  const metrics = await computeCommitMetrics({
    sha,
    prevSha: prevSha ?? "",
    workingDir,
    repoPath,
  });

  console.log(
    `[metrics] OCS=${metrics.scores.ocs}  tokens=${metrics.tokenMetrics.totalTokens}  LOC=${metrics.loc.net}`,
  );

  // Look up the sweActivity row for this commit.
  // externalId is "vercel-commit-<sha>" or may not exist yet if Vercel hasn't deployed.
  const externalId = `vercel-commit-${sha}`;

  const db = getDb();
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
    // Row doesn't exist yet (commit not yet deployed/synced).
    // Write to a local cache file; swe-activity-sync will pick it up.
    const cacheDir = path.join(repoPath, ".git", "commit_metrics");
    const fs = await import("fs");
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(path.join(cacheDir, `${sha}.json`), JSON.stringify(metrics, null, 2));
    console.log(`[metrics] Cached to .git/commit_metrics/${sha.slice(0, 7)}.json (no DB row yet)`);
  }
}

main().catch((err) => {
  console.error("[metrics] Failed:", err.message);
  process.exit(1);
});
