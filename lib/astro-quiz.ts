import type { AstroQuiz, AstroQuizOption, AstroQuizQuestion, QuizMarquee } from "@/lib/schema";

export type QuizQuestionInput = {
  id?: number;
  question: string;
  marquee?: QuizMarquee | null;
  options: Array<{
    id?: number;
    label: string;
    isCorrect: boolean;
  }>;
};

export type QuizInput = {
  title: string;
  description?: string;
  resultHeadline?: string;
  resultSummary?: string;
  imageUrl?: string | null;
  sessionId?: number | null;
  published?: boolean;
  position?: number;
  questions: QuizQuestionInput[];
};

export type PublicQuizQuestion = Omit<AstroQuizQuestion, "createdAt" | "updatedAt"> & {
  options: Array<Omit<AstroQuizOption, "isCorrect">>;
};

export type PublicQuiz = AstroQuiz & {
  questionCount: number;
};

export function isValidMarquee(value: unknown): value is QuizMarquee {
  if (!value || typeof value !== "object") return false;
  const marquee = value as QuizMarquee;
  return [marquee.x, marquee.y, marquee.w, marquee.h].every((n) => Number.isFinite(n)) &&
    marquee.x >= 0 &&
    marquee.y >= 0 &&
    marquee.w > 0 &&
    marquee.h > 0 &&
    marquee.x + marquee.w <= 100 &&
    marquee.y + marquee.h <= 100;
}

export function normalizeQuizInput(input: unknown): { value?: QuizInput; error?: string } {
  if (!input || typeof input !== "object") return { error: "Invalid quiz payload" };
  const data = input as Partial<QuizInput>;
  const title = String(data.title ?? "").trim();
  if (!title) return { error: "Title is required" };

  const questions = Array.isArray(data.questions) ? data.questions : [];
  if (data.published && questions.length === 0) {
    return { error: "A published quiz needs at least one question" };
  }

  const normalizedQuestions: QuizQuestionInput[] = [];
  for (const [questionIndex, question] of questions.entries()) {
    const text = String(question?.question ?? "").trim();
    if (!text) return { error: `Question ${questionIndex + 1} is required` };

    const options = Array.isArray(question.options) ? question.options : [];
    const normalizedOptions = options
      .map((option) => ({
        id: Number.isInteger(option.id) ? option.id : undefined,
        label: String(option.label ?? "").trim(),
        isCorrect: Boolean(option.isCorrect),
      }))
      .filter((option) => option.label.length > 0);

    if (normalizedOptions.length < 2) {
      return { error: `Question ${questionIndex + 1} needs at least two options` };
    }

    if (normalizedOptions.filter((option) => option.isCorrect).length !== 1) {
      return { error: `Question ${questionIndex + 1} needs exactly one correct option` };
    }

    const marquee = question.marquee ?? null;
    if (marquee && !isValidMarquee(marquee)) {
      return { error: `Question ${questionIndex + 1} has an invalid image region` };
    }

    normalizedQuestions.push({
      id: Number.isInteger(question.id) ? question.id : undefined,
      question: text,
      marquee,
      options: normalizedOptions,
    });
  }

  return {
    value: {
      title,
      description: String(data.description ?? "").trim(),
      resultHeadline: String(data.resultHeadline ?? "").trim(),
      resultSummary: String(data.resultSummary ?? "").trim(),
      imageUrl: String(data.imageUrl ?? "").trim() || null,
      sessionId: Number.isInteger(data.sessionId) ? data.sessionId ?? null : null,
      published: Boolean(data.published),
      position: Number.isInteger(data.position) ? data.position ?? 99 : 99,
      questions: normalizedQuestions,
    },
  };
}

export function sanitizeQuestion(
  question: AstroQuizQuestion,
  options: AstroQuizOption[]
): PublicQuizQuestion {
  return {
    id: question.id,
    quizId: question.quizId,
    question: question.question,
    marquee: question.marquee ?? null,
    position: question.position,
    options: options.map((option) => ({
      id: option.id,
      questionId: option.questionId,
      label: option.label,
      position: option.position,
    })),
  };
}

export function normalizeAnswers(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([questionId, optionId]) => [questionId, Number(optionId)] as const)
      .filter(([questionId, optionId]) => /^\d+$/.test(questionId) && Number.isInteger(optionId) && optionId > 0)
  );
}

export function scoreQuiz(
  questions: AstroQuizQuestion[],
  options: AstroQuizOption[],
  answers: Record<string, number>
) {
  const optionById = new Map(options.map((option) => [option.id, option]));
  let score = 0;

  for (const question of questions) {
    const answerId = answers[String(question.id)];
    const selected = answerId ? optionById.get(answerId) : null;
    if (selected?.questionId === question.id && selected.isCorrect) score += 1;
  }

  return {
    score,
    total: questions.length,
    answered: questions.filter((question) => answers[String(question.id)]).length,
    complete: questions.every((question) => Boolean(answers[String(question.id)])),
  };
}
