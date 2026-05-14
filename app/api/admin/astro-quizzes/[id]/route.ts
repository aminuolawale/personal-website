import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { badRequest, notFound } from "@/lib/api";
import { normalizeQuizInput } from "@/lib/astro-quiz";
import { getDb } from "@/lib/db";
import { astroQuizOptions, astroQuizQuestions, astroQuizzes } from "@/lib/schema";
import { withAuth } from "@/lib/with-auth";

type Params = { params: Promise<{ id: string }> };

async function deleteQuizChildren(quizId: number) {
  const db = getDb();
  const questions = await db
    .select()
    .from(astroQuizQuestions)
    .where(eq(astroQuizQuestions.quizId, quizId));

  const questionIds = questions.map((question) => question.id);
  if (questionIds.length > 0) {
    await db.delete(astroQuizOptions).where(inArray(astroQuizOptions.questionId, questionIds));
  }
  await db.delete(astroQuizQuestions).where(eq(astroQuizQuestions.quizId, quizId));
}

export const PATCH = withAuth(async (req: NextRequest, { params }: Params) => {
  const { id } = await params;
  const quizId = Number(id);
  if (!Number.isInteger(quizId) || quizId <= 0) return badRequest("Invalid quiz id");

  const parsed = normalizeQuizInput(await req.json().catch(() => ({})));
  if (parsed.error || !parsed.value) return badRequest(parsed.error ?? "Invalid quiz payload");

  const db = getDb();
  const quizInput = parsed.value;
  const [quiz] = await db
    .update(astroQuizzes)
    .set({
      title: quizInput.title,
      description: quizInput.description ?? "",
      imageUrl: quizInput.imageUrl,
      sessionId: quizInput.sessionId,
      published: quizInput.published ?? false,
      position: quizInput.position ?? 99,
      updatedAt: new Date(),
    })
    .where(eq(astroQuizzes.id, quizId))
    .returning();

  if (!quiz) return notFound("Quiz not found");

  await deleteQuizChildren(quizId);

  for (const [questionIndex, questionInput] of quizInput.questions.entries()) {
    const [question] = await db
      .insert(astroQuizQuestions)
      .values({
        quizId,
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

  return NextResponse.json({ ok: true });
});

export const DELETE = withAuth(async (_req: NextRequest, { params }: Params) => {
  const { id } = await params;
  const quizId = Number(id);
  if (!Number.isInteger(quizId) || quizId <= 0) return badRequest("Invalid quiz id");

  const db = getDb();
  await deleteQuizChildren(quizId);
  const [deleted] = await db
    .delete(astroQuizzes)
    .where(eq(astroQuizzes.id, quizId))
    .returning();

  if (!deleted) return notFound("Quiz not found");
  return NextResponse.json({ ok: true });
});
