import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { projects } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { notFound, badRequest } from "@/lib/api";
import { withAuth } from "@/lib/with-auth";
import { parseId } from "@/lib/validation";

export const GET = withAuth(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid id");

  const [project] = await getDb().select().from(projects).where(eq(projects.id, id));
  if (!project) return notFound();
  return NextResponse.json(project);
});

export const PUT = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid id");

  const body = await req.json();
  const [project] = await getDb()
    .update(projects)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning();
  if (!project) return notFound();
  return NextResponse.json(project);
});

export const DELETE = withAuth(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid id");

  await getDb().delete(projects).where(eq(projects.id, id));
  return NextResponse.json({ ok: true });
});
