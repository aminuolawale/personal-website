// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ getSession: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { GET, POST } from "@/app/api/finder-previews/route";
import { PUT } from "@/app/api/finder-previews/[id]/route";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { PUBLIC_CACHE } from "@/lib/api";

function makeRequest(url: string, opts?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), opts as any);
}

const params = (id: string) => Promise.resolve({ id });

describe("GET /api/finder-previews", () => {
  it("returns public finder previews with parsed steps and cache headers", async () => {
    vi.mocked(getDb).mockReturnValue({
      select: () => ({
        from: () => ({
          orderBy: async () => [{
            id: 1,
            name: "Find Hercules",
            steps: JSON.stringify([{ targetId: "constellation:hercules", description: "Find the Keystone" }]),
          }],
        }),
      }),
    } as any);

    const res = await GET(makeRequest("http://localhost:3000/api/finder-previews"));

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe(PUBLIC_CACHE);
    expect(await res.json()).toMatchObject([{ id: 1, steps: [{ targetId: "constellation:hercules" }] }]);
  });

  it("requires auth in admin mode", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost:3000/api/finder-previews?admin=true"));

    expect(res.status).toBe(401);
  });
});

describe("POST /api/finder-previews", () => {
  it("creates a finder preview", async () => {
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

    const res = await POST(makeRequest("http://localhost:3000/api/finder-previews", {
      method: "POST",
      body: JSON.stringify({
        name: "Find M13",
        description: "A short hop",
        targetId: "deep-sky:hercules-cluster",
        stepDelaySeconds: 5,
        loop: true,
        steps: [{ targetId: "constellation:hercules", description: "Start with Hercules" }],
      }),
    }));

    expect(res.status).toBe(201);
    expect(insertedValues).toMatchObject({
      name: "Find M13",
      targetId: "deep-sky:hercules-cluster",
      stepDelaySeconds: 5,
      loop: true,
    });
    expect(JSON.parse(insertedValues.steps)).toEqual([{
      targetId: "constellation:hercules",
      description: "Start with Hercules",
      zoomLevel: 2.2,
    }]);
  });

  it("rejects invalid targets", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);

    const res = await POST(makeRequest("http://localhost:3000/api/finder-previews", {
      method: "POST",
      body: JSON.stringify({
        name: "Broken",
        targetId: "nope",
        steps: [{ targetId: "nope", description: "" }],
      }),
    }));

    expect(res.status).toBe(400);
  });
});

describe("PUT /api/finder-previews/[id]", () => {
  it("updates a finder preview", async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { email: "admin@test.com" } } as any);
    let updatedValues: any;
    vi.mocked(getDb).mockReturnValue({
      update: () => ({
        set: (values: any) => {
          updatedValues = values;
          return { where: () => ({ returning: async () => [{ id: 1, ...values }] }) };
        },
      }),
    } as any);

    const res = await PUT(makeRequest("http://localhost:3000/api/finder-previews/1", {
      method: "PUT",
      body: JSON.stringify({
        name: "Updated",
        targetId: "constellation:orion",
        steps: [{ targetId: "constellation:orion", description: "Frame Orion" }],
      }),
    }), { params: params("1") });

    expect(res.status).toBe(200);
    expect(updatedValues.name).toBe("Updated");
    expect(updatedValues.updatedAt).toBeInstanceOf(Date);
  });
});
