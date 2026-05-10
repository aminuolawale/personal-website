// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/commit-metrics", () => ({ computeCommitMetrics: vi.fn() }));
vi.mock("child_process", () => ({ execSync: vi.fn() }));

import { GET, POST } from "@/app/api/admin/swe-activity/[id]/metrics/route";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { computeCommitMetrics } from "@/lib/commit-metrics";
import { execSync } from "child_process";

function makeRequest(url: string, opts?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), opts as any);
}

const params = (id: string) => Promise.resolve({ id });

const MOCK_METRICS = {
  capturedAt: "2026-04-25T11:00:00Z",
  loc: { additions: 10, deletions: 5, net: 15, filesChanged: 2 },
  tokenMetrics: { totalTokens: 800, outputTokens: 300, inputTokens: 500, cachedTokens: 100, tokensPerLOC: 53, byAgent: {} },
  conversation: null,
  conversationScore: null,
  clDesign: null,
  scores: { ocs: 72 },
};

function mockAuthenticatedDb(rows: any[], savedRef?: { value: any }) {
  vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
  vi.mocked(getDb).mockReturnValue({
    select: () => ({ from: () => ({ where: async () => rows }) }),
    update: () => ({
      set: (values: any) => {
        if (savedRef) savedRef.value = values;
        return { where: async () => {} };
      },
    }),
  } as any);
}

describe("GET /api/admin/swe-activity/[id]/metrics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await GET(makeRequest("http://localhost/api/admin/swe-activity/1/metrics"), { params: params("1") });
    expect(res.status).toBe(401);
  });

  it("returns 404 when the activity does not exist", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(getDb).mockReturnValue({
      select: () => ({ from: () => ({ where: async () => [] }) }),
    } as any);

    const res = await GET(makeRequest("http://localhost/api/admin/swe-activity/99/metrics"), { params: params("99") });
    expect(res.status).toBe(404);
  });

  it("returns 400 when the activity type is not 'commit'", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(getDb).mockReturnValue({
      select: () => ({ from: () => ({ where: async () => [{ metrics: null, externalId: "vercel-deploy-x", type: "deployment" }] }) }),
    } as any);

    const res = await GET(makeRequest("http://localhost/api/admin/swe-activity/1/metrics"), { params: params("1") });
    expect(res.status).toBe(400);
  });

  it("returns stored metrics when authenticated and activity is a commit", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(getDb).mockReturnValue({
      select: () => ({ from: () => ({ where: async () => [{ metrics: MOCK_METRICS, externalId: "vercel-commit-abc123", type: "commit" }] }) }),
    } as any);

    const res = await GET(makeRequest("http://localhost/api/admin/swe-activity/1/metrics"), { params: params("1") });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.metrics.scores.ocs).toBe(72);
  });

  it("returns { metrics: null } when no metrics are stored yet", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(getDb).mockReturnValue({
      select: () => ({ from: () => ({ where: async () => [{ metrics: null, externalId: "vercel-commit-abc123", type: "commit" }] }) }),
    } as any);

    const res = await GET(makeRequest("http://localhost/api/admin/swe-activity/1/metrics"), { params: params("1") });
    expect(res.status).toBe(200);
    expect((await res.json()).metrics).toBeNull();
  });
});

describe("POST /api/admin/swe-activity/[id]/metrics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await POST(makeRequest("http://localhost/api/admin/swe-activity/1/metrics", { method: "POST" }), { params: params("1") });
    expect(res.status).toBe(401);
  });

  it("returns 404 when the activity does not exist", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(getDb).mockReturnValue({
      select: () => ({ from: () => ({ where: async () => [] }) }),
    } as any);

    const res = await POST(makeRequest("http://localhost/api/admin/swe-activity/99/metrics", { method: "POST" }), { params: params("99") });
    expect(res.status).toBe(404);
  });

  it("returns 400 when the activity type is not 'commit'", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(getDb).mockReturnValue({
      select: () => ({ from: () => ({ where: async () => [{ externalId: "vercel-deploy-x", type: "deployment" }] }) }),
    } as any);

    const res = await POST(makeRequest("http://localhost/api/admin/swe-activity/1/metrics", { method: "POST" }), { params: params("1") });
    expect(res.status).toBe(400);
  });

  it("derives prevSha from git log and passes it to computeCommitMetrics", async () => {
    // prevSha comes from git, not from the request body. This ensures the session
    // window is [prevCommitTime, commitTime] and not [epoch, commitTime].
    vi.mocked(execSync).mockReturnValue("def456\n" as any);
    const saved: { value: any } = { value: undefined };
    mockAuthenticatedDb([{ externalId: "vercel-commit-abc123", type: "commit" }], saved);
    vi.mocked(computeCommitMetrics).mockResolvedValue(MOCK_METRICS as any);

    const res = await POST(
      makeRequest("http://localhost/api/admin/swe-activity/1/metrics", { method: "POST" }),
      { params: params("1") },
    );

    expect(res.status).toBe(200);
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining("git log --pretty=%P -n1 abc123"),
      expect.anything(),
    );
    expect(computeCommitMetrics).toHaveBeenCalledWith(
      expect.objectContaining({ sha: "abc123", prevSha: "def456" }),
    );
    // Full atomic replacement — no stale fields survive.
    expect(saved.value).toEqual({
      metrics: MOCK_METRICS,
      updatedAt: expect.any(Date),
    });
    expect((await res.json()).metrics.scores.ocs).toBe(72);
  });

  it("uses empty prevSha for the first commit (no parent in git log)", async () => {
    vi.mocked(execSync).mockReturnValue("" as any);
    mockAuthenticatedDb([{ externalId: "vercel-commit-abc123", type: "commit" }]);
    vi.mocked(computeCommitMetrics).mockResolvedValue(MOCK_METRICS as any);

    await POST(
      makeRequest("http://localhost/api/admin/swe-activity/1/metrics", { method: "POST" }),
      { params: params("1") },
    );

    expect(computeCommitMetrics).toHaveBeenCalledWith(
      expect.objectContaining({ sha: "abc123", prevSha: "" }),
    );
  });

  it("uses empty prevSha when git log fails (SHA not present in local checkout)", async () => {
    vi.mocked(execSync).mockImplementation(() => { throw new Error("unknown revision"); });
    mockAuthenticatedDb([{ externalId: "vercel-commit-abc123", type: "commit" }]);
    vi.mocked(computeCommitMetrics).mockResolvedValue(MOCK_METRICS as any);

    const res = await POST(
      makeRequest("http://localhost/api/admin/swe-activity/1/metrics", { method: "POST" }),
      { params: params("1") },
    );

    expect(res.status).toBe(200);
    expect(computeCommitMetrics).toHaveBeenCalledWith(
      expect.objectContaining({ sha: "abc123", prevSha: "" }),
    );
  });

  it("returns 400 when externalId does not contain a SHA", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(getDb).mockReturnValue({
      select: () => ({ from: () => ({ where: async () => [{ externalId: "no-sha-here", type: "commit" }] }) }),
    } as any);

    const res = await POST(makeRequest("http://localhost/api/admin/swe-activity/1/metrics", { method: "POST" }), { params: params("1") });
    expect(res.status).toBe(400);
  });
});
