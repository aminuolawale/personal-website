// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockReader = { email: "reader@test.com", name: "Test Reader", image: null };
const mockBookmark = {
  id: 1,
  readerEmail: "reader@test.com",
  articleId: 42,
  country: null,
  createdAt: new Date(),
};

vi.mock("@/lib/auth", () => ({
  getReaderSession: vi.fn().mockResolvedValue(null), // no-arg version
}));

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(),
}));

import { GET, POST, DELETE } from "@/app/api/bookmarks/route";
import { getReaderSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

function makeRequest(url: string, opts?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), opts as any);
}

describe("GET /api/bookmarks", () => {
  it("returns 401 when not signed in", async () => {
    vi.mocked(getReaderSession).mockResolvedValue(null);
    const req = makeRequest("http://localhost:3000/api/bookmarks");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns empty array when reader has no bookmarks", async () => {
    vi.mocked(getReaderSession).mockResolvedValue(mockReader);
    vi.mocked(getDb).mockReturnValue({
      select: () => ({ from: () => ({ where: () => [] }) }),
    } as any);

    const req = makeRequest("http://localhost:3000/api/bookmarks");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  it("returns bookmarks with article data when signed in", async () => {
    vi.mocked(getReaderSession).mockResolvedValue(mockReader);
    const mockArticle = { id: 42, title: "Test Article", slug: "test-article", type: "writing" };

    let callCount = 0;
    vi.mocked(getDb).mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => {
            callCount++;
            if (callCount === 1) return [mockBookmark];
            return [mockArticle];
          },
        }),
      }),
    } as any);

    const req = makeRequest("http://localhost:3000/api/bookmarks");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].articleId).toBe(42);
    expect(body[0].article?.title).toBe("Test Article");
  });
});

describe("POST /api/bookmarks", () => {
  it("returns 401 when not signed in", async () => {
    vi.mocked(getReaderSession).mockResolvedValue(null);
    const req = makeRequest("http://localhost:3000/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId: 1 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when articleId missing", async () => {
    vi.mocked(getReaderSession).mockResolvedValue(mockReader);
    const req = makeRequest("http://localhost:3000/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates bookmark and returns bookmarked: true", async () => {
    vi.mocked(getReaderSession).mockResolvedValue(mockReader);
    vi.mocked(getDb).mockReturnValue({
      insert: () => ({
        values: () => ({ onConflictDoNothing: async () => {} }),
      }),
    } as any);

    const req = makeRequest("http://localhost:3000/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId: 42 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ bookmarked: true });
  });
});

describe("DELETE /api/bookmarks", () => {
  it("returns 401 when not signed in", async () => {
    vi.mocked(getReaderSession).mockResolvedValue(null);
    const req = makeRequest("http://localhost:3000/api/bookmarks?articleId=42");
    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when articleId missing from query", async () => {
    vi.mocked(getReaderSession).mockResolvedValue(mockReader);
    const req = makeRequest("http://localhost:3000/api/bookmarks");
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });

  it("removes bookmark and returns bookmarked: false", async () => {
    vi.mocked(getReaderSession).mockResolvedValue(mockReader);
    vi.mocked(getDb).mockReturnValue({
      delete: () => ({ where: async () => {} }),
    } as any);

    const req = makeRequest("http://localhost:3000/api/bookmarks?articleId=42");
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ bookmarked: false });
  });
});
