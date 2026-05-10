import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { badRequest, notFound } from "@/lib/api";
import { withAuth } from "@/lib/with-auth";
import { getDb } from "@/lib/db";
import { astroSessions } from "@/lib/schema";
import { logTelemetryEvent } from "@/lib/observability/server";
import { parseId } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export const DELETE = withAuth(async (_req: NextRequest, { params }: Params) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Valid session id is required");

  const [deleted] = await getDb()
    .delete(astroSessions)
    .where(eq(astroSessions.id, id))
    .returning();

  if (!deleted) return notFound("Session not found");
  logTelemetryEvent({
    name: "admin.astro_session.deleted",
    section: "astrophotography",
    targetType: "astro_session",
    targetId: id,
    attributes: { target_id: deleted.targetId },
  });
  return NextResponse.json({ ok: true });
});
