export type ActivityItem = {
  id: string;
  type: "commit" | "deployment";
  message: string;
  timestamp: string;
  url?: string;
  repo: string;
  commitMetadata?: GitHubCommitMetadata;
};

export type GitHubCommitMetadata = {
  sha: string;
  shortSha: string;
  message: string;
  authorName: string;
  authorEmail?: string;
  committedAt: string;
  additions?: number;
  deletions?: number;
  changedFiles?: number;
};

async function fetchGitHubCommitMetadata(
  owner: string,
  repo: string,
  sha: string,
): Promise<GitHubCommitMetadata | null> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${sha}`, {
      headers,
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;

    const data = await res.json() as Record<string, unknown>;
    const commit = data.commit as Record<string, unknown> | undefined;
    const author = commit?.author as Record<string, unknown> | undefined;
    const stats = data.stats as Record<string, unknown> | undefined;
    const files = Array.isArray(data.files) ? data.files : [];
    const message = typeof commit?.message === "string" ? commit.message.split("\n")[0] : "";
    const committedAt = typeof author?.date === "string" ? author.date : "";

    return {
      sha,
      shortSha: sha.slice(0, 7),
      message,
      authorName: typeof author?.name === "string" ? author.name : "Mohammed",
      authorEmail: typeof author?.email === "string" ? author.email : undefined,
      committedAt: committedAt || new Date().toISOString(),
      additions: typeof stats?.additions === "number" ? stats.additions : undefined,
      deletions: typeof stats?.deletions === "number" ? stats.deletions : undefined,
      changedFiles: files.length || undefined,
    };
  } catch {
    return null;
  }
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export async function fetchVercelActivity(): Promise<ActivityItem[]> {
  const token = process.env.VERCEL_TOKEN ?? "";
  const teamId = process.env.VERCEL_TEAM_ID ?? "";
  if (!token) return [];

  const url = new URL("https://api.vercel.com/v6/deployments");
  url.searchParams.set("limit", "20");
  url.searchParams.set("state", "READY");
  if (teamId) url.searchParams.set("teamId", teamId);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 600 },
  });
  if (!res.ok) return [];

  const data = await res.json();
  const deployments: unknown[] = data.deployments ?? [];
  const items: ActivityItem[] = [];
  const commitMetadataCache = new Map<string, GitHubCommitMetadata | null>();

  for (const d of deployments) {
    if (!d || typeof d !== "object") continue;
    const deployment = d as Record<string, unknown>;
    const meta = deployment.meta as Record<string, string> | undefined;
    const project = (deployment.name as string) ?? "unknown";
    const target = deployment.target === "production" ? "production" : "preview";
    const commitMsg = meta?.githubCommitMessage?.split("\n")[0] ?? "";
    const sha = meta?.githubCommitSha ?? "";
    const shortSha = sha.slice(0, 7);
    const timestamp = new Date(deployment.createdAt as number).toISOString();

    let deployMessage = `Mohammed deployed ${project} to ${target}`;
    if (commitMsg) deployMessage += ` — '${commitMsg}'`;
    else if (shortSha) deployMessage += ` at ${shortSha}`;

    items.push({
      id: `vercel-${deployment.uid}`,
      type: "deployment",
      message: deployMessage,
      timestamp,
      url: deployment.url ? `https://${deployment.url}` : undefined,
      repo: project,
    });

    if (sha) {
      const owner = meta?.githubCommitOrg ?? "";
      const repo = meta?.githubCommitRepo ?? "";
      const cacheKey = `${owner}/${repo}/${sha}`;
      let commitMetadata = commitMetadataCache.get(cacheKey);
      if (commitMetadata === undefined) {
        commitMetadata = owner && repo ? await fetchGitHubCommitMetadata(owner, repo, sha) : null;
        commitMetadataCache.set(cacheKey, commitMetadata);
      }
      const commitDate = commitMetadata?.committedAt ?? timestamp;
      const commitTitle = commitMetadata?.message || commitMsg;
      const commitUrl =
        owner && repo
          ? `https://github.com/${owner}/${repo}/commit/${sha}`
          : undefined;

      items.push({
        id: `vercel-commit-${sha}`,
        type: "commit",
        message: commitTitle
          ? `Mohammed made the commit '${commitTitle}' to ${project}`
          : `Mohammed pushed to ${project} at ${shortSha}`,
        timestamp: commitDate,
        url: commitUrl,
        repo: project,
        ...(commitMetadata ? { commitMetadata } : {}),
      });
    }
  }

  return items;
}
