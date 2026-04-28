// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { GET, PUT, DELETE } from "@/app/api/articles/[id]/route";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

const mockArticle = { id: 1, title: "Test Article", slug: "test-article", type: "swe" };

function makeRequest(url: string, opts?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), opts as any);
}

const params = (id: string) => Promise.resolve({ id });

describe("GET /api/articles/[id]", () => {
  it("returns 404 when article does not exist", async () => {
    vi.mocked(getDb).mockReturnValue({
      select: () => ({ from: () => ({ where: async () => [] }) }),
    } as any);

    const req = makeRequest("http://localhost:3000/api/articles/99");
    const res = await GET(req, { params: params("99") });
    expect(res.status).toBe(404);
  });

  it("returns article when found", async () => {
    vi.mocked(getDb).mockReturnValue({
      select: () => ({ from: () => ({ where: async () => [mockArticle] }) }),
    } as any);

    const req = makeRequest("http://localhost:3000/api/articles/1");
    const res = await GET(req, { params: params("1") });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: 1, title: "Test Article" });
  });
});

describe("PUT /api/articles/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const req = makeRequest("http://localhost:3000/api/articles/1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });
    const res = await PUT(req, { params: params("1") });
    expect(res.status).toBe(401);
  });

  it("updates and returns the article", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    const updated = { ...mockArticle, title: "Updated Title" };
    vi.mocked(getDb).mockReturnValue({
      update: () => ({
        set: () => ({
          where: () => ({
            returning: async () => [updated],
          }),
        }),
      }),
    } as any);

    const req = makeRequest("http://localhost:3000/api/articles/1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Title" }),
    });
    const res = await PUT(req, { params: params("1") });
    expect(res.status).toBe(200);
    expect((await res.json()).title).toBe("Updated Title");
  });
});

describe("DELETE /api/articles/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const req = makeRequest("http://localhost:3000/api/articles/1");
    const res = await DELETE(req, { params: params("1") });
    expect(res.status).toBe(401);
  });

  it("deletes article and returns { ok: true }", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(getDb).mockReturnValue({
      delete: () => ({ where: async () => {} }),
    } as any);

    const req = makeRequest("http://localhost:3000/api/articles/1");
    const res = await DELETE(req, { params: params("1") });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
