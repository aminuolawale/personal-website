import { describe, expect, it } from "vitest";
import { normalizeAnswers, normalizeQuizInput, sanitizeQuestion, scoreQuiz } from "@/lib/astro-quiz";
import type { AstroQuizOption, AstroQuizQuestion } from "@/lib/schema";

const question = {
  id: 10,
  quizId: 1,
  question: "What is marked?",
  marquee: { x: 10, y: 20, w: 30, h: 15 },
  position: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
} satisfies AstroQuizQuestion;

const options = [
  { id: 1, questionId: 10, label: "M31", isCorrect: false, position: 0 },
  { id: 2, questionId: 10, label: "M42", isCorrect: true, position: 1 },
] satisfies AstroQuizOption[];

describe("astro quiz helpers", () => {
  it("normalizes a valid quiz payload", () => {
    const result = normalizeQuizInput({
      title: "  Sky quiz  ",
      description: " Identify targets ",
      resultHeadline: "  Nice work  ",
      resultSummary: " You finished the quiz. ",
      imageUrl: "",
      published: true,
      questions: [{
        question: "  What target is this? ",
        marquee: { x: 0, y: 0, w: 50, h: 50 },
        options: [
          { label: "Orion", isCorrect: true },
          { label: "Lyra", isCorrect: false },
        ],
      }],
    });

    expect(result.error).toBeUndefined();
    expect(result.value?.title).toBe("Sky quiz");
    expect(result.value?.resultHeadline).toBe("Nice work");
    expect(result.value?.resultSummary).toBe("You finished the quiz.");
    expect(result.value?.imageUrl).toBeNull();
    expect(result.value?.questions[0].question).toBe("What target is this?");
  });

  it("rejects published quizzes without questions", () => {
    const result = normalizeQuizInput({ title: "Empty", published: true, questions: [] });
    expect(result.error).toBe("A published quiz needs at least one question");
  });

  it("requires exactly one correct option per question", () => {
    const result = normalizeQuizInput({
      title: "Bad options",
      questions: [{
        question: "Pick one",
        options: [
          { label: "A", isCorrect: true },
          { label: "B", isCorrect: true },
        ],
      }],
    });

    expect(result.error).toBe("Question 1 needs exactly one correct option");
  });

  it("rejects invalid marquee bounds", () => {
    const result = normalizeQuizInput({
      title: "Bad region",
      questions: [{
        question: "Pick one",
        marquee: { x: 90, y: 0, w: 20, h: 20 },
        options: [
          { label: "A", isCorrect: true },
          { label: "B", isCorrect: false },
        ],
      }],
    });

    expect(result.error).toBe("Question 1 has an invalid image region");
  });

  it("removes correct answers from public questions", () => {
    const sanitized = sanitizeQuestion(question, options);
    expect(sanitized.options).toEqual([
      { id: 1, questionId: 10, label: "M31", position: 0 },
      { id: 2, questionId: 10, label: "M42", position: 1 },
    ]);
  });

  it("scores complete and partial attempts", () => {
    expect(scoreQuiz([question], options, { "10": 2 })).toEqual({
      score: 1,
      total: 1,
      answered: 1,
      complete: true,
    });

    expect(scoreQuiz([question], options, {})).toEqual({
      score: 0,
      total: 1,
      answered: 0,
      complete: false,
    });
  });

  it("normalizes answer maps and drops invalid entries", () => {
    expect(normalizeAnswers({ "10": "2", nope: 2, "11": -1 })).toEqual({ "10": 2 });
  });
});
