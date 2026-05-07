import { NextRequest, NextResponse } from "next/server";
import { badRequest } from "@/lib/api";
import { isTelemetryEventName, sanitizeAttributes } from "@/lib/observability/events";
import { logTelemetryEvent } from "@/lib/observability/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return badRequest("Invalid telemetry payload");
  if (!isTelemetryEventName(body.name)) return badRequest("Invalid telemetry event name");

  logTelemetryEvent({
    name: body.name,
    route: typeof body.route === "string" ? body.route : req.nextUrl.pathname,
    section: typeof body.section === "string" ? body.section : undefined,
    targetType: typeof body.targetType === "string" ? body.targetType : undefined,
    targetId: typeof body.targetId === "string" || typeof body.targetId === "number" ? body.targetId : undefined,
    attributes: {
      ...sanitizeAttributes(body.attributes),
      source: "client",
      user_agent_family: req.headers.get("user-agent")?.split(" ")[0],
    },
  });

  return NextResponse.json({ ok: true });
}
