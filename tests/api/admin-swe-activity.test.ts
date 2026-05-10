// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/vercel-activity", () => ({ fetchVercelActivity: vi.fn().mockResolvedValue([]) }));
vi.mock("@/lib/swe-activity-sync", () => ({ syncActivitiesToDb: vi.fn() }));

import { GET } from "@/app/api/admin/swe-activity/route";
import { POST } from "@/app/api/admin/swe-activity/sync/route";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

function makeRequest(url: string, method = "GET"): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), { method });
}

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
        from: () => ({ orderBy: () => ({ limit: async () => activity }) }),
      }),
    } as any);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toHaveLength(1);
  });
});

describe("POST /api/admin/swe-activity/sync", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("runs sync and returns count when authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    const { fetchVercelActivity } = await import("@/lib/vercel-activity");
    vi.mocked(fetchVercelActivity).mockResolvedValue([
      { id: "v-1", type: "deployment", message: "deployed", timestamp: new Date().toISOString() },
    ] as any);
    const res = await POST();
    expect(res.status).toBe(200);
    expect((await res.json()).count).toBe(1);
  });
});
