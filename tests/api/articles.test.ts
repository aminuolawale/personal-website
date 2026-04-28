// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/updates", () => ({ createUpdate: vi.fn().mockResolvedValue(undefined) }));

import { GET, POST } from "@/app/api/articles/route";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { createUpdate } from "@/lib/updates";

const mockArticles = [
  { id: 1, title: "Published Article", slug: "published-article", type: "swe", published: true },
  { id: 2, title: "Draft Article", slug: "draft-article", type: "swe", published: false },
];

function makeRequest(url: string, opts?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), opts as any);
}

function mockDbSelect(rows: any[]) {
  vi.mocked(getDb).mockReturnValue({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () => rows,
        }),
      }),
    }),
  } as any);
}

describe("GET /api/articles", () => {
  beforeEach(() => {
    vi.mocked(getSession).mockResolvedValue(null);
  });

  it("returns published articles for public requests", async () => {
    mockDbSelect(mockArticles.filter((a) => a.published));
    const req = makeRequest("http://localhost:3000/api/articles?type=swe");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].published).toBe(true);
  });

  it("returns 401 for admin requests when not authenticated", async () => {
    const req = makeRequest("http://localhost:3000/api/articles?admin=true");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns all articles in admin mode when authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    mockDbSelect(mockArticles);
    const req = makeRequest("http://localhost:3000/api/articles?admin=true");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toHaveLength(2);
  });

  it("sets Cache-Control header for public requests", async () => {
    mockDbSelect([]);
    const req = makeRequest("http://localhost:3000/api/articles");
    const res = await GET(req);
    expect(res.headers.get("Cache-Control")).toBeTruthy();
  });
});

describe("POST /api/articles", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const req = makeRequest("http://localhost:3000/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Article", type: "swe" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("creates article and returns 201", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    const newArticle = { id: 3, title: "New Article", slug: "new-article", type: "swe" };
    vi.mocked(getDb).mockReturnValue({
      insert: () => ({ values: () => ({ returning: async () => [newArticle] }) }),
    } as any);

    const req = makeRequest("http://localhost:3000/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Article", type: "swe" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.slug).toBe("new-article");
  });

  it("generates a slug from the title when none is provided", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    let insertedValues: any;
    vi.mocked(getDb).mockReturnValue({
      insert: () => ({
        values: (v: any) => {
          insertedValues = v;
          return { returning: async () => [{ ...v, id: 1 }] };
        },
      }),
    } as any);

    const req = makeRequest("http://localhost:3000/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Hello World", type: "writing" }),
    });
    await POST(req);
    expect(insertedValues.slug).toBe("hello-world");
  });

  it("uses provided slug over generated one", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    let insertedValues: any;
    vi.mocked(getDb).mockReturnValue({
      insert: () => ({
        values: (v: any) => {
          insertedValues = v;
          return { returning: async () => [{ ...v, id: 1 }] };
        },
      }),
    } as any);

    const req = makeRequest("http://localhost:3000/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Hello World", slug: "my-custom-slug", type: "writing" }),
    });
    await POST(req);
    expect(insertedValues.slug).toBe("my-custom-slug");
  });

  it("calls createUpdate when publishAsUpdate is true", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    const article = { id: 1, title: "Big Post", slug: "big-post", type: "writing" };
    vi.mocked(getDb).mockReturnValue({
      insert: () => ({ values: () => ({ returning: async () => [article] }) }),
    } as any);

    const req = makeRequest("http://localhost:3000/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Big Post", type: "writing", publishAsUpdate: true }),
    });
    await POST(req);
    expect(createUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining("Big Post") })
    );
  });
});
