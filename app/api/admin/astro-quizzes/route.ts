import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { badRequest } from "@/lib/api";
import { normalizeQuizInput } from "@/lib/astro-quiz";
import { getDb } from "@/lib/db";
import { astroQuizOptions, astroQuizQuestions, astroQuizzes } from "@/lib/schema";
import { withAuth } from "@/lib/with-auth";

async function readFullQuizzes() {
  const db = getDb();
  const [quizzes, questions, options] = await Promise.all([
    db.select().from(astroQuizzes).orderBy(asc(astroQuizzes.position), asc(astroQuizzes.createdAt)),
    db.select().from(astroQuizQuestions).orderBy(asc(astroQuizQuestions.position), asc(astroQuizQuestions.id)),
    db.select().from(astroQuizOptions).orderBy(asc(astroQuizOptions.position), asc(astroQuizOptions.id)),
  ]);

  const optionsByQuestion = new Map<number, typeof options>();
  for (const option of options) {
    const current = optionsByQuestion.get(option.questionId) ?? [];
    current.push(option);
    optionsByQuestion.set(option.questionId, current);
  }

  const questionsByQuiz = new Map<number, Array<(typeof questions)[number] & { options: typeof options }>>();
  for (const question of questions) {
    const current = questionsByQuiz.get(question.quizId) ?? [];
    current.push({ ...question, options: optionsByQuestion.get(question.id) ?? [] });
    questionsByQuiz.set(question.quizId, current);
  }

  return quizzes.map((quiz) => ({
    ...quiz,
    questions: questionsByQuiz.get(quiz.id) ?? [],
  }));
}

export const GET = withAuth(async () => {
  return NextResponse.json(await readFullQuizzes());
});

export const POST = withAuth(async (req: NextRequest) => {
  const parsed = normalizeQuizInput(await req.json().catch(() => ({})));
  if (parsed.error || !parsed.value) return badRequest(parsed.error ?? "Invalid quiz payload");

  const db = getDb();
  const quizInput = parsed.value;
  const [quiz] = await db
    .insert(astroQuizzes)
    .values({
      title: quizInput.title,
      description: quizInput.description ?? "",
      resultHeadline: quizInput.resultHeadline ?? "",
      resultSummary: quizInput.resultSummary ?? "",
      imageUrl: quizInput.imageUrl,
      sessionId: quizInput.sessionId,
      published: quizInput.published ?? false,
      position: quizInput.position ?? 99,
    })
    .returning();

  for (const [questionIndex, questionInput] of quizInput.questions.entries()) {
    const [question] = await db
      .insert(astroQuizQuestions)
      .values({
        quizId: quiz.id,
        question: questionInput.question,
        marquee: questionInput.marquee ?? null,
        position: questionIndex,
      })
      .returning();

    await db.insert(astroQuizOptions).values(
      questionInput.options.map((option, optionIndex) => ({
        questionId: question.id,
        label: option.label,
        isCorrect: option.isCorrect,
        position: optionIndex,
      }))
    );
  }

  const [saved] = (await readFullQuizzes()).filter((item) => item.id === quiz.id);
  return NextResponse.json(saved, { status: 201 });
});
