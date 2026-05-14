import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { PUBLIC_CACHE, serverError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { astroQuizQuestions, astroQuizzes } from "@/lib/schema";

export async function GET() {
  try {
    const db = getDb();
    const [quizzes, questions] = await Promise.all([
      db
        .select()
        .from(astroQuizzes)
        .where(eq(astroQuizzes.published, true))
        .orderBy(asc(astroQuizzes.position), asc(astroQuizzes.createdAt)),
      db.select().from(astroQuizQuestions),
    ]);

    const counts = new Map<number, number>();
    for (const question of questions) {
      counts.set(question.quizId, (counts.get(question.quizId) ?? 0) + 1);
    }

    const res = NextResponse.json(
      quizzes.map((quiz) => ({
        ...quiz,
        questionCount: counts.get(quiz.id) ?? 0,
      }))
    );
    res.headers.set("Cache-Control", PUBLIC_CACHE);
    return res;
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
