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

import { readClaudeCodeSessions } from "@/lib/coding-agents/claude-code";

const WORKING_DIR = "/projects/myapp";
const FROM = new Date("2026-04-25T09:00:00Z");
const TO = new Date("2026-04-25T12:00:00Z");

function makeMsg(
  type: "user" | "assistant",
  sessionId: string,
  timestamp: string,
  text: string,
  usage?: { input_tokens: number; output_tokens: number },
  opts?: { isSidechain?: boolean; cwd?: string }
) {
  return JSON.stringify({
    type,
    uuid: "u1",
    parentUuid: null,
    isSidechain: opts?.isSidechain ?? false,
    sessionId,
    timestamp,
    cwd: opts?.cwd ?? WORKING_DIR,
    message: {
      role: type,
      content: text,
      usage: usage ?? { input_tokens: 0, output_tokens: 0 },
    },
  });
}

const SIMPLE_JSONL = [
  makeMsg("user", "sess-1", "2026-04-25T10:00:00Z", "Implement dark mode", { input_tokens: 10, output_tokens: 0 }),
  makeMsg("assistant", "sess-1", "2026-04-25T10:01:00Z", "I will implement dark mode for you", { input_tokens: 500, output_tokens: 200 }),
].join("\n");

describe("readClaudeCodeSessions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns [] when project directory does not exist", () => {
    mockExistsSync.mockReturnValue(false);
    expect(readClaudeCodeSessions(WORKING_DIR, FROM, TO)).toEqual([]);
  });

  it("returns [] when there are no .jsonl files", () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([]);
    expect(readClaudeCodeSessions(WORKING_DIR, FROM, TO)).toEqual([]);
  });

  it("parses a session file and returns turns with correct token fields", () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(["session.jsonl"]);
    mockReadFileSync.mockReturnValue(SIMPLE_JSONL);

    const sessions = readClaudeCodeSessions(WORKING_DIR, FROM, TO);
    expect(sessions).toHaveLength(1);
    const session = sessions[0];
    expect(session.agent).toBe("claude-code");
    expect(session.sessionId).toBe("sess-1");
    expect(session.turns).toHaveLength(2);

    const userTurn = session.turns[0];
    expect(userTurn.role).toBe("user");
    expect(userTurn.text).toBe("Implement dark mode");
    // User messages in real Claude Code JSONL carry usage={} — tokens are always 0.
    expect(userTurn.inputTokens).toBe(0);
    expect(userTurn.outputTokens).toBe(0);

    const assistantTurn = session.turns[1];
    expect(assistantTurn.role).toBe("assistant");
    expect(assistantTurn.outputTokens).toBe(200);
  });

  it("excludes messages outside the time window", () => {
    const before = makeMsg("user", "sess-2", "2026-04-25T08:59:00Z", "Old message");
    const after = makeMsg("user", "sess-2", "2026-04-25T13:00:00Z", "Future message");
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(["session.jsonl"]);
    mockReadFileSync.mockReturnValue([before, after].join("\n"));

    const sessions = readClaudeCodeSessions(WORKING_DIR, FROM, TO);
    expect(sessions).toHaveLength(0);
  });

  it("excludes messages from a different working directory", () => {
    const wrongCwd = makeMsg("user", "sess-3", "2026-04-25T10:00:00Z", "Other project", undefined, {
      cwd: "/projects/other",
    });
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(["session.jsonl"]);
    mockReadFileSync.mockReturnValue(wrongCwd);

    const sessions = readClaudeCodeSessions(WORKING_DIR, FROM, TO);
    expect(sessions).toHaveLength(0);
  });

  it("skips sidechain messages to keep only the main conversation thread", () => {
    const main = makeMsg("user", "sess-4", "2026-04-25T10:00:00Z", "Main turn");
    const sidechain = makeMsg("user", "sess-4", "2026-04-25T10:00:30Z", "Sidechain turn", undefined, {
      isSidechain: true,
    });
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(["session.jsonl"]);
    mockReadFileSync.mockReturnValue([main, sidechain].join("\n"));

    const sessions = readClaudeCodeSessions(WORKING_DIR, FROM, TO);
    expect(sessions[0].turns).toHaveLength(1);
    expect(sessions[0].turns[0].text).toBe("Main turn");
  });

  it("accumulates cache tokens from both cache_read and cache_creation fields", () => {
    const msgWithCache = JSON.stringify({
      type: "assistant",
      uuid: "u2",
      parentUuid: null,
      isSidechain: false,
      sessionId: "sess-5",
      timestamp: "2026-04-25T10:01:00Z",
      cwd: WORKING_DIR,
      message: {
        role: "assistant",
        content: "Response with cache",
        usage: {
          input_tokens: 100,
          output_tokens: 50,
          cache_read_input_tokens: 200,
          cache_creation_input_tokens: 300,
        },
      },
    });
    const userMsg = makeMsg("user", "sess-5", "2026-04-25T10:00:00Z", "hello");
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(["session.jsonl"]);
    mockReadFileSync.mockReturnValue([userMsg, msgWithCache].join("\n"));

    const sessions = readClaudeCodeSessions(WORKING_DIR, FROM, TO);
    const assistantTurn = sessions[0].turns.find((t) => t.role === "assistant")!;
    expect(assistantTurn.cachedTokens).toBe(500); // 200 + 300
  });

  it("handles parse errors gracefully (returns empty array)", () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(["broken.jsonl"]);
    mockReadFileSync.mockImplementation(() => { throw new Error("read error"); });

    expect(readClaudeCodeSessions(WORKING_DIR, FROM, TO)).toEqual([]);
  });

  it("counts tokens from tool-only API calls (no text content)", () => {
    // A realistic Claude Code session: first API call produces text, second
    // is a pure tool_use with no text. Before this fix, the tool-only call's
    // tokens were silently dropped.
    const userMsg = makeMsg("user", "sess-tool", "2026-04-25T10:00:00Z", "Add tests");
    // API call 1: thinking (same usage) + text (same usage) — grouped, text adopted
    const thinking1 = JSON.stringify({
      type: "assistant", uuid: "a1", parentUuid: null, isSidechain: false,
      sessionId: "sess-tool", timestamp: "2026-04-25T10:00:02Z",
      cwd: WORKING_DIR,
      message: { role: "assistant", content: [], usage: { input_tokens: 5, output_tokens: 150, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } },
    });
    const text1 = JSON.stringify({
      type: "assistant", uuid: "a2", parentUuid: "a1", isSidechain: false,
      sessionId: "sess-tool", timestamp: "2026-04-25T10:00:03Z",
      cwd: WORKING_DIR,
      message: { role: "assistant", content: "Let me look at the code", usage: { input_tokens: 5, output_tokens: 150, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } },
    });
    // Simulated tool_result user message (empty text — skipped)
    const toolResult = makeMsg("user", "sess-tool", "2026-04-25T10:00:05Z", "");
    // API call 2: pure tool_use, no text — different usage key, should be counted
    const toolOnly = JSON.stringify({
      type: "assistant", uuid: "a3", parentUuid: null, isSidechain: false,
      sessionId: "sess-tool", timestamp: "2026-04-25T10:00:07Z",
      cwd: WORKING_DIR,
      message: { role: "assistant", content: [], usage: { input_tokens: 2, output_tokens: 60, cache_read_input_tokens: 200, cache_creation_input_tokens: 100 } },
    });

    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(["session.jsonl"]);
    mockReadFileSync.mockReturnValue([userMsg, thinking1, text1, toolResult, toolOnly].join("\n"));

    const sessions = readClaudeCodeSessions(WORKING_DIR, FROM, TO);
    expect(sessions).toHaveLength(1);

    const turns = sessions[0].turns;
    // user(0) + assistant-group-1(1, text='Let me look...') + assistant-group-2(2, no text)
    expect(turns).toHaveLength(3);

    const group1 = turns[1];
    expect(group1.role).toBe("assistant");
    expect(group1.text).toBe("Let me look at the code");
    expect(group1.outputTokens).toBe(150);

    const group2 = turns[2];
    expect(group2.role).toBe("assistant");
    expect(group2.text).toBe("");        // no text in this API call
    expect(group2.outputTokens).toBe(60); // tokens ARE captured
    expect(group2.cachedTokens).toBe(300); // 200 + 100
  });

  it("deduplicates thinking+text+tool_use from the same API call into one turn", () => {
    // Claude Code emits thinking / text / tool_use as separate messages, all with
    // IDENTICAL usage. Only one turn should be created and tokens counted once.
    const sharedUsage = { input_tokens: 3, output_tokens: 170, cache_read_input_tokens: 12000, cache_creation_input_tokens: 8000 };
    const userMsg = makeMsg("user", "sess-dedup", "2026-04-25T10:00:00Z", "Disable theme rotation");
    const thinkingMsg = JSON.stringify({
      type: "assistant", uuid: "b1", parentUuid: null, isSidechain: false,
      sessionId: "sess-dedup", timestamp: "2026-04-25T10:00:02Z", cwd: WORKING_DIR,
      message: { role: "assistant", content: [], usage: sharedUsage },
    });
    const textMsg = JSON.stringify({
      type: "assistant", uuid: "b2", parentUuid: "b1", isSidechain: false,
      sessionId: "sess-dedup", timestamp: "2026-04-25T10:00:03Z", cwd: WORKING_DIR,
      message: { role: "assistant", content: "Let me find the rotation code", usage: sharedUsage },
    });
    const toolMsg = JSON.stringify({
      type: "assistant", uuid: "b3", parentUuid: "b2", isSidechain: false,
      sessionId: "sess-dedup", timestamp: "2026-04-25T10:00:04Z", cwd: WORKING_DIR,
      message: { role: "assistant", content: [], usage: sharedUsage },
    });

    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(["session.jsonl"]);
    mockReadFileSync.mockReturnValue([userMsg, thinkingMsg, textMsg, toolMsg].join("\n"));

    const sessions = readClaudeCodeSessions(WORKING_DIR, FROM, TO);
    const turns = sessions[0].turns;

    // user(0) + ONE assistant turn (not three)
    expect(turns).toHaveLength(2);
    expect(turns[1].outputTokens).toBe(170);    // counted once
    expect(turns[1].text).toBe("Let me find the rotation code"); // text from text message
    expect(turns[1].cachedTokens).toBe(20000);  // 12000 + 8000
  });

  // ---- multi-session capture ----

  it("returns all sessions with in-window activity across multiple files", () => {
    const sessionAContent = [
      makeMsg("user", "sess-a", "2026-04-25T09:30:00Z", "Earlier work"),
    ].join("\n");
    const sessionBContent = [
      makeMsg("user", "sess-b", "2026-04-25T11:00:00Z", "Later work"),
      makeMsg("assistant", "sess-b", "2026-04-25T11:01:00Z", "Later response", { input_tokens: 200, output_tokens: 100 }),
    ].join("\n");

    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(["a.jsonl", "b.jsonl"]);
    mockReadFileSync.mockImplementation((filePath: unknown) =>
      String(filePath).includes("/a.") ? sessionAContent : sessionBContent,
    );

    const sessions = readClaudeCodeSessions(WORKING_DIR, FROM, TO);
    expect(sessions).toHaveLength(2);
    const ids = sessions.map((s) => s.sessionId);
    expect(ids).toContain("sess-a");
    expect(ids).toContain("sess-b");
  });

  it("returns all in-window sessions when a file contains multiple session IDs", () => {
    const msgA = makeMsg("user", "sess-old", "2026-04-25T09:30:00Z", "Old session message");
    const msgBUser = makeMsg("user", "sess-new", "2026-04-25T11:00:00Z", "New session message");
    const msgBAsst = makeMsg("assistant", "sess-new", "2026-04-25T11:01:00Z", "New response", { input_tokens: 100, output_tokens: 50 });

    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(["session.jsonl"]);
    mockReadFileSync.mockReturnValue([msgA, msgBUser, msgBAsst].join("\n"));

    const sessions = readClaudeCodeSessions(WORKING_DIR, FROM, TO);
    expect(sessions).toHaveLength(2);
    const ids = sessions.map((s) => s.sessionId);
    expect(ids).toContain("sess-old");
    expect(ids).toContain("sess-new");
  });

  it("returns [] when all messages across all files are after toTime", () => {
    const futureMsg = makeMsg("user", "future-sess", "2026-04-26T10:00:00Z", "Future message");
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(["session.jsonl"]);
    mockReadFileSync.mockReturnValue(futureMsg);

    expect(readClaudeCodeSessions(WORKING_DIR, FROM, TO)).toHaveLength(0);
  });
});
