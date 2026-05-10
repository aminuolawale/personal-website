// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { PUT, DELETE } from "@/app/api/updates/[id]/route";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

function makeRequest(url: string, opts?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), opts as any);
}

const params = (id: string) => Promise.resolve({ id });

describe("PUT /api/updates/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await PUT(makeRequest("http://localhost:3000/api/updates/1", {
      method: "PUT",
      body: JSON.stringify({ text: "Hello" }),
    }), { params: params("1") });
    expect(res.status).toBe(401);
  });

  it("returns 400 when text is empty", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    const res = await PUT(makeRequest("http://localhost:3000/api/updates/1", {
      method: "PUT",
      body: JSON.stringify({ text: "  " }),
    }), { params: params("1") });
    expect(res.status).toBe(400);
  });

  it("updates and returns the row", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    const row = { id: 1, text: "Updated text" };
    vi.mocked(getDb).mockReturnValue({
      update: () => ({ set: () => ({ where: () => ({ returning: async () => [row] }) }) }),
    } as any);
    const res = await PUT(makeRequest("http://localhost:3000/api/updates/1", {
      method: "PUT",
      body: JSON.stringify({ text: "Updated text" }),
    }), { params: params("1") });
    expect(res.status).toBe(200);
    expect((await res.json()).text).toBe("Updated text");
  });
});

describe("DELETE /api/updates/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await DELETE(makeRequest("http://localhost:3000/api/updates/1"), { params: params("1") });
    expect(res.status).toBe(401);
  });

  it("deletes and returns ok", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(getDb).mockReturnValue({
      delete: () => ({ where: async () => {} }),
    } as any);
    const res = await DELETE(makeRequest("http://localhost:3000/api/updates/1"), { params: params("1") });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
