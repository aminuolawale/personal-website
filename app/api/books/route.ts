import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { badRequest, notFound, PUBLIC_CACHE, serverError, unauthorized } from "@/lib/api";
import { getDb } from "@/lib/db";
import { bookCategories, books } from "@/lib/schema";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const adminMode = searchParams.get("admin") === "true";

  if (adminMode && !(await getSession())) return unauthorized();

  try {
    const rows = await getDb().select().from(books).orderBy(asc(books.title));
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
  const author = cleanText(body.author);
  const yearPublished = Number(body.yearPublished);
  const categoryId = body.categoryId === null || body.categoryId === undefined || body.categoryId === ""
    ? null
    : Number(body.categoryId);

  if (!title) return badRequest("Book title is required");
  if (!author) return badRequest("Book author is required");
  if (!Number.isInteger(yearPublished) || yearPublished < 0) {
    return badRequest("Published year must be a valid year");
  }
  if (categoryId !== null && (!Number.isInteger(categoryId) || categoryId <= 0)) {
    return badRequest("Book category must be valid");
  }

  try {
    const db = getDb();
    if (categoryId !== null) {
      const [category] = await db
        .select()
        .from(bookCategories)
        .where(eq(bookCategories.id, categoryId));
      if (!category) return notFound("Book category not found");
    }

    const [book] = await db
      .insert(books)
      .values({ title, author, yearPublished, categoryId })
      .returning();
    return NextResponse.json(book, { status: 201 });
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
