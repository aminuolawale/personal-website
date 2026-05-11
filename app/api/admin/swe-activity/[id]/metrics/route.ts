import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sweActivity } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { notFound, badRequest, serverError } from "@/lib/api";
import { withAuth } from "@/lib/with-auth";
import { parseId } from "@/lib/validation";
import { computeCommitMetrics } from "@/lib/commit-metrics";
import { execSync } from "child_process";

type Params = { params: Promise<{ id: string }> };

// GET — return stored metrics for an activity.
export const GET = withAuth(async (_req: NextRequest, { params }: Params) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid id");

  const [row] = await getDb()
    .select({ metrics: sweActivity.metrics, externalId: sweActivity.externalId, type: sweActivity.type })
    .from(sweActivity)
    .where(eq(sweActivity.id, id));

  if (!row) return notFound();
  if (row.type !== "commit") return badRequest("Metrics are only available for commit activities");

  return NextResponse.json({ metrics: row.metrics ?? null });
});

// DELETE — clear stored metrics for a commit activity.
export const DELETE = withAuth(async (_req: NextRequest, { params }: Params) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid id");

  const [row] = await getDb()
    .select({ type: sweActivity.type })
    .from(sweActivity)
    .where(eq(sweActivity.id, id));

  if (!row) return notFound();
  if (row.type !== "commit") return badRequest("Metrics are only available for commit activities");

  await getDb()
    .update(sweActivity)
    .set({ metrics: null, updatedAt: new Date() })
    .where(eq(sweActivity.id, id));

  return NextResponse.json({ ok: true });
});

// POST — recompute metrics for a commit activity (local dev only).
export const POST = withAuth(async (_req: NextRequest, { params }: Params) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid id");

  const [row] = await getDb()
    .select({ externalId: sweActivity.externalId, type: sweActivity.type })
    .from(sweActivity)
    .where(eq(sweActivity.id, id));

  if (!row) return notFound();
  if (row.type !== "commit") return badRequest("Metrics are only available for commit activities");

  // externalId is "vercel-commit-<sha>"
  const sha = row.externalId.replace(/^vercel-commit-/, "");
  if (!sha || sha === row.externalId) return badRequest("Cannot derive SHA from externalId");

  // Always derive prevSha from git — never trust the caller to supply it.
  // Passing the wrong parent SHA collapses the session window to [epoch, commitTime],
  // causing every commit to attribute the same very-first session message as its
  // foundation prompt.
  let prevSha = "";
  try {
    const parents = execSync(`git log --pretty=%P -n1 ${sha}`, { encoding: "utf8" }).trim();
    prevSha = parents.split(/\s+/)[0] ?? "";
  } catch {
    // First commit or SHA not present in local checkout — no parent.
  }

  try {
    const repoPath = process.cwd();
    const workingDir = repoPath;

    // null means the commit was too small to meter — store null and surface that to the caller.
    const metrics = await computeCommitMetrics({ sha, prevSha, workingDir, repoPath });

    await getDb()
      .update(sweActivity)
      .set({ metrics, updatedAt: new Date() })
      .where(eq(sweActivity.id, id));

    return NextResponse.json({ metrics });
  } catch (err) {
    console.error("[metrics] Recompute failed:", err);
    return serverError("Metrics computation failed");
  }
});
