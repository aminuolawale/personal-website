import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// --- Mocks -----------------------------------------------------------

const mockReader = { email: "reader@test.com", name: "Test Reader", image: null };
const mockComment = {
  id: 1,
  articleId: 1,
  readerEmail: "reader@test.com",
  readerName: "Test Reader",
  readerAvatarUrl: null,
  content: "Great post!",
  approved: false,
  country: null,
  createdAt: new Date(),
};

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn().mockResolvedValue(false),
  getReaderSession: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(),
}));

// Stub next/server so NextRequest/NextResponse work in Node env
vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return actual;
});

import { GET, POST } from "@/app/api/comments/route";
import { getReaderSession, getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

function makeRequest(url: string, opts?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), opts);
}

describe("GET /api/comments", () => {
  beforeEach(() => {
    vi.mocked(getSession).mockResolvedValue(false);
  });

  it("returns 400 when articleId is missing and not admin", async () => {
    const req = makeRequest("http://localhost:3000/api/comments");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns approved comments for a given articleId", async () => {
    const approvedComment = { ...mockComment, approved: true };
    vi.mocked(getDb).mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: () => [approvedComment],
          }),
        }),
      }),
    } as any);

    const req = makeRequest("http://localhost:3000/api/comments?articleId=1");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body[0].approved).toBe(true);
  });

  it("returns 401 for admin mode when not admin", async () => {
    vi.mocked(getSession).mockResolvedValue(false);
    const req = makeRequest("http://localhost:3000/api/comments?admin=true");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});

describe("POST /api/comments", () => {
  beforeEach(() => {
    vi.mocked(getReaderSession).mockResolvedValue(null);
  });

  it("returns 401 when not signed in", async () => {
    vi.mocked(getReaderSession).mockResolvedValue(null);
    const req = makeRequest("http://localhost:3000/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId: 1, content: "hello" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when content is missing", async () => {
    vi.mocked(getReaderSession).mockResolvedValue(mockReader);
    const req = makeRequest("http://localhost:3000/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId: 1 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when articleId is missing", async () => {
    vi.mocked(getReaderSession).mockResolvedValue(mockReader);
    const req = makeRequest("http://localhost:3000/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "hello" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates a comment and returns 201 when signed in", async () => {
    vi.mocked(getReaderSession).mockResolvedValue(mockReader);
    vi.mocked(getDb).mockReturnValue({
      insert: () => ({
        values: () => ({
          returning: () => [mockComment],
        }),
      }),
    } as any);

    const req = makeRequest("http://localhost:3000/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId: 1, content: "Great post!" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.content).toBe("Great post!");
    expect(body.approved).toBe(false);
  });
});
