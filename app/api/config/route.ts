// Key-value site configuration store.
// Values are JSON-stringified so any serialisable type can be stored.
// Currently used for tab order: key = "tab-order-<section>", value = string[].

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { siteConfig } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { unauthorized, badRequest, serverError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get("key");
  if (!key) return badRequest("Missing key");
  try {
    const db = getDb();
    const [row] = await db.select().from(siteConfig).where(eq(siteConfig.key, key));
    const res = NextResponse.json({ value: row ? JSON.parse(row.value) : null });
    res.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
    return res;
  } catch {
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
