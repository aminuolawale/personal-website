export type ActivityItem = {
  id: string;
  type: "commit" | "deployment";
  message: string;
  timestamp: string;
  url?: string;
  repo: string;
};

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
      const commitUrl =
        meta?.githubCommitOrg && meta?.githubCommitRepo
          ? `https://github.com/${meta.githubCommitOrg}/${meta.githubCommitRepo}/commit/${sha}`
          : undefined;

      items.push({
        id: `vercel-commit-${sha}`,
        type: "commit",
        message: commitMsg
          ? `Mohammed made the commit '${commitMsg}' to ${project}`
          : `Mohammed pushed to ${project} at ${shortSha}`,
        timestamp,
        url: commitUrl,
        repo: project,
      });
    }
  }

  return items;
}
