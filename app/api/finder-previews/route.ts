import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { badRequest, PUBLIC_CACHE, serverError, unauthorized } from "@/lib/api";
import { getDb } from "@/lib/db";
import { finderPreviews } from "@/lib/schema";
import { normalizeFinderPayload, parseFinderSteps } from "@/lib/finder-previews";

function serializePreview(row: typeof finderPreviews.$inferSelect) {
  return { ...row, steps: parseFinderSteps(row.steps) };
}

export async function GET(req: NextRequest) {
  const adminMode = req.nextUrl.searchParams.get("admin") === "true";
  if (adminMode && !(await getSession())) return unauthorized();

  try {
    const rows = await getDb()
      .select()
      .from(finderPreviews)
      .orderBy(asc(finderPreviews.name));
    const res = NextResponse.json(rows.map(serializePreview));
    if (!adminMode) res.headers.set("Cache-Control", PUBLIC_CACHE);
    return res;
  } catch (err) {
    console.error(err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  if (!(await getSession())) return unauthorized();

  const payload = normalizeFinderPayload(await req.json());
  if ("error" in payload) return badRequest(payload.error);

  try {
    const [preview] = await getDb()
      .insert(finderPreviews)
      .values({
        name: payload.name,
        description: payload.description,
        targetId: payload.targetId,
        stepDelaySeconds: payload.stepDelaySeconds,
        loop: payload.loop,
        steps: JSON.stringify(payload.steps),
      })
      .returning();

    return NextResponse.json(serializePreview(preview), { status: 201 });
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
