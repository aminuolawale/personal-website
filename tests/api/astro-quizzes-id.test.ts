// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { GET } from "@/app/api/astro-quizzes/[id]/route";
import { getDb } from "@/lib/db";

const params = (id: string) => Promise.resolve({ id });
const request = new NextRequest(new URL("http://localhost:3000/api/astro-quizzes/1"));

describe("GET /api/astro-quizzes/[id]", () => {
  it("hides correct answers from public quiz payloads", async () => {
    const quiz = {
      id: 1,
      title: "Sky quiz",
      description: "",
      imageUrl: null,
      sessionId: null,
      published: true,
      position: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const questions = [{
      id: 10,
      quizId: 1,
      question: "What is this?",
      marquee: null,
      position: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }];
    const options = [
      { id: 100, questionId: 10, label: "M31", isCorrect: false, position: 0 },
      { id: 101, questionId: 10, label: "M42", isCorrect: true, position: 1 },
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
    } as any);

    const res = await GET(request, { params: params("1") });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.questions[0].options[1]).toEqual({
      id: 101,
      questionId: 10,
      label: "M42",
      position: 1,
    });
    expect(JSON.stringify(body)).not.toContain("isCorrect");
  });

  it("does not return unpublished quizzes", async () => {
    vi.mocked(getDb).mockReturnValue({
      select: () => ({
        from: () => ({ where: () => ({ limit: async () => [{ id: 1, published: false }] }) }),
      }),
    } as any);

    const res = await GET(request, { params: params("1") });
    expect(res.status).toBe(404);
  });
});
