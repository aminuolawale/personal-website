import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { astroGear } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { unauthorized, serverError } from "@/lib/api";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) return unauthorized();
  const { id } = await params;
  try {
    const db = getDb();
    await db.delete(astroGear).where(eq(astroGear.id, parseInt(id)));
    return NextResponse.json({ ok: true });
  } catch {
    return serverError();
  }
}
