// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { POST } from "@/app/api/astro-sessions/route";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(new URL("http://localhost:3000/api/astro-sessions"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  } as RequestInit);
}

describe("POST /api/astro-sessions", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await POST(makeRequest({ title: "M42" }));
    expect(res.status).toBe(401);
  });

  it("validates the target id", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } });
    const res = await POST(makeRequest({
      title: "M42",
      scheduledAt: "2026-05-05T22:00:00.000Z",
      targetId: "unknown",
      gearIds: [],
    }));
    expect(res.status).toBe(400);
  });

  it("creates a session with normalized gear ids", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } });
    const created = {
      id: 1,
      title: "M42",
      scheduledAt: new Date("2026-05-05T22:00:00.000Z"),
      targetId: "deep-sky:orion-nebula",
      targetName: "Orion Nebula",
      gearIds: "[2]",
      notes: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const gear = [{ id: 2, type: "equipment", name: "Scope", imageUrl: null, link: null, createdAt: new Date() }];

    vi.mocked(getDb).mockReturnValue({
      insert: () => ({
        values: (values: Record<string, unknown>) => {
          expect(values.gearIds).toBe("[2]");
          return { returning: async () => [created] };
        },
      }),
      select: () => ({
        from: () => ({
          orderBy: async () => gear,
        }),
      }),
    } as ReturnType<typeof getDb>);

    const res = await POST(makeRequest({
      title: "  M42  ",
      scheduledAt: "2026-05-05T22:00:00.000Z",
      targetId: "deep-sky:orion-nebula",
      gearIds: [2, "2", "bad"],
    }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.title).toBe("M42");
    expect(body.gear).toHaveLength(1);
  });
});
