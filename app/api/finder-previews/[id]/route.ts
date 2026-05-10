import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { badRequest, notFound, serverError } from "@/lib/api";
import { withAuth } from "@/lib/with-auth";
import { getDb } from "@/lib/db";
import { finderPreviews } from "@/lib/schema";
import { normalizeFinderPayload, parseFinderSteps } from "@/lib/finder-previews";
import { parseId } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

function serializePreview(row: typeof finderPreviews.$inferSelect) {
  return { ...row, steps: parseFinderSteps(row.steps) };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const id = parseId((await params).id);
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

export const PUT = withAuth(async (req: NextRequest, { params }: Params) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Valid finder preview id is required");

  const payload = normalizeFinderPayload(await req.json());
  if ("error" in payload) return badRequest(payload.error);

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
});

export const DELETE = withAuth(async (_req: NextRequest, { params }: Params) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Valid finder preview id is required");

  await getDb().delete(finderPreviews).where(eq(finderPreviews.id, id));
  return NextResponse.json({ ok: true });
});
