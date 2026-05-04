import { NextRequest, NextResponse } from "next/server";
import { asc, desc, gte } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { badRequest, PUBLIC_CACHE, serverError, unauthorized } from "@/lib/api";
import { getDb } from "@/lib/db";
import { astroGear, astroSessions, type AstroGear, type AstroSession } from "@/lib/schema";
import { getSkyTargetById } from "@/lib/sky-targets";

export interface AstroSessionResponse extends AstroSession {
  gear: AstroGear[];
}

function parseGearIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0)
    )
  );
}

function readGearIds(row: AstroSession): number[] {
  try {
    return parseGearIds(JSON.parse(row.gearIds));
  } catch {
    return [];
  }
}

async function attachGear(rows: AstroSession[]): Promise<AstroSessionResponse[]> {
  if (rows.length === 0) return [];
  const allGearIds = new Set(rows.flatMap(readGearIds));
  if (allGearIds.size === 0) return rows.map((row) => ({ ...row, gear: [] }));

  const db = getDb();
  const gear = await db.select().from(astroGear).orderBy(asc(astroGear.name));
  const gearById = new Map(gear.map((item) => [item.id, item]));

  return rows.map((row) => ({
    ...row,
    gear: readGearIds(row).flatMap((id) => {
      const item = gearById.get(id);
      return item ? [item] : [];
    }),
  }));
}

export async function GET(req: NextRequest) {
  const adminMode = req.nextUrl.searchParams.get("admin") === "true";
  const includePast = req.nextUrl.searchParams.get("includePast") === "true";

  if (adminMode && !(await getSession())) return unauthorized();

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(astroSessions)
      .where(adminMode || includePast ? undefined : gte(astroSessions.scheduledAt, new Date()))
      .orderBy(adminMode || includePast ? desc(astroSessions.scheduledAt) : asc(astroSessions.scheduledAt));

    const res = NextResponse.json(await attachGear(rows));
    if (!adminMode) res.headers.set("Cache-Control", PUBLIC_CACHE);
    return res;
  } catch (err) {
    console.error(err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  if (!(await getSession())) return unauthorized();

  try {
    const { title, scheduledAt, targetId, gearIds, notes } = await req.json();
    const target = typeof targetId === "string" ? getSkyTargetById(targetId) : null;
    const date = new Date(scheduledAt);

    if (!String(title ?? "").trim()) return badRequest("Title is required");
    if (!target) return badRequest("A valid sky target is required");
    if (Number.isNaN(date.getTime())) return badRequest("A valid date and time are required");

    const db = getDb();
    const [session] = await db
      .insert(astroSessions)
      .values({
        title: String(title).trim(),
        scheduledAt: date,
        targetId: target.id,
        targetName: target.name,
        gearIds: JSON.stringify(parseGearIds(gearIds)),
        notes: String(notes ?? "").trim(),
      })
      .returning();

    const [sessionWithGear] = await attachGear([session]);
    return NextResponse.json(sessionWithGear, { status: 201 });
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
