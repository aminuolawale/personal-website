// Key-value site configuration store.
// Values are JSON-stringified so any serialisable type can be stored.
// Currently used for tab order: key = "tab-order-<section>", value = string[].

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { siteConfig } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { unauthorized, badRequest, serverError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const keys = searchParams.get("keys");

  if (!key && !keys) return badRequest("Missing key");

  try {
    const db = getDb();

    if (keys) {
      const keyList = keys.split(",").map((k) => k.trim()).filter(Boolean);
      if (keyList.length === 0) return badRequest("Empty keys");
      const rows = await db.select().from(siteConfig).where(inArray(siteConfig.key, keyList));
      const values: Record<string, unknown> = {};
      for (const row of rows) values[row.key] = JSON.parse(row.value);
      const res = NextResponse.json({ values });
      res.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
      return res;
    }

    const [row] = await db.select().from(siteConfig).where(eq(siteConfig.key, key!));
    const res = NextResponse.json({ value: row ? JSON.parse(row.value) : null });
    res.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
    return res;
  } catch {
    if (keys) return NextResponse.json({ values: {} });
    return NextResponse.json({ value: null });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await getSession())) return unauthorized();
  try {
    const { key, value } = await req.json();
    const db = getDb();
    // Upsert: insert the row, or overwrite the value if the key already exists.
    await db
      .insert(siteConfig)
      .values({ key, value: JSON.stringify(value), updatedAt: new Date() })
      .onConflictDoUpdate({ target: siteConfig.key, set: { value: JSON.stringify(value), updatedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return serverError("Failed to save");
  }
}
