import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { badRequest, notFound, PUBLIC_CACHE, serverError } from "@/lib/api";
import { sanitizeQuestion } from "@/lib/astro-quiz";
import { getDb } from "@/lib/db";
import { astroQuizOptions, astroQuizQuestions, astroQuizzes } from "@/lib/schema";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const quizId = Number(id);
  if (!Number.isInteger(quizId) || quizId <= 0) return badRequest("Invalid quiz id");

  try {
    const db = getDb();
    const [quiz] = await db
      .select()
      .from(astroQuizzes)
      .where(eq(astroQuizzes.id, quizId))
      .limit(1);

    if (!quiz || !quiz.published) return notFound("Quiz not found");

    const questions = await db
      .select()
      .from(astroQuizQuestions)
      .where(eq(astroQuizQuestions.quizId, quizId))
      .orderBy(asc(astroQuizQuestions.position), asc(astroQuizQuestions.id));

    const options = questions.length === 0
      ? []
      : await db
        .select()
        .from(astroQuizOptions)
        .orderBy(asc(astroQuizOptions.position), asc(astroQuizOptions.id));

    const questionIds = new Set(questions.map((question) => question.id));
    const optionsByQuestion = new Map<number, typeof options>();
    for (const option of options) {
      if (!questionIds.has(option.questionId)) continue;
      const current = optionsByQuestion.get(option.questionId) ?? [];
      current.push(option);
      optionsByQuestion.set(option.questionId, current);
    }

    const res = NextResponse.json({
      ...quiz,
      questions: questions.map((question) => sanitizeQuestion(question, optionsByQuestion.get(question.id) ?? [])),
    });
    res.headers.set("Cache-Control", PUBLIC_CACHE);
    return res;
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
