import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { projects } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { unauthorized, notFound, badRequest, serverError } from "@/lib/api";
import { parseId } from "@/lib/validation";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) return unauthorized();
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Invalid id");
  try {
    const db = getDb();
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    if (!project) return notFound();
    return NextResponse.json(project);
  } catch {
    return serverError();
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) return unauthorized();
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Invalid id");
  try {
    const body = await req.json();
    const db = getDb();
    const [project] = await db
      .update(projects)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    if (!project) return notFound();
    return NextResponse.json(project);
  } catch {
    return serverError();
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) return unauthorized();
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Invalid id");
  try {
    const db = getDb();
    await db.delete(projects).where(eq(projects.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return serverError();
  }
}
