// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/updates", () => ({ createUpdate: vi.fn() }));

import { GET, POST } from "@/app/api/projects/route";
import { GET as GET_ID, PUT, DELETE } from "@/app/api/projects/[id]/route";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

function makeRequest(url: string, opts?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), opts as any);
}

const params = (id: string) => Promise.resolve({ id });

const project = { id: 1, title: "My App", published: true, position: 1 };

describe("GET /api/projects", () => {
  it("returns published projects with cache header", async () => {
    vi.mocked(getDb).mockReturnValue({
      select: () => ({
        from: () => ({ where: () => ({ orderBy: async () => [project] }) }),
      }),
    } as any);
    const res = await GET(makeRequest("http://localhost:3000/api/projects"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBeTruthy();
    expect(await res.json()).toHaveLength(1);
  });

  it("requires auth for admin mode", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await GET(makeRequest("http://localhost:3000/api/projects?admin=true"));
    expect(res.status).toBe(401);
  });

  it("returns all projects in admin mode when authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(getDb).mockReturnValue({
      select: () => ({
        from: () => ({ where: () => ({ orderBy: async () => [project] }) }),
      }),
    } as any);
    const res = await GET(makeRequest("http://localhost:3000/api/projects?admin=true"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBeNull();
  });
});

describe("POST /api/projects", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await POST(makeRequest("http://localhost:3000/api/projects", {
      method: "POST",
      body: JSON.stringify({ title: "Test" }),
    }));
    expect(res.status).toBe(401);
  });

  it("creates a project and returns 201", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(getDb).mockReturnValue({
      insert: () => ({ values: () => ({ returning: async () => [project] }) }),
    } as any);
    const res = await POST(makeRequest("http://localhost:3000/api/projects", {
      method: "POST",
      body: JSON.stringify({ title: "My App" }),
    }));
    expect(res.status).toBe(201);
    expect((await res.json()).title).toBe("My App");
  });
});

describe("GET /api/projects/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await GET_ID(makeRequest("http://localhost:3000/api/projects/1"), { params: params("1") });
    expect(res.status).toBe(401);
  });

  it("returns 404 when project does not exist", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(getDb).mockReturnValue({
      select: () => ({ from: () => ({ where: async () => [] }) }),
    } as any);
    const res = await GET_ID(makeRequest("http://localhost:3000/api/projects/1"), { params: params("1") });
    expect(res.status).toBe(404);
  });

  it("returns the project when found", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(getDb).mockReturnValue({
      select: () => ({ from: () => ({ where: async () => [project] }) }),
    } as any);
    const res = await GET_ID(makeRequest("http://localhost:3000/api/projects/1"), { params: params("1") });
    expect(res.status).toBe(200);
    expect((await res.json()).id).toBe(1);
  });
});

describe("PUT /api/projects/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await PUT(makeRequest("http://localhost:3000/api/projects/1", {
      method: "PUT",
      body: JSON.stringify({ title: "Updated" }),
    }), { params: params("1") });
    expect(res.status).toBe(401);
  });

  it("returns 404 when project does not exist", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(getDb).mockReturnValue({
      update: () => ({ set: () => ({ where: () => ({ returning: async () => [] }) }) }),
    } as any);
    const res = await PUT(makeRequest("http://localhost:3000/api/projects/1", {
      method: "PUT",
      body: JSON.stringify({ title: "Updated" }),
    }), { params: params("1") });
    expect(res.status).toBe(404);
  });

  it("updates and returns the project", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    const updated = { ...project, title: "Updated" };
    vi.mocked(getDb).mockReturnValue({
      update: () => ({ set: () => ({ where: () => ({ returning: async () => [updated] }) }) }),
    } as any);
    const res = await PUT(makeRequest("http://localhost:3000/api/projects/1", {
      method: "PUT",
      body: JSON.stringify({ title: "Updated" }),
    }), { params: params("1") });
    expect(res.status).toBe(200);
    expect((await res.json()).title).toBe("Updated");
  });
});

describe("DELETE /api/projects/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await DELETE(makeRequest("http://localhost:3000/api/projects/1"), { params: params("1") });
    expect(res.status).toBe(401);
  });

  it("deletes project and returns ok", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(getDb).mockReturnValue({
      delete: () => ({ where: async () => {} }),
    } as any);
    const res = await DELETE(makeRequest("http://localhost:3000/api/projects/1"), { params: params("1") });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
