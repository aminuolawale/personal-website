// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { GET, POST } from "@/app/api/updates/route";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

const mockUpdates = [
  { id: 1, text: "Published update", published: true, createdAt: new Date() },
  { id: 2, text: "Draft update", published: false, createdAt: new Date() },
];

function makeRequest(url: string, opts?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), opts as any);
}

function mockDbSelect(rows: any[]) {
  vi.mocked(getDb).mockReturnValue({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: async () => rows,
          }),
        }),
      }),
    }),
  } as any);
}

describe("GET /api/updates", () => {
  it("returns published updates for public requests", async () => {
    mockDbSelect(mockUpdates.filter((u) => u.published));
    const req = makeRequest("http://localhost:3000/api/updates");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
  });

  it("returns 401 for admin mode without auth", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const req = makeRequest("http://localhost:3000/api/updates?admin=true");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns all updates in admin mode when authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    mockDbSelect(mockUpdates);
    const req = makeRequest("http://localhost:3000/api/updates?admin=true");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toHaveLength(2);
  });

  it("sets Cache-Control for public requests", async () => {
    mockDbSelect([]);
    const req = makeRequest("http://localhost:3000/api/updates");
    const res = await GET(req);
    expect(res.headers.get("Cache-Control")).toBeTruthy();
  });
});

describe("POST /api/updates", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const req = makeRequest("http://localhost:3000/api/updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Hello" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when text is missing", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    const req = makeRequest("http://localhost:3000/api/updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "  " }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates update and returns 201", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    const newUpdate = { id: 3, text: "New update", linkUrl: null, createdAt: new Date() };
    vi.mocked(getDb).mockReturnValue({
      insert: () => ({ values: () => ({ returning: async () => [newUpdate] }) }),
    } as any);

    const req = makeRequest("http://localhost:3000/api/updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "New update" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect((await res.json()).text).toBe("New update");
  });
});
