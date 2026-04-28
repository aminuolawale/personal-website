// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { GET, PUT } from "@/app/api/config/route";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

function makeRequest(url: string, opts?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), opts as any);
}

describe("GET /api/config", () => {
  it("returns 400 when key is missing", async () => {
    const req = makeRequest("http://localhost:3000/api/config");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns { value: null } when no row exists", async () => {
    vi.mocked(getDb).mockReturnValue({
      select: () => ({ from: () => ({ where: async () => [] }) }),
    } as any);

    const req = makeRequest("http://localhost:3000/api/config?key=site-content");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ value: null });
  });

  it("returns parsed JSON value when row exists", async () => {
    const storedValue = { greeting: "Hi there", name: "Test." };
    vi.mocked(getDb).mockReturnValue({
      select: () => ({
        from: () => ({
          where: async () => [{ key: "site-content", value: JSON.stringify(storedValue) }],
        }),
      }),
    } as any);

    const req = makeRequest("http://localhost:3000/api/config?key=site-content");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ value: storedValue });
  });

  it("returns { value: null } on db error", async () => {
    vi.mocked(getDb).mockReturnValue({
      select: () => ({ from: () => ({ where: async () => { throw new Error("db error"); } }) }),
    } as any);

    const req = makeRequest("http://localhost:3000/api/config?key=site-content");
    const res = await GET(req);
    expect(await res.json()).toEqual({ value: null });
  });
});

describe("PUT /api/config", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const req = makeRequest("http://localhost:3000/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "site-content", value: {} }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(401);
  });

  it("upserts value and returns { ok: true } when authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(getDb).mockReturnValue({
      insert: () => ({
        values: () => ({
          onConflictDoUpdate: async () => {},
        }),
      }),
    } as any);

    const req = makeRequest("http://localhost:3000/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "site-content", value: { greeting: "Hello" } }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("returns 500 when db throws", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(getDb).mockReturnValue({
      insert: () => ({
        values: () => ({
          onConflictDoUpdate: async () => { throw new Error("db error"); },
        }),
      }),
    } as any);

    const req = makeRequest("http://localhost:3000/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "site-content", value: {} }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(500);
  });
});
