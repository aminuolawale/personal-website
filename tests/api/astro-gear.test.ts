// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/updates", () => ({ createUpdate: vi.fn() }));

import { GET, POST } from "@/app/api/astro-gear/route";
import { PATCH, DELETE } from "@/app/api/astro-gear/[id]/route";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

function makeRequest(url: string, opts?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), opts as any);
}

const params = (id: string) => Promise.resolve({ id });

const gearItem = { id: 1, type: "equipment", name: "Sky-Watcher 8\"", imageUrl: null, link: null };

describe("GET /api/astro-gear", () => {
  it("returns gear with cache header", async () => {
    vi.mocked(getDb).mockReturnValue({
      select: () => ({
        from: () => ({ orderBy: async () => [gearItem] }),
      }),
    } as any);
    const res = await GET(makeRequest("http://localhost:3000/api/astro-gear"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBeTruthy();
    expect(await res.json()).toHaveLength(1);
  });
});

describe("POST /api/astro-gear", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await POST(makeRequest("http://localhost:3000/api/astro-gear", {
      method: "POST",
      body: JSON.stringify({ type: "equipment", name: "Scope" }),
    }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid type", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    const res = await POST(makeRequest("http://localhost:3000/api/astro-gear", {
      method: "POST",
      body: JSON.stringify({ type: "invalid", name: "Scope" }),
    }));
    expect(res.status).toBe(400);
  });

  it("creates gear and returns 201", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(getDb).mockReturnValue({
      insert: () => ({ values: () => ({ returning: async () => [gearItem] }) }),
    } as any);
    const res = await POST(makeRequest("http://localhost:3000/api/astro-gear", {
      method: "POST",
      body: JSON.stringify({ type: "equipment", name: "Sky-Watcher 8\"" }),
    }));
    expect(res.status).toBe(201);
    expect((await res.json()).name).toBe("Sky-Watcher 8\"");
  });
});

describe("PATCH /api/astro-gear/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await PATCH(makeRequest("http://localhost:3000/api/astro-gear/1", {
      method: "PATCH",
      body: JSON.stringify({ name: "Updated" }),
    }), { params: params("1") });
    expect(res.status).toBe(401);
  });

  it("returns 400 when name is missing", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    const res = await PATCH(makeRequest("http://localhost:3000/api/astro-gear/1", {
      method: "PATCH",
      body: JSON.stringify({ name: "" }),
    }), { params: params("1") });
    expect(res.status).toBe(400);
  });

  it("updates and returns the gear item", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    const updated = { ...gearItem, name: "Updated Name" };
    vi.mocked(getDb).mockReturnValue({
      update: () => ({ set: () => ({ where: () => ({ returning: async () => [updated] }) }) }),
    } as any);
    const res = await PATCH(makeRequest("http://localhost:3000/api/astro-gear/1", {
      method: "PATCH",
      body: JSON.stringify({ name: "Updated Name" }),
    }), { params: params("1") });
    expect(res.status).toBe(200);
    expect((await res.json()).name).toBe("Updated Name");
  });
});

describe("DELETE /api/astro-gear/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await DELETE(makeRequest("http://localhost:3000/api/astro-gear/1"), { params: params("1") });
    expect(res.status).toBe(401);
  });

  it("deletes and returns ok", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(getDb).mockReturnValue({
      delete: () => ({ where: async () => {} }),
    } as any);
    const res = await DELETE(makeRequest("http://localhost:3000/api/astro-gear/1"), { params: params("1") });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
