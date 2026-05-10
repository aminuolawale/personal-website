import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { badRequest, notFound, serverError, unauthorized } from "@/lib/api";
import { getDb } from "@/lib/db";
import { astroSessions } from "@/lib/schema";
import { logTelemetryEvent } from "@/lib/observability/server";
import { parseId } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!(await getSession())) return unauthorized();
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Valid session id is required");

  try {
    const db = getDb();
    const [deleted] = await db
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
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
