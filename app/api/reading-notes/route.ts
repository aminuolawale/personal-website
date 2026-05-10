import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { badRequest, notFound, PUBLIC_CACHE, serverError, unauthorized } from "@/lib/api";
import { getDb } from "@/lib/db";
import { books, readingNotes } from "@/lib/schema";
import { createUpdate } from "@/lib/updates";
import { cleanText } from "@/lib/validation";

function hasVisibleText(html: string) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim().length > 0;
}

function parseNoteDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return new Date();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const adminMode = searchParams.get("admin") === "true";
  const bookId = searchParams.get("bookId");

  if (adminMode && !(await getSession())) return unauthorized();

  try {
    const conditions = [];
    if (bookId) {
      const parsedBookId = Number(bookId);
      if (!Number.isInteger(parsedBookId)) return badRequest("Book id must be valid");
      conditions.push(eq(readingNotes.bookId, parsedBookId));
    }

    const rows = await getDb()
      .select()
      .from(readingNotes)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(readingNotes.createdAt));

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
  const bookId = Number(body.bookId);
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const content = cleanText(body.content);
  const publishAsUpdate = body.publishAsUpdate === true;
  const createdAt = parseNoteDate(body.noteDate);

  if (!Number.isInteger(bookId) || bookId <= 0) return badRequest("Book is required");
  if (!hasVisibleText(content)) return badRequest("Reading note text is required");
  if (!createdAt) return badRequest("A valid note date is required");

  try {
    const db = getDb();
    const [book] = await db.select().from(books).where(eq(books.id, bookId));
    if (!book) return notFound("Book not found");

    const [note] = await db
      .insert(readingNotes)
      .values({ bookId, description, content, createdAt })
      .returning();

    if (publishAsUpdate) {
      await createUpdate({
        text: `Aminu added a reading note for ${book.title} — ${book.author}`,
        linkUrl: "/writing?tab=reading-notes",
      });
    }

    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
