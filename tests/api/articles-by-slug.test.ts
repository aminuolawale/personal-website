// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { GET } from "@/app/api/articles/by-slug/[slug]/route";
import { getDb } from "@/lib/db";
import { PUBLIC_CACHE } from "@/lib/api";

function makeRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

const params = (slug: string) => Promise.resolve({ slug });

const article = { id: 1, title: "Hello World", slug: "hello-world", type: "swe", published: true };

describe("GET /api/articles/by-slug/[slug]", () => {
  it("returns 404 when article does not exist", async () => {
    vi.mocked(getDb).mockReturnValue({
      select: () => ({ from: () => ({ where: async () => [] }) }),
    } as any);
    const res = await GET(makeRequest("http://localhost:3000/api/articles/by-slug/hello-world"), { params: params("hello-world") });
    expect(res.status).toBe(404);
  });

  it("returns article with cache header", async () => {
    vi.mocked(getDb).mockReturnValue({
      select: () => ({ from: () => ({ where: async () => [article] }) }),
    } as any);
    const res = await GET(makeRequest("http://localhost:3000/api/articles/by-slug/hello-world"), { params: params("hello-world") });
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe(PUBLIC_CACHE);
    expect((await res.json()).slug).toBe("hello-world");
  });
});
