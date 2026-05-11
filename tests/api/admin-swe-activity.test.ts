// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, describe, it, expect, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/commit-metrics-cache", () => ({ readCommitMetricsCache: vi.fn().mockResolvedValue(null) }));

import { GET } from "@/app/api/admin/swe-activity/route";
import { POST as SYNC_POST } from "@/app/api/admin/swe-activity/sync/route";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { readCommitMetricsCache } from "@/lib/commit-metrics-cache";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("GET /api/admin/swe-activity", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns activity list when authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    const activity = [{ id: 1, message: "pushed to main", type: "commit" }];
    vi.mocked(getDb).mockReturnValue({
      select: () => ({
        from: () => ({ where: () => ({ orderBy: () => ({ limit: async () => activity }) }) }),
      }),
    } as any);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.activities).toHaveLength(1);
  });
});

describe("POST /api/admin/swe-activity/sync", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const req = new Request("http://localhost/api/admin/swe-activity/sync") as any;
    req.nextUrl = new URL(req.url);

    const res = await SYNC_POST(req);

    expect(res.status).toBe(401);
  });

  it("syncs latest commits from GitHub when authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(readCommitMetricsCache).mockResolvedValue({
      schemaVersion: 1,
      generatedAt: "2026-05-11T00:00:00.000Z",
      sha: "abc1234567890",
      loc: { additions: 10, deletions: 2, filesChanged: 1 },
      tokenMetrics: {
        totalTokens: 100,
        outputTokens: 40,
        cachedTokens: 0,
        reasoningTokens: 0,
        tokensPerLOC: 12.5,
        byAgent: {},
      },
      conversationScore: {
        specificity: {
          total: 80,
          mode: "implementation_request",
          components: {
            taskIntentClarity: 20,
            contextQuality: 15,
            constraintsAndAcceptance: 16,
            actionability: 18,
            iterativeSteering: 7,
            communicationHygiene: 4,
          },
          confidence: 0.86,
          explanation: "specific",
          improvement: "Add acceptance checks.",
        },
      },
      scores: { ocs: 86, scs: 90 },
    } as any);

    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
    vi.mocked(getDb).mockReturnValue({
      insert: vi.fn().mockReturnValue({ values }),
    } as any);

    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          {
            sha: "abc1234567890",
            html_url: "https://github.com/aminuolawale/personal-website/commit/abc1234567890",
            commit: {
              message: "Add admin sync\n\nBody",
              author: {
                name: "Mohammed",
                email: "m@example.com",
                date: "2026-05-11T10:00:00.000Z",
              },
            },
          },
        ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          sha: "abc1234567890",
          html_url: "https://github.com/aminuolawale/personal-website/commit/abc1234567890",
          commit: {
            message: "Add admin sync\n\nBody",
            author: {
              name: "Mohammed",
              email: "m@example.com",
              date: "2026-05-11T10:00:00.000Z",
            },
          },
          stats: { additions: 10, deletions: 2 },
          files: [{ filename: "app/api/admin/swe-activity/sync/route.ts" }],
        }),
      }));

    const req = new Request("http://localhost/api/admin/swe-activity/sync?limit=1") as any;
    req.nextUrl = new URL(req.url);

    const res = await SYNC_POST(req);

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      success: true,
      repo: "aminuolawale/personal-website",
      branch: "main",
      received: 1,
      synced: 1,
    });
    expect(values).toHaveBeenCalledWith([
      expect.objectContaining({
        externalId: "vercel-commit-abc1234567890",
        type: "commit",
        message: "Mohammed made the commit 'Add admin sync' to personal-website",
        repo: "personal-website",
        url: "https://github.com/aminuolawale/personal-website/commit/abc1234567890",
        commitMetadata: expect.objectContaining({
          sha: "abc1234567890",
          shortSha: "abc1234",
          additions: 10,
          deletions: 2,
          changedFiles: 1,
        }),
      }),
    ]);
    expect(onConflictDoUpdate).toHaveBeenCalled();
  });
});
