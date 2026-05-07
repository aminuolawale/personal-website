// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/observability/server", () => ({ logTelemetryEvent: vi.fn() }));

import { POST } from "@/app/api/telemetry/events/route";
import { logTelemetryEvent } from "@/lib/observability/server";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest(new URL("http://localhost:3000/api/telemetry/events"), {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "Vitest Browser" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/telemetry/events", () => {
  it("rejects unknown event names", async () => {
    const res = await POST(makeRequest({ name: "unknown.event" }));

    expect(res.status).toBe(400);
  });

  it("logs valid telemetry events with sanitized attributes", async () => {
    const res = await POST(makeRequest({
      name: "public.reader.opened",
      route: "/writing",
      section: "writing",
      targetType: "article",
      targetId: "book-review",
      attributes: {
        safe: "yes",
        nested: { no: true },
      },
    }));

    expect(res.status).toBe(200);
    expect(logTelemetryEvent).toHaveBeenCalledWith(expect.objectContaining({
      name: "public.reader.opened",
      route: "/writing",
      section: "writing",
      targetType: "article",
      targetId: "book-review",
      attributes: expect.objectContaining({
        safe: "yes",
        source: "client",
      }),
    }));
    expect(vi.mocked(logTelemetryEvent).mock.calls[0][0].attributes).not.toHaveProperty("nested");
  });
});
