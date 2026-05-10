import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { badRequest } from "@/lib/api";
import { withAuth } from "@/lib/with-auth";
import { getDb } from "@/lib/db";
import { readingNotes } from "@/lib/schema";
import { cleanText, parseId } from "@/lib/validation";

function hasVisibleText(html: string) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim().length > 0;
}

export const PUT = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid id");

  const body = await req.json();
  const content = cleanText(body.content);
  const description = typeof body.description === "string" ? body.description.trim() : undefined;
  if (!hasVisibleText(content)) return badRequest("Reading note text is required");

  const [note] = await getDb()
    .update(readingNotes)
    .set({ content, ...(description !== undefined && { description }), updatedAt: new Date() })
    .where(eq(readingNotes.id, id))
    .returning();
  return NextResponse.json(note);
});

export const DELETE = withAuth(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const id = parseId((await params).id);
  if (!id) return badRequest("Invalid id");

  await getDb().delete(readingNotes).where(eq(readingNotes.id, id));
  return NextResponse.json({ ok: true });
});
