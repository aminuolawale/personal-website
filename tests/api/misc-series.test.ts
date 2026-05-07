// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { GET, POST } from "@/app/api/misc-series/route";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { PUBLIC_CACHE } from "@/lib/api";

function makeRequest(url: string, opts?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), opts as any);
}

describe("GET /api/misc-series", () => {
  it("returns public series with cache headers", async () => {
    vi.mocked(getDb).mockReturnValue({
      select: () => ({ from: () => ({ orderBy: async () => [{ id: 1, title: "Letters" }] }) }),
    } as any);

    const res = await GET(makeRequest("http://localhost:3000/api/misc-series"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe(PUBLIC_CACHE);
    expect(await res.json()).toEqual([{ id: 1, title: "Letters" }]);
  });

  it("requires auth for admin mode", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await GET(makeRequest("http://localhost:3000/api/misc-series?admin=true"));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/misc-series", () => {
  it("requires authentication", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await POST(makeRequest("http://localhost:3000/api/misc-series", {
      method: "POST",
      body: JSON.stringify({ title: "Letters" }),
    }));
    expect(res.status).toBe(401);
  });

  it("creates a misc series", async () => {
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

    const res = await POST(makeRequest("http://localhost:3000/api/misc-series", {
      method: "POST",
      body: JSON.stringify({ title: " Letters ", description: "A series" }),
    }));

    expect(res.status).toBe(201);
    expect(insertedValues).toEqual({ title: "Letters", description: "A series" });
  });
});
