import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn().mockResolvedValue(false),
}));

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(),
}));

import { GET } from "@/app/api/admin/analytics/route";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

const now = new Date();

const mockBookmark = {
  id: 1,
  readerEmail: "alice@test.com",
  articleId: 10,
  country: "US",
  createdAt: now,
};
const mockComment = {
  id: 1,
  readerEmail: "bob@test.com",
  readerName: "Bob",
  readerAvatarUrl: null,
  articleId: 20,
  content: "Nice!",
  approved: true,
  country: "GB",
  createdAt: now,
};
const mockArticle = { id: 10, title: "Article A", slug: "article-a", type: "writing" };

function makeRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("GET /api/admin/analytics", () => {
  it("returns 401 when not admin", async () => {
    vi.mocked(getSession).mockResolvedValue(false);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns reader profiles aggregated from bookmarks and comments", async () => {
    vi.mocked(getSession).mockResolvedValue(true);

    // The route calls Promise.all([
    //   db.select().from(bookmarks).orderBy(...),   → array of bookmarks
    //   db.select().from(comments).orderBy(...),    → array of comments
    //   db.select({...}).from(articles),            → array of articles (no orderBy)
    // ])
    let fromCallCount = 0;
    vi.mocked(getDb).mockReturnValue({
      select: () => ({
        from: () => {
          fromCallCount++;
          if (fromCallCount === 1) return { orderBy: async () => [mockBookmark] };
          if (fromCallCount === 2) return { orderBy: async () => [mockComment] };
          return Promise.resolve([mockArticle]); // articles query has no orderBy
        },
      }),
    } as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(body.readers)).toBe(true);
  });

  it("returns total of 0 when no readers", async () => {
    vi.mocked(getSession).mockResolvedValue(true);

    let fromCallCount = 0;
    vi.mocked(getDb).mockReturnValue({
      select: () => ({
        from: () => {
          fromCallCount++;
          if (fromCallCount === 1) return { orderBy: async () => [] };
          if (fromCallCount === 2) return { orderBy: async () => [] };
          return Promise.resolve([]); // articles
        },
      }),
    } as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(0);
    expect(body.readers).toEqual([]);
  });
});
