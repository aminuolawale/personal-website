// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockExistsSync, mockReaddirSync, mockReadFileSync } = vi.hoisted(() => ({
  mockExistsSync: vi.fn(),
  mockReaddirSync: vi.fn(),
  mockReadFileSync: vi.fn(),
}));

vi.mock("os", () => ({
  default: { homedir: () => "/home/user" },
  homedir: () => "/home/user",
}));

vi.mock("fs", () => ({
  default: {
    existsSync: mockExistsSync,
    readdirSync: mockReaddirSync,
    readFileSync: mockReadFileSync,
  },
  existsSync: mockExistsSync,
  readdirSync: mockReaddirSync,
  readFileSync: mockReadFileSync,
}));

import { readGeminiSessions } from "@/lib/coding-agents/gemini";

const WORKING_DIR = "/projects/myapp";
const FROM = new Date("2026-04-25T09:00:00Z");
const TO = new Date("2026-04-25T12:00:00Z");

function makeSessionFile(sessionId: string, startTime: string, messages: object[]) {
  const header = { sessionId, startTime, kind: "main" };
  return [header, ...messages].map((l) => JSON.stringify(l)).join("\n");
}

describe("readGeminiSessions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns [] when chats directory does not exist", () => {
    mockExistsSync.mockReturnValue(false);
    expect(readGeminiSessions(WORKING_DIR, FROM, TO)).toEqual([]);
  });

  it("returns [] when there are no .jsonl files", () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([]);
    expect(readGeminiSessions(WORKING_DIR, FROM, TO)).toEqual([]);
  });

  it("parses a session and returns user and assistant turns", () => {
    const content = makeSessionFile("gem-1", "2026-04-25T10:00:00Z", [
      {
        type: "user",
        id: "m1",
        timestamp: "2026-04-25T10:00:00Z",
        content: [{ text: "Add dark mode" }],
      },
      {
        type: "gemini",
        id: "m2",
        timestamp: "2026-04-25T10:01:00Z",
        content: [{ text: "I will add dark mode" }],
        tokens: { input: 100, output: 80, cached: 20, total: 200 },
      },
    ]);
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(["session.jsonl"]);
    mockReadFileSync.mockReturnValue(content);

    const sessions = readGeminiSessions(WORKING_DIR, FROM, TO);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].agent).toBe("gemini");
    expect(sessions[0].sessionId).toBe("gem-1");

    const [userTurn, asstTurn] = sessions[0].turns;
    expect(userTurn.role).toBe("user");
    expect(userTurn.text).toBe("Add dark mode");

    expect(asstTurn.role).toBe("assistant");
    expect(asstTurn.inputTokens).toBe(100);
    expect(asstTurn.outputTokens).toBe(80);
    expect(asstTurn.cachedTokens).toBe(20);
  });

  it("adds thoughts tokens to outputTokens", () => {
    const content = makeSessionFile("gem-2", "2026-04-25T10:00:00Z", [
      {
        type: "gemini",
        id: "m1",
        timestamp: "2026-04-25T10:01:00Z",
        content: [{ text: "Thinking response" }],
        tokens: { input: 50, output: 100, cached: 0, thoughts: 200, total: 350 },
      },
    ]);
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(["session.jsonl"]);
    mockReadFileSync.mockReturnValue(content);

    const sessions = readGeminiSessions(WORKING_DIR, FROM, TO);
    expect(sessions[0].turns[0].outputTokens).toBe(300); // 100 output + 200 thoughts
  });

  it("excludes sessions whose header startTime is outside the window", () => {
    const content = makeSessionFile("gem-3", "2026-04-24T08:00:00Z", [
      {
        type: "user",
        id: "m1",
        timestamp: "2026-04-24T08:00:00Z",
        content: [{ text: "Old session" }],
      },
    ]);
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(["old.jsonl"]);
    mockReadFileSync.mockReturnValue(content);

    expect(readGeminiSessions(WORKING_DIR, FROM, TO)).toHaveLength(0);
  });

  it("skips session lines without a timestamp", () => {
    const content = makeSessionFile("gem-4", "2026-04-25T10:00:00Z", [
      { type: "user", id: "m1", content: [{ text: "No timestamp" }] },
    ]);
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(["session.jsonl"]);
    mockReadFileSync.mockReturnValue(content);

    // Session has no valid turns → should be excluded
    expect(readGeminiSessions(WORKING_DIR, FROM, TO)).toHaveLength(0);
  });

  it("handles string content as well as array content", () => {
    const content = makeSessionFile("gem-5", "2026-04-25T10:00:00Z", [
      {
        type: "user",
        id: "m1",
        timestamp: "2026-04-25T10:00:00Z",
        content: "Plain string content",
      },
    ]);
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(["session.jsonl"]);
    mockReadFileSync.mockReturnValue(content);

    const sessions = readGeminiSessions(WORKING_DIR, FROM, TO);
    expect(sessions[0].turns[0].text).toBe("Plain string content");
  });
});
