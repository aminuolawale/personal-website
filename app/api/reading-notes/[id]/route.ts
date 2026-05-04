import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { badRequest, serverError, unauthorized } from "@/lib/api";
import { getDb } from "@/lib/db";
import { readingNotes } from "@/lib/schema";

function cleanRichText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function hasVisibleText(html: string) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim().length > 0;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) return unauthorized();

  const { id } = await params;
  const content = cleanRichText((await req.json()).content);
  if (!hasVisibleText(content)) return badRequest("Reading note text is required");

  try {
    const [note] = await getDb()
      .update(readingNotes)
      .set({ content, updatedAt: new Date() })
      .where(eq(readingNotes.id, parseInt(id)))
      .returning();
    return NextResponse.json(note);
  } catch (err) {
    console.error(err);
    return serverError();
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getSession())) return unauthorized();

  const { id } = await params;
  try {
    await getDb().delete(readingNotes).where(eq(readingNotes.id, parseInt(id)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
