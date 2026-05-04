// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { GET, POST } from "@/app/api/book-categories/route";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

function makeRequest(url: string, opts?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), opts as any);
}

describe("GET /api/book-categories", () => {
  it("returns public categories with a cache header", async () => {
    vi.mocked(getDb).mockReturnValue({
      select: () => ({ from: () => ({ orderBy: async () => [{ id: 1, name: "Fiction" }] }) }),
    } as any);

    const res = await GET(makeRequest("http://localhost:3000/api/book-categories"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBeTruthy();
    expect(await res.json()).toEqual([{ id: 1, name: "Fiction" }]);
  });

  it("requires auth for admin mode", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await GET(makeRequest("http://localhost:3000/api/book-categories?admin=true"));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/book-categories", () => {
  it("requires authentication", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await POST(makeRequest("http://localhost:3000/api/book-categories", {
      method: "POST",
      body: JSON.stringify({ name: "Fiction" }),
    }));
    expect(res.status).toBe(401);
  });

  it("creates a category", async () => {
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

    const res = await POST(makeRequest("http://localhost:3000/api/book-categories", {
      method: "POST",
      body: JSON.stringify({ name: " Fiction " }),
    }));

    expect(res.status).toBe(201);
    expect(insertedValues).toEqual({ name: "Fiction" });
  });
});
