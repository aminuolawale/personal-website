// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

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
const mockArticle = { id: 20, title: "Article A", slug: "article-a", type: "writing" };

describe("GET /api/admin/analytics", () => {
  it("returns 401 when not admin", async () => {
    vi.mocked(getSession).mockResolvedValue(false);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns reader profiles aggregated from comments", async () => {
    vi.mocked(getSession).mockResolvedValue(true);

    // The route calls Promise.all([
    //   db.select().from(comments).orderBy(...),    → array of comments
    //   db.select({...}).from(articles),            → array of articles (no orderBy)
    // ])
    let fromCallCount = 0;
    vi.mocked(getDb).mockReturnValue({
      select: () => ({
        from: () => {
          fromCallCount++;
          if (fromCallCount === 1) return { orderBy: async () => [mockComment] };
          return Promise.resolve([mockArticle]);
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
          return Promise.resolve([]);
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
