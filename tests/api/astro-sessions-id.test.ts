// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/observability/server", () => ({ logTelemetryEvent: vi.fn() }));

import { DELETE } from "@/app/api/astro-sessions/[id]/route";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

function makeRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

const params = (id: string) => Promise.resolve({ id });

describe("DELETE /api/astro-sessions/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await DELETE(makeRequest("http://localhost:3000/api/astro-sessions/1"), { params: params("1") });
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid id", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    const res = await DELETE(makeRequest("http://localhost:3000/api/astro-sessions/abc"), { params: params("abc") });
    expect(res.status).toBe(400);
  });

  it("returns 404 when session does not exist", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(getDb).mockReturnValue({
      delete: () => ({ where: () => ({ returning: async () => [] }) }),
    } as any);
    const res = await DELETE(makeRequest("http://localhost:3000/api/astro-sessions/1"), { params: params("1") });
    expect(res.status).toBe(404);
  });

  it("deletes and returns ok", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    const session = { id: 1, targetId: "constellation:orion" };
    vi.mocked(getDb).mockReturnValue({
      delete: () => ({ where: () => ({ returning: async () => [session] }) }),
    } as any);
    const res = await DELETE(makeRequest("http://localhost:3000/api/astro-sessions/1"), { params: params("1") });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
