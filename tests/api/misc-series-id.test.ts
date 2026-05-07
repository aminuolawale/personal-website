// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { DELETE, PUT } from "@/app/api/misc-series/[id]/route";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

function makeRequest(url: string, opts?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), opts as any);
}

const params = (id: string) => Promise.resolve({ id });

describe("PUT /api/misc-series/[id]", () => {
  it("requires authentication", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const res = await PUT(makeRequest("http://localhost:3000/api/misc-series/1", {
      method: "PUT",
      body: JSON.stringify({ title: "Letters" }),
    }), { params: params("1") });

    expect(res.status).toBe(401);
  });

  it("updates a misc series", async () => {
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

    const res = await PUT(makeRequest("http://localhost:3000/api/misc-series/1", {
      method: "PUT",
      body: JSON.stringify({ title: " Letters ", description: "Updated" }),
    }), { params: params("1") });

    expect(res.status).toBe(200);
    expect(updateValues).toMatchObject({ title: "Letters", description: "Updated" });
    expect(updateValues.updatedAt).toBeInstanceOf(Date);
  });
});

describe("DELETE /api/misc-series/[id]", () => {
  it("requires authentication", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const res = await DELETE(makeRequest("http://localhost:3000/api/misc-series/1"), { params: params("1") });

    expect(res.status).toBe(401);
  });

  it("unassigns articles before deleting the series", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    const calls: string[] = [];
    let unassignedValues: any;
    vi.mocked(getDb).mockReturnValue({
      update: () => ({
        set: (values: any) => {
          calls.push("update");
          unassignedValues = values;
          return { where: async () => undefined };
        },
      }),
      delete: () => ({
        where: () => {
          calls.push("delete");
          return { returning: async () => [{ id: 1 }] };
        },
      }),
    } as any);

    const res = await DELETE(makeRequest("http://localhost:3000/api/misc-series/1"), { params: params("1") });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(calls).toEqual(["update", "delete"]);
    expect(unassignedValues).toMatchObject({ seriesId: null });
    expect(unassignedValues.updatedAt).toBeInstanceOf(Date);
  });
});
