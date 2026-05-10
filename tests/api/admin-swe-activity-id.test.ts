// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { DELETE, PUT } from "@/app/api/admin/swe-activity/[id]/route";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

function makeRequest(url: string, opts?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), opts as any);
}

const params = (id: string) => Promise.resolve({ id });

describe("PUT /api/admin/swe-activity/[id]", () => {
  it("requires authentication", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const res = await PUT(
      makeRequest("http://localhost:3000/api/admin/swe-activity/1", {
        method: "PUT",
        body: JSON.stringify({ message: "updated" }),
      }),
      { params: params("1") }
    );

    expect(res.status).toBe(401);
  });

  it("updates a swe activity entry", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    let updateValues: any;
    vi.mocked(getDb).mockReturnValue({
      update: () => ({
        set: (values: any) => {
          updateValues = values;
          return { where: () => ({ returning: async () => [{ id: 1, ...values }] }) };
        },
      }),
    } as any);

    const res = await PUT(
      makeRequest("http://localhost:3000/api/admin/swe-activity/1", {
        method: "PUT",
        body: JSON.stringify({ message: "new message", note: "a note" }),
      }),
      { params: params("1") }
    );

    expect(res.status).toBe(200);
    expect(updateValues).toMatchObject({ message: "new message", note: "a note" });
    expect(updateValues.updatedAt).toBeInstanceOf(Date);
    expect(updateValues).not.toHaveProperty("scs");
  });

  it("returns 404 when entry does not exist", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(getDb).mockReturnValue({
      update: () => ({
        set: () => ({ where: () => ({ returning: async () => [] }) }),
      }),
    } as any);

    const res = await PUT(
      makeRequest("http://localhost:3000/api/admin/swe-activity/99", {
        method: "PUT",
        body: JSON.stringify({ message: "x" }),
      }),
      { params: params("99") }
    );

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/admin/swe-activity/[id]", () => {
  it("requires authentication", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const res = await DELETE(
      makeRequest("http://localhost:3000/api/admin/swe-activity/1"),
      { params: params("1") }
    );

    expect(res.status).toBe(401);
  });

  it("hides a swe activity entry", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    let updateValues: any;
    vi.mocked(getDb).mockReturnValue({
      update: () => ({
        set: (values: any) => {
          updateValues = values;
          return { where: () => ({ returning: async () => [{ id: 1, ...values }] }) };
        },
      }),
    } as any);

    const res = await DELETE(
      makeRequest("http://localhost:3000/api/admin/swe-activity/1"),
      { params: params("1") }
    );

    expect(res.status).toBe(200);
    expect(updateValues.hidden).toBe(true);
    expect(await res.json()).toEqual({ success: true });
  });

  it("returns 404 when entry does not exist", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    vi.mocked(getDb).mockReturnValue({
      update: () => ({
        set: () => ({ where: () => ({ returning: async () => [] }) }),
      }),
    } as any);

    const res = await DELETE(
      makeRequest("http://localhost:3000/api/admin/swe-activity/99"),
      { params: params("99") }
    );

    expect(res.status).toBe(404);
  });
});
