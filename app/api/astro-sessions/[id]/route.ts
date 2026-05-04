import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { badRequest, notFound, serverError, unauthorized } from "@/lib/api";
import { getDb } from "@/lib/db";
import { astroSessions } from "@/lib/schema";

type Params = { params: Promise<{ id: string }> };

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

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
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
