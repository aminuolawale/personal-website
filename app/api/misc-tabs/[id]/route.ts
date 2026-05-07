import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { badRequest, serverError, unauthorized } from "@/lib/api";
import { getDb } from "@/lib/db";
import { articles, miscTabs } from "@/lib/schema";
import { slugify } from "@/lib/utils";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return unauthorized();

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Invalid tab id");

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
      .update(miscTabs)
      .set({ title, slug, description, position, updatedAt: new Date() })
      .where(eq(miscTabs.id, id))
      .returning();

    if (!tab) return NextResponse.json({ error: "Tab not found" }, { status: 404 });
    return NextResponse.json(tab);
  } catch (err) {
    console.error(err);
    return serverError();
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return unauthorized();

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Invalid tab id");

  try {
    const db = getDb();
    await db
      .update(articles)
      .set({ miscTabId: null, updatedAt: new Date() })
      .where(eq(articles.miscTabId, id));

    const [deleted] = await db.delete(miscTabs).where(eq(miscTabs.id, id)).returning();
    if (!deleted) return NextResponse.json({ error: "Tab not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
