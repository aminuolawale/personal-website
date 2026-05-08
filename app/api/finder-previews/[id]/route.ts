import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { badRequest, notFound, serverError, unauthorized } from "@/lib/api";
import { getDb } from "@/lib/db";
import { finderPreviews } from "@/lib/schema";
import { normalizeFinderPayload, parseFinderSteps } from "@/lib/finder-previews";

type Params = { params: Promise<{ id: string }> };

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function serializePreview(row: typeof finderPreviews.$inferSelect) {
  return { ...row, steps: parseFinderSteps(row.steps) };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Valid finder preview id is required");

  try {
    const [preview] = await getDb()
      .select()
      .from(finderPreviews)
      .where(eq(finderPreviews.id, id));
    if (!preview) return notFound("Finder preview not found");
    const res = NextResponse.json(serializePreview(preview));
    res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=86400");
    return res;
  } catch (err) {
    console.error(err);
    return serverError();
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  if (!(await getSession())) return unauthorized();

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Valid finder preview id is required");

  const payload = normalizeFinderPayload(await req.json());
  if ("error" in payload) return badRequest(payload.error);

  try {
    const [preview] = await getDb()
      .update(finderPreviews)
      .set({
        name: payload.name,
        description: payload.description,
        targetId: payload.targetId,
        stepDelaySeconds: payload.stepDelaySeconds,
        loop: payload.loop,
        steps: JSON.stringify(payload.steps),
        updatedAt: new Date(),
      })
      .where(eq(finderPreviews.id, id))
      .returning();
    if (!preview) return notFound("Finder preview not found");
    return NextResponse.json(serializePreview(preview));
  } catch (err) {
    console.error(err);
    return serverError();
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!(await getSession())) return unauthorized();

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Valid finder preview id is required");

  try {
    await getDb().delete(finderPreviews).where(eq(finderPreviews.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
