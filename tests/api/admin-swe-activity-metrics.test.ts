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

function makeRequest(url: string, opts?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), opts as any);
}

const params = (id: string) => Promise.resolve({ id });

const MOCK_METRICS = {
  capturedAt: "2026-04-25T11:00:00Z",
  loc: { additions: 10, deletions: 5, net: 15, filesChanged: 2 },
  tokenMetrics: { totalTokens: 800, outputTokens: 300, inputTokens: 500, cachedTokens: 100, tokensPerLOC: 53, byAgent: {} },
  promptChain: [],
  foundationPrompt: null,
  clDesign: null,
  scores: { ocs: 72 },
};

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

  it("recomputes metrics and saves them to the database", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    let savedMetrics: any;
    vi.mocked(getDb).mockReturnValue({
      select: () => ({ from: () => ({ where: async () => [{ externalId: "vercel-commit-abc123", type: "commit" }] }) }),
      update: () => ({
        set: (values: any) => {
          savedMetrics = values;
          return { where: async () => {} };
        },
      }),
    } as any);
    vi.mocked(computeCommitMetrics).mockResolvedValue(MOCK_METRICS as any);

    const res = await POST(
      makeRequest("http://localhost/api/admin/swe-activity/1/metrics", {
        method: "POST",
        body: JSON.stringify({ prevSha: "def456" }),
      }),
      { params: params("1") }
    );

    expect(res.status).toBe(200);
    expect(computeCommitMetrics).toHaveBeenCalledWith(
      expect.objectContaining({ sha: "abc123", prevSha: "def456" })
    );
    expect(savedMetrics.metrics).toEqual(MOCK_METRICS);
    const body = await res.json();
    expect(body.metrics.scores.ocs).toBe(72);
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
