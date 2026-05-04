import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { badRequest, PUBLIC_CACHE, serverError, unauthorized } from "@/lib/api";
import { getDb } from "@/lib/db";
import { bookCategories } from "@/lib/schema";

function cleanName(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const adminMode = searchParams.get("admin") === "true";

  if (adminMode && !(await getSession())) return unauthorized();

  try {
    const rows = await getDb()
      .select()
      .from(bookCategories)
      .orderBy(asc(bookCategories.name));
    const res = NextResponse.json(rows);
    if (!adminMode) res.headers.set("Cache-Control", PUBLIC_CACHE);
    return res;
  } catch (err) {
    console.error(err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  if (!(await getSession())) return unauthorized();

  const name = cleanName((await req.json()).name);
  if (!name) return badRequest("Category name is required");

  try {
    const [category] = await getDb()
      .insert(bookCategories)
      .values({ name })
      .returning();
    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
