// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ getReaderSession: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/reader-profiles", () => ({ ensureReaderProfile: vi.fn().mockResolvedValue(undefined) }));

import { POST } from "@/app/api/astro-quizzes/[id]/attempts/route";
import { getReaderSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

const params = (id: string) => Promise.resolve({ id });

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(new URL("http://localhost:3000/api/astro-quizzes/1/attempts"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockQuizDb(assertValues?: (values: Record<string, unknown>) => void) {
  const quiz = {
    id: 1,
    title: "Sky quiz",
    published: true,
  };
  const questions = [
    { id: 10, quizId: 1, question: "First", marquee: null, position: 0, createdAt: new Date(), updatedAt: new Date() },
    { id: 11, quizId: 1, question: "Second", marquee: null, position: 1, createdAt: new Date(), updatedAt: new Date() },
  ];
  const options = [
    { id: 100, questionId: 10, label: "Wrong", isCorrect: false, position: 0 },
    { id: 101, questionId: 10, label: "Right", isCorrect: true, position: 1 },
    { id: 102, questionId: 11, label: "Right", isCorrect: true, position: 0 },
    { id: 103, questionId: 11, label: "Wrong", isCorrect: false, position: 1 },
  ];
  let selectCall = 0;

  vi.mocked(getDb).mockReturnValue({
    select: () => ({
      from: () => {
        selectCall += 1;
        if (selectCall === 1) return { where: () => ({ limit: async () => [quiz] }) };
        if (selectCall === 2) return { where: () => ({ orderBy: async () => questions }) };
        return { orderBy: async () => options };
      },
    }),
    insert: () => ({
      values: (values: Record<string, unknown>) => {
        assertValues?.(values);
        return { returning: async () => [{ id: 44, ...values }] };
      },
    }),
  } as any);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/astro-quizzes/[id]/attempts", () => {
  it("requires an authenticated reader", async () => {
    vi.mocked(getReaderSession).mockResolvedValue(null);
    const res = await POST(makeRequest({ answers: {} }), { params: params("1") });
    expect(res.status).toBe(401);
  });

  it("scores and stores partial submissions", async () => {
    vi.mocked(getReaderSession).mockResolvedValue({ email: "reader@test.com", name: "Reader", image: null });
    mockQuizDb((values) => {
      expect(values.readerEmail).toBe("reader@test.com");
      expect(values.score).toBe(1);
      expect(values.totalQuestions).toBe(2);
      expect(values.completed).toBe(false);
      expect(values.answers).toEqual({ "10": 101 });
    });

    const res = await POST(makeRequest({ answers: { "10": 101 } }), { params: params("1") });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      id: 44,
      score: 1,
      total: 2,
      answered: 1,
      complete: false,
    });
  });

  it("rejects answers that do not belong to the quiz", async () => {
    vi.mocked(getReaderSession).mockResolvedValue({ email: "reader@test.com", name: null, image: null });
    mockQuizDb();

    const res = await POST(makeRequest({ answers: { "10": 999 } }), { params: params("1") });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Answer option does not belong to this quiz" });
  });
});
