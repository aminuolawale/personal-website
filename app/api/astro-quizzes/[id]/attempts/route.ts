import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { badRequest, notFound, serverError, unauthorized } from "@/lib/api";
import { normalizeAnswers, scoreQuiz } from "@/lib/astro-quiz";
import { getReaderSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ensureReaderProfile } from "@/lib/reader-profiles";
import { astroQuizAttempts, astroQuizOptions, astroQuizQuestions, astroQuizzes } from "@/lib/schema";

type Params = { params: Promise<{ id: string }> };

const staleQuizResponse = () =>
  NextResponse.json(
    { error: "This quiz changed while you were taking it. Reload the quiz and try again." },
    { status: 409 }
  );

export async function POST(req: NextRequest, { params }: Params) {
  const reader = await getReaderSession();
  if (!reader) return unauthorized();

  const { id } = await params;
  const quizId = Number(id);
  if (!Number.isInteger(quizId) || quizId <= 0) return badRequest("Invalid quiz id");

  try {
    const body = await req.json().catch(() => ({}));
    const answers = normalizeAnswers((body as { answers?: unknown }).answers);

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

    if (questions.length === 0) return badRequest("Quiz has no questions");

    const options = await db
      .select()
      .from(astroQuizOptions)
      .orderBy(asc(astroQuizOptions.position), asc(astroQuizOptions.id));

    const questionIds = new Set(questions.map((question) => question.id));
    const allowedOptionsByQuestion = new Map<number, Set<number>>();
    for (const option of options) {
      if (!questionIds.has(option.questionId)) continue;
      const ids = allowedOptionsByQuestion.get(option.questionId) ?? new Set<number>();
      ids.add(option.id);
      allowedOptionsByQuestion.set(option.questionId, ids);
    }

    for (const [questionIdText, optionId] of Object.entries(answers)) {
      const questionId = Number(questionIdText);
      if (!questionIds.has(questionId)) return staleQuizResponse();
      if (!allowedOptionsByQuestion.get(questionId)?.has(optionId)) {
        return staleQuizResponse();
      }
    }

    const result = scoreQuiz(questions, options, answers);
    const [attempt] = await db
      .insert(astroQuizAttempts)
      .values({
        quizId,
        readerEmail: reader.email,
        readerName: reader.name,
        score: result.score,
        totalQuestions: result.total,
        completed: result.complete,
        answers,
      })
      .returning();

    await ensureReaderProfile(reader);

    return NextResponse.json({
      id: attempt.id,
      score: result.score,
      total: result.total,
      answered: result.answered,
      complete: result.complete,
    }, { status: 201 });
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
