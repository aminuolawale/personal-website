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

  it("returns [] when a session's only message falls before fromTime", () => {
    // The session is the most recently active one (its message is the latest ≤ toTime),
    // but the [fromTime, toTime] filter excludes all its turns → empty result.
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

  it("deduplicates messages that share the same id (Gemini writes each message twice)", () => {
    // Gemini appends a second copy of every message after resolving toolCalls.
    // Both copies have identical id, timestamp, and token counts.
    // We must count tokens exactly once per message.
    const duplicate = JSON.stringify({ id: "m1", timestamp: "2026-04-25T10:00:00Z", type: "user", content: [{ text: "Run tests" }] });
    const geminiMsg = JSON.stringify({
      id: "m2",
      timestamp: "2026-04-25T10:01:00Z",
      type: "gemini",
      content: "",
      tokens: { input: 100, output: 80, cached: 20, thoughts: 0, total: 200 },
    });
    const geminiMsgUpdated = JSON.stringify({
      id: "m2",                                  // same id as above — the "updated" copy
      timestamp: "2026-04-25T10:01:00Z",
      type: "gemini",
      content: "I ran the tests",                 // now has text
      tokens: { input: 100, output: 80, cached: 20, thoughts: 0, total: 200 },
    });
    const setLine = JSON.stringify({ $set: { lastUpdated: "2026-04-25T10:01:00Z" } });
    const header = JSON.stringify({ sessionId: "gem-dedup", startTime: "2026-04-25T10:00:00Z", kind: "main" });
    const content = [header, duplicate, geminiMsg, setLine, geminiMsgUpdated].join("\n");

    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(["session.jsonl"]);
    mockReadFileSync.mockReturnValue(content);

    const sessions = readGeminiSessions(WORKING_DIR, FROM, TO);
    expect(sessions).toHaveLength(1);
    // Only one assistant turn despite two copies of m2 in the file.
    const assistantTurns = sessions[0].turns.filter((t) => t.role === "assistant");
    expect(assistantTurns).toHaveLength(1);
    expect(assistantTurns[0].inputTokens).toBe(100);
    expect(assistantTurns[0].outputTokens).toBe(80);
    // Text comes from the deduplicated (last) copy.
    expect(assistantTurns[0].text).toBe("I ran the tests");
  });

  it("ignores $set update-op lines (does not treat them as message turns)", () => {
    const header = JSON.stringify({ sessionId: "gem-set", startTime: "2026-04-25T10:00:00Z", kind: "main" });
    const userMsg = JSON.stringify({ id: "u1", timestamp: "2026-04-25T10:00:00Z", type: "user", content: [{ text: "hello" }] });
    const setLine = JSON.stringify({ $set: { lastUpdated: "2026-04-25T10:00:00Z" } });
    const content = [header, userMsg, setLine].join("\n");

    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(["session.jsonl"]);
    mockReadFileSync.mockReturnValue(content);

    const sessions = readGeminiSessions(WORKING_DIR, FROM, TO);
    expect(sessions).toHaveLength(1);
    // Only the user turn — the $set line is not a turn.
    expect(sessions[0].turns).toHaveLength(1);
    expect(sessions[0].turns[0].role).toBe("user");
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

  // ---- multi-session capture ----

  it("returns all files with in-window activity, not just the most recently active", () => {
    const sessionAContent = makeSessionFile("gem-a", "2026-04-25T09:00:00Z", [
      { type: "user", id: "m1", timestamp: "2026-04-25T09:30:00Z", content: [{ text: "Earlier work" }] },
    ]);
    const sessionBContent = makeSessionFile("gem-b", "2026-04-25T10:00:00Z", [
      { type: "user", id: "m1", timestamp: "2026-04-25T11:00:00Z", content: [{ text: "Later work" }] },
      {
        type: "gemini", id: "m2", timestamp: "2026-04-25T11:01:00Z",
        content: [{ text: "Later response" }],
        tokens: { input: 100, output: 50, cached: 0, total: 150 },
      },
    ]);

    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(["a.jsonl", "b.jsonl"]);
    mockReadFileSync.mockImplementation((filePath: unknown) =>
      String(filePath).includes("/a.") ? sessionAContent : sessionBContent,
    );

    const sessions = readGeminiSessions(WORKING_DIR, FROM, TO);
    expect(sessions).toHaveLength(2);
    const ids = sessions.map((s) => s.sessionId);
    expect(ids).toContain("gem-a");
    expect(ids).toContain("gem-b");
  });

  it("includes only in-window turns from a session that started before fromTime", () => {
    // A developer session that spans the previous commit boundary: started before
    // fromTime but still has messages after it. Only the post-fromTime portion
    // should be attributed to this commit.
    const content = makeSessionFile("gem-cross", "2026-04-25T08:00:00Z", [
      { type: "user", id: "m1", timestamp: "2026-04-25T08:30:00Z", content: [{ text: "Before window" }] },
      { type: "user", id: "m2", timestamp: "2026-04-25T10:00:00Z", content: [{ text: "In window" }] },
      {
        type: "gemini", id: "m3", timestamp: "2026-04-25T10:01:00Z",
        content: [{ text: "In-window response" }],
        tokens: { input: 100, output: 50, cached: 0, total: 150 },
      },
    ]);

    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(["session.jsonl"]);
    mockReadFileSync.mockReturnValue(content);

    const sessions = readGeminiSessions(WORKING_DIR, FROM, TO);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].turns).toHaveLength(2); // "In window" user + gemini response
    expect(sessions[0].turns[0].text).toBe("In window");
  });
});
