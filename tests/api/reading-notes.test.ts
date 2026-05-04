// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { GET, POST } from "@/app/api/reading-notes/route";
import { PUT } from "@/app/api/reading-notes/[id]/route";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

function makeRequest(url: string, opts?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), opts as any);
}

const params = (id: string) => Promise.resolve({ id });

describe("GET /api/reading-notes", () => {
  it("returns public notes newest first with cache header", async () => {
    vi.mocked(getDb).mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: async () => [{ id: 1, bookId: 1, content: "<p>Note</p>" }],
          }),
        }),
      }),
    } as any);

    const res = await GET(makeRequest("http://localhost:3000/api/reading-notes"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBeTruthy();
    expect(await res.json()).toHaveLength(1);
  });

  it("requires auth for admin mode", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await GET(makeRequest("http://localhost:3000/api/reading-notes?admin=true"));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/reading-notes", () => {
  it("requires authentication", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await POST(makeRequest("http://localhost:3000/api/reading-notes", {
      method: "POST",
      body: JSON.stringify({ bookId: 1, content: "<p>Note</p>" }),
    }));
    expect(res.status).toBe(401);
  });

  it("rejects empty rich text", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    const res = await POST(makeRequest("http://localhost:3000/api/reading-notes", {
      method: "POST",
      body: JSON.stringify({ bookId: 1, content: "<p></p>" }),
    }));
    expect(res.status).toBe(400);
  });

  it("creates a note for an existing book", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    let insertedValues: any;
    vi.mocked(getDb).mockReturnValue({
      select: () => ({ from: () => ({ where: async () => [{ id: 1, title: "Dune" }] }) }),
      insert: () => ({
        values: (values: any) => {
          insertedValues = values;
          return { returning: async () => [{ id: 2, ...values }] };
        },
      }),
    } as any);

    const res = await POST(makeRequest("http://localhost:3000/api/reading-notes", {
      method: "POST",
      body: JSON.stringify({ bookId: 1, content: "<p>Good note</p>" }),
    }));

    expect(res.status).toBe(201);
    expect(insertedValues).toMatchObject({ bookId: 1, content: "<p>Good note</p>" });
  });
});

describe("PUT /api/reading-notes/[id]", () => {
  it("requires authentication", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await PUT(makeRequest("http://localhost:3000/api/reading-notes/1", {
      method: "PUT",
      body: JSON.stringify({ content: "<p>Updated</p>" }),
    }), { params: params("1") });
    expect(res.status).toBe(401);
  });

  it("updates only the reading note content", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    let updatedValues: any;
    vi.mocked(getDb).mockReturnValue({
      update: () => ({
        set: (values: any) => {
          updatedValues = values;
          return {
            where: () => ({
              returning: async () => [{ id: 1, bookId: 1, ...values }],
            }),
          };
        },
      }),
    } as any);

    const res = await PUT(makeRequest("http://localhost:3000/api/reading-notes/1", {
      method: "PUT",
      body: JSON.stringify({ bookId: 99, content: "<p>Updated</p>" }),
    }), { params: params("1") });

    expect(res.status).toBe(200);
    expect(updatedValues).toMatchObject({ content: "<p>Updated</p>" });
    expect(updatedValues).not.toHaveProperty("bookId");
  });
});
