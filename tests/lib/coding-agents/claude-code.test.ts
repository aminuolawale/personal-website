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
    expect(userTurn.inputTokens).toBe(10);
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
});
