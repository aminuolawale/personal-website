import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { sweActivity, type GitHubCommitMetadata, type NewSweActivity } from "@/lib/schema";

type GitHubCommitListItem = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author?: {
      name?: string;
      email?: string;
      date?: string;
    };
    committer?: {
      name?: string;
      email?: string;
      date?: string;
    };
  };
};

type GitHubCommitDetail = GitHubCommitListItem & {
  stats?: {
    additions?: number;
    deletions?: number;
  };
  files?: unknown[];
};

type GitHubCommitSyncOptions = {
  owner?: string;
  repo?: string;
  branch?: string;
  limit?: number;
};

export type GitHubCommitSyncResult = {
  repo: string;
  branch: string;
  received: number;
  synced: number;
};

function parseGitHubRepo(repo?: string | null) {
  const trimmed = repo?.trim();
  if (!trimmed || !trimmed.includes("/")) return null;
  const [owner, name] = trimmed.split("/", 2);
  if (!owner || !name) return null;
  return { owner, repo: name };
}

function getRepoConfig(options: GitHubCommitSyncOptions = {}) {
  const parsedRepo = parseGitHubRepo(process.env.GITHUB_REPO)
    ?? parseGitHubRepo(process.env.GITHUB_REPOSITORY);

  const owner = options.owner
    ?? process.env.GITHUB_OWNER
    ?? parsedRepo?.owner
    ?? "aminuolawale";
  const repo = options.repo
    ?? process.env.GITHUB_REPOSITORY_NAME
    ?? parsedRepo?.repo
    ?? "personal-website";
  const branch = options.branch ?? process.env.GITHUB_BRANCH ?? "main";
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);

  return { owner, repo, branch, limit };
}

async function githubJson<T>(url: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`GitHub request failed (${res.status})${detail ? `: ${detail}` : ""}`);
  }

  return res.json() as Promise<T>;
}

function getCommitTitle(message: string) {
  return message.split("\n")[0]?.trim() || "Untitled commit";
}

function getCommittedAt(commit: GitHubCommitDetail["commit"]) {
  return commit.author?.date ?? commit.committer?.date ?? new Date().toISOString();
}

function toMetadata(commit: GitHubCommitDetail): GitHubCommitMetadata {
  const committedAt = getCommittedAt(commit.commit);
  return {
    sha: commit.sha,
    shortSha: commit.sha.slice(0, 7),
    message: commit.commit.message,
    authorName: commit.commit.author?.name ?? commit.commit.committer?.name ?? "Unknown",
    authorEmail: commit.commit.author?.email ?? commit.commit.committer?.email,
    committedAt,
    additions: commit.stats?.additions,
    deletions: commit.stats?.deletions,
    changedFiles: commit.files?.length,
  };
}

export async function syncLatestGithubCommits(options: GitHubCommitSyncOptions = {}): Promise<GitHubCommitSyncResult> {
  const { owner, repo, branch, limit } = getRepoConfig(options);
  const db = getDb();
  const encodedBranch = encodeURIComponent(branch);
  const listUrl = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${encodedBranch}&per_page=${limit}`;
  const commits = await githubJson<GitHubCommitListItem[]>(listUrl);

  const rows: NewSweActivity[] = [];

  for (const item of commits) {
    const detailUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${item.sha}`;
    const detail = await githubJson<GitHubCommitDetail>(detailUrl);
    const metadata = toMetadata(detail);

    rows.push({
      externalId: `vercel-commit-${item.sha}`,
      type: "commit",
      message: `Mohammed made the commit '${getCommitTitle(detail.commit.message)}' to ${repo}`,
      repo,
      timestamp: new Date(metadata.committedAt),
      url: detail.html_url,
      commitMetadata: metadata,
    });
  }

  if (rows.length > 0) {
    await db.insert(sweActivity)
      .values(rows)
      .onConflictDoUpdate({
        target: sweActivity.externalId,
        set: {
          repo: sql`EXCLUDED.repo`,
          timestamp: sql`EXCLUDED.timestamp`,
          url: sql`EXCLUDED.url`,
          commitMetadata: sql`EXCLUDED.commit_metadata`,
          updatedAt: new Date(),
        },
      });
  }

  return {
    repo: `${owner}/${repo}`,
    branch,
    received: commits.length,
    synced: rows.length,
  };
}
