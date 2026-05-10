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

// POST — recompute metrics for a commit activity (local dev only).
// Body: { prevSha?: string }
export const POST = withAuth(async (req: NextRequest, { params }: Params) => {
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

  const body = await req.json().catch(() => ({}));
  const prevSha: string = body.prevSha ?? "";

  try {
    const repoPath = process.cwd();
    const workingDir = repoPath;

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
