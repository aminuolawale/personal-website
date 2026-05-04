// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { GET, POST } from "@/app/api/books/route";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

function makeRequest(url: string, opts?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), opts as any);
}

describe("GET /api/books", () => {
  it("returns public books with a cache header", async () => {
    vi.mocked(getDb).mockReturnValue({
      select: () => ({ from: () => ({ orderBy: async () => [{ id: 1, title: "Dune" }] }) }),
    } as any);

    const res = await GET(makeRequest("http://localhost:3000/api/books"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBeTruthy();
    expect(await res.json()).toEqual([{ id: 1, title: "Dune" }]);
  });

  it("requires auth for admin mode", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await GET(makeRequest("http://localhost:3000/api/books?admin=true"));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/books", () => {
  it("requires authentication", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await POST(makeRequest("http://localhost:3000/api/books", {
      method: "POST",
      body: JSON.stringify({ title: "Dune", author: "Frank Herbert", yearPublished: 1965 }),
    }));
    expect(res.status).toBe(401);
  });

  it("validates required book fields", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    const res = await POST(makeRequest("http://localhost:3000/api/books", {
      method: "POST",
      body: JSON.stringify({ title: "", author: "Frank Herbert", yearPublished: 1965 }),
    }));
    expect(res.status).toBe(400);
  });

  it("creates a book", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    let insertedValues: any;
    vi.mocked(getDb).mockReturnValue({
      insert: () => ({
        values: (values: any) => {
          insertedValues = values;
          return { returning: async () => [{ id: 1, ...values }] };
        },
      }),
    } as any);

    const res = await POST(makeRequest("http://localhost:3000/api/books", {
      method: "POST",
      body: JSON.stringify({ title: " Dune ", author: " Frank Herbert ", yearPublished: "1965" }),
    }));

    expect(res.status).toBe(201);
    expect(insertedValues).toMatchObject({
      title: "Dune",
      author: "Frank Herbert",
      yearPublished: 1965,
      categoryId: null,
    });
  });

  it("assigns an existing category to a book", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    let insertedValues: any;
    vi.mocked(getDb).mockReturnValue({
      select: () => ({ from: () => ({ where: async () => [{ id: 4, name: "Fiction" }] }) }),
      insert: () => ({
        values: (values: any) => {
          insertedValues = values;
          return { returning: async () => [{ id: 1, ...values }] };
        },
      }),
    } as any);

    const res = await POST(makeRequest("http://localhost:3000/api/books", {
      method: "POST",
      body: JSON.stringify({
        title: "Dune",
        author: "Frank Herbert",
        yearPublished: 1965,
        categoryId: 4,
      }),
    }));

    expect(res.status).toBe(201);
    expect(insertedValues.categoryId).toBe(4);
  });
});
