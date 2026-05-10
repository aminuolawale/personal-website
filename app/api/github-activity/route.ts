import { NextResponse } from "next/server";
import { serverError } from "@/lib/api";
import type { ActivityItem } from "@/lib/github-activity";

const GITHUB_USERNAME = process.env.GITHUB_USERNAME ?? "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";
const VERCEL_TOKEN = process.env.VERCEL_TOKEN ?? "";
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID ?? "";

const ACTIVITY_CACHE =
  "public, max-age=300, s-maxage=600, stale-while-revalidate=86400";

async function fetchGitHubActivity(): Promise<ActivityItem[]> {
  if (!GITHUB_USERNAME) return [];

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

  const res = await fetch(
    `https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=30`,
    { headers, next: { revalidate: 600 } }
  );
  if (!res.ok) return [];

  const events: unknown[] = await res.json();
  const items: ActivityItem[] = [];

  for (const event of events) {
    if (!event || typeof event !== "object") continue;
    const e = event as Record<string, unknown>;
    const repo = e.repo as { name?: string } | undefined;
    const repoName = repo?.name?.split("/")[1] ?? repo?.name ?? "unknown";
    const createdAt = e.created_at as string;

    if (e.type === "PushEvent") {
      const payload = e.payload as { commits?: { sha: string; message: string }[] };
      const commits = payload?.commits ?? [];
      if (commits.length === 0) continue;
      const commit = commits[commits.length - 1];
      const shortMsg = commit.message?.split("\n")[0] ?? "";
      items.push({
        id: `gh-push-${e.id}`,
        type: "commit",
        message: `Mohammed made the commit '${shortMsg}' to ${repoName}`,
        timestamp: createdAt,
        url: `https://github.com/${repo?.name}/commit/${commit.sha}`,
        repo: repoName,
      });
    } else if (e.type === "CreateEvent") {
      const payload = e.payload as { ref_type?: string; ref?: string };
      if (payload?.ref_type !== "branch") continue;
      items.push({
        id: `gh-create-${e.id}`,
        type: "commit",
        message: `Mohammed created branch '${payload.ref}' in ${repoName}`,
        timestamp: createdAt,
        url: `https://github.com/${repo?.name}/tree/${payload.ref}`,
        repo: repoName,
      });
    }
  }

  return items;
}

async function fetchVercelActivity(): Promise<ActivityItem[]> {
  if (!VERCEL_TOKEN) return [];

  const url = new URL("https://api.vercel.com/v6/deployments");
  url.searchParams.set("limit", "20");
  url.searchParams.set("state", "READY");
  if (VERCEL_TEAM_ID) url.searchParams.set("teamId", VERCEL_TEAM_ID);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
    next: { revalidate: 600 },
  });
  if (!res.ok) return [];

  const data = await res.json();
  const deployments: unknown[] = data.deployments ?? [];

  return deployments
    .filter((d): d is Record<string, unknown> => !!d && typeof d === "object")
    .map((d) => {
      const meta = d.meta as Record<string, string> | undefined;
      const project = (d.name as string) ?? "unknown";
      const target = d.target === "production" ? "production" : "preview";
      const commitMsg = meta?.githubCommitMessage?.split("\n")[0] ?? "";
      const sha = (meta?.githubCommitSha ?? "").slice(0, 7);

      let message = `Mohammed deployed ${project} to ${target}`;
      if (commitMsg) message += ` — '${commitMsg}'`;
      else if (sha) message += ` at ${sha}`;

      return {
        id: `vercel-${d.uid}`,
        type: "deployment" as const,
        message,
        timestamp: new Date(d.createdAt as number).toISOString(),
        url: d.url ? `https://${d.url}` : undefined,
        repo: project,
      };
    });
}

export async function GET() {
  try {
    const [githubItems, vercelItems] = await Promise.all([
      fetchGitHubActivity(),
      fetchVercelActivity(),
    ]);

    const all = [...githubItems, ...vercelItems]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 30);

    const res = NextResponse.json(all);
    res.headers.set("Cache-Control", ACTIVITY_CACHE);
    return res;
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
