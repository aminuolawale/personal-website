import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { badRequest, PUBLIC_CACHE, serverError, unauthorized } from "@/lib/api";
import { getDb } from "@/lib/db";
import { miscTabs } from "@/lib/schema";
import { slugify } from "@/lib/utils";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const adminMode = searchParams.get("admin") === "true";

  if (adminMode && !(await getSession())) return unauthorized();

  try {
    const rows = await getDb()
      .select()
      .from(miscTabs)
      .orderBy(asc(miscTabs.position), asc(miscTabs.title));
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

  const body = await req.json();
  const title = cleanText(body.title);
  const slug = cleanText(body.slug) || slugify(title);
  const description = cleanText(body.description);
  const position = Number(body.position ?? 99);

  if (!title) return badRequest("Tab title is required");
  if (!slug) return badRequest("Tab slug is required");
  if (!Number.isInteger(position)) return badRequest("Position must be a whole number");

  try {
    const [tab] = await getDb()
      .insert(miscTabs)
      .values({ title, slug, description, position })
      .returning();
    return NextResponse.json(tab, { status: 201 });
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
