// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchVercelActivity } from "@/lib/vercel-activity";

const VERCEL_TOKEN = "test-token";

function makeDeployment(overrides: Record<string, unknown> = {}) {
  return {
    uid: "dpl-abc123",
    name: "personal-website",
    target: "production",
    createdAt: new Date("2026-05-01T12:00:00Z").getTime(),
    url: "personal-website.vercel.app",
    meta: {
      githubCommitSha: "abc123def456abc123def456abc123def456abc123",
      githubCommitMessage: "Add dark mode",
      githubCommitOrg: "aminuolawale",
      githubCommitRepo: "personal-website",
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.stubEnv("VERCEL_TOKEN", VERCEL_TOKEN);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("fetchVercelActivity", () => {
  it("returns empty array when VERCEL_TOKEN is not set", async () => {
    vi.unstubAllEnvs();
    const items = await fetchVercelActivity();
    expect(items).toEqual([]);
  });

  it("returns empty array when the API call fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 500 })
    );
    const items = await fetchVercelActivity();
    expect(items).toEqual([]);
  });

  it("emits a deployment event for each deployment", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      Response.json({ deployments: [makeDeployment()] })
    );
    const items = await fetchVercelActivity();
    const deployment = items.find((i) => i.type === "deployment");

    expect(deployment).toMatchObject({
      id: "vercel-dpl-abc123",
      type: "deployment",
      repo: "personal-website",
    });
    expect(deployment?.message).toContain("production");
    expect(deployment?.url).toBe("https://personal-website.vercel.app");
  });

  it("emits a commit event for deployments that have a commit SHA", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      Response.json({ deployments: [makeDeployment()] })
    );
    const items = await fetchVercelActivity();
    const commit = items.find((i) => i.type === "commit");

    expect(commit).toMatchObject({
      id: "vercel-commit-abc123def456abc123def456abc123def456abc123",
      type: "commit",
      message: "Mohammed made the commit 'Add dark mode' to personal-website",
      url: "https://github.com/aminuolawale/personal-website/commit/abc123def456abc123def456abc123def456abc123",
      repo: "personal-website",
    });
  });

  it("does not emit a commit event for deployments without a commit SHA", async () => {
    const d = makeDeployment({ meta: {} });
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      Response.json({ deployments: [d] })
    );
    const items = await fetchVercelActivity();

    expect(items.every((i) => i.type !== "commit")).toBe(true);
    expect(items).toHaveLength(1);
  });

  it("deduplicates commits — same SHA from two deployments yields one commit item", async () => {
    const sha = "abc123def456abc123def456abc123def456abc123";
    const deployments = [
      makeDeployment({ uid: "dpl-1" }),
      makeDeployment({ uid: "dpl-2", target: "preview" }),
    ];
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      Response.json({ deployments })
    );
    const items = await fetchVercelActivity();
    const commits = items.filter((i) => i.type === "commit");

    // Both deployments share the same SHA — only one unique commit id
    const ids = commits.map((c) => c.id);
    expect(ids.every((id) => id === `vercel-commit-${sha}`)).toBe(true);
    expect(commits).toHaveLength(2); // two items with same externalId — DB upsert handles dedup
  });

  it("commit URL is omitted when org/repo metadata is missing", async () => {
    const d = makeDeployment({
      meta: {
        githubCommitSha: "abc123def456abc123def456abc123def456abc123",
        githubCommitMessage: "fix bug",
      },
    });
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      Response.json({ deployments: [d] })
    );
    const items = await fetchVercelActivity();
    const commit = items.find((i) => i.type === "commit");

    expect(commit?.url).toBeUndefined();
  });

  it("deployment message falls back to short SHA when no commit message", async () => {
    const d = makeDeployment({
      meta: { githubCommitSha: "abc123def456abc123def456abc123def456abc123" },
    });
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      Response.json({ deployments: [d] })
    );
    const items = await fetchVercelActivity();
    const deployment = items.find((i) => i.type === "deployment");

    expect(deployment?.message).toContain("abc123d");
  });
});
