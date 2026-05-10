// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/updates", () => ({ createUpdate: vi.fn() }));

import { GET, POST } from "@/app/api/gallery/route";
import { GET as GET_ID, PUT, DELETE } from "@/app/api/gallery/[id]/route";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

function makeRequest(url: string, opts?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), opts as any);
}

const params = (id: string) => Promise.resolve({ id });

const photo = { id: 1, name: "Orion Nebula", published: true, imageUrl: "https://img.test/orion.jpg" };

describe("GET /api/gallery", () => {
  it("returns published photos with cache header", async () => {
    vi.mocked(getDb).mockReturnValue({
      select: () => ({
        from: () => ({ where: () => ({ orderBy: async () => [photo] }) }),
      }),
    } as any);
    const res = await GET(makeRequest("http://localhost:3000/api/gallery"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBeTruthy();
  });

  it("requires auth for admin mode", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await GET(makeRequest("http://localhost:3000/api/gallery?admin=true"));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/gallery", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await POST(makeRequest("http://localhost:3000/api/gallery", {
      method: "POST",
      body: JSON.stringify({ name: "Orion" }),
    }));
    expect(res.status).toBe(401);
  });

  it("creates a photo and returns 201", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(getDb).mockReturnValue({
      insert: () => ({ values: () => ({ returning: async () => [photo] }) }),
    } as any);
    const res = await POST(makeRequest("http://localhost:3000/api/gallery", {
      method: "POST",
      body: JSON.stringify({ name: "Orion Nebula", imageUrl: "https://img.test/orion.jpg" }),
    }));
    expect(res.status).toBe(201);
    expect((await res.json()).name).toBe("Orion Nebula");
  });
});

describe("GET /api/gallery/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await GET_ID(makeRequest("http://localhost:3000/api/gallery/1"), { params: params("1") });
    expect(res.status).toBe(401);
  });

  it("returns 404 when photo does not exist", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(getDb).mockReturnValue({
      select: () => ({ from: () => ({ where: async () => [] }) }),
    } as any);
    const res = await GET_ID(makeRequest("http://localhost:3000/api/gallery/1"), { params: params("1") });
    expect(res.status).toBe(404);
  });

  it("returns the photo when found", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(getDb).mockReturnValue({
      select: () => ({ from: () => ({ where: async () => [photo] }) }),
    } as any);
    const res = await GET_ID(makeRequest("http://localhost:3000/api/gallery/1"), { params: params("1") });
    expect(res.status).toBe(200);
    expect((await res.json()).id).toBe(1);
  });
});

describe("PUT /api/gallery/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await PUT(makeRequest("http://localhost:3000/api/gallery/1", {
      method: "PUT",
      body: JSON.stringify({ name: "Updated" }),
    }), { params: params("1") });
    expect(res.status).toBe(401);
  });

  it("updates and returns the photo", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    const updated = { ...photo, name: "Updated" };
    vi.mocked(getDb).mockReturnValue({
      update: () => ({ set: () => ({ where: () => ({ returning: async () => [updated] }) }) }),
    } as any);
    const res = await PUT(makeRequest("http://localhost:3000/api/gallery/1", {
      method: "PUT",
      body: JSON.stringify({ name: "Updated" }),
    }), { params: params("1") });
    expect(res.status).toBe(200);
    expect((await res.json()).name).toBe("Updated");
  });
});

describe("DELETE /api/gallery/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await DELETE(makeRequest("http://localhost:3000/api/gallery/1"), { params: params("1") });
    expect(res.status).toBe(401);
  });

  it("deletes and returns ok", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(getDb).mockReturnValue({
      delete: () => ({ where: async () => {} }),
    } as any);
    const res = await DELETE(makeRequest("http://localhost:3000/api/gallery/1"), { params: params("1") });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
