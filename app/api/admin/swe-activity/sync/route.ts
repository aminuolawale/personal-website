import { NextRequest, NextResponse } from "next/server";
import { syncLatestGithubCommits } from "@/lib/github-commit-sync";
import { withAuth } from "@/lib/with-auth";

export const POST = withAuth(async (req: NextRequest) => {
  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

  const result = await syncLatestGithubCommits({
    limit: Number.isFinite(limit) ? limit : undefined,
  });

  return NextResponse.json({ success: true, ...result });
});
