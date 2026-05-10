// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AgentSession } from "@/lib/coding-agents/types";

const { mockReadClaude, mockReadGemini, mockReadCodex } = vi.hoisted(() => ({
  mockReadClaude: vi.fn().mockReturnValue([]),
  mockReadGemini: vi.fn().mockReturnValue([]),
  mockReadCodex: vi.fn().mockReturnValue([]),
}));

vi.mock("@/lib/coding-agents/claude-code", () => ({
  readClaudeCodeSessions: mockReadClaude,
}));

vi.mock("@/lib/coding-agents/gemini", () => ({
  readGeminiSessions: mockReadGemini,
}));

vi.mock("@/lib/coding-agents/codex", () => ({
  readCodexSessions: mockReadCodex,
}));

import { aggregateSessions } from "@/lib/coding-agents";

const WORKING_DIR = "/projects/myapp";
const FROM = new Date("2026-04-25T09:00:00Z");
const TO = new Date("2026-04-25T12:00:00Z");

function makeSession(
  agent: AgentSession["agent"],
  sessionId: string,
  inputTokens: number,
  outputTokens: number,
  cachedTokens = 0,
): AgentSession {
  return {
    sessionId,
    agent,
    startTime: FROM,
    endTime: TO,
    workingDir: WORKING_DIR,
    turns: [
      {
        index: 0,
        role: "user",
        text: "prompt",
        timestamp: FROM,
        inputTokens,
        outputTokens,
        cachedTokens,
      },
    ],
  };
}

describe("aggregateSessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadClaude.mockReturnValue([]);
    mockReadGemini.mockReturnValue([]);
    mockReadCodex.mockReturnValue([]);
  });

  it("returns all-zero totals when no readers return sessions", () => {
    const result = aggregateSessions(WORKING_DIR, FROM, TO);
    expect(result.totalTokens).toBe(0);
    expect(result.sessions).toHaveLength(0);
    expect(result.byAgent).toEqual({});
  });

  it("aggregates sessions from all three agents", () => {
    mockReadClaude.mockReturnValue([makeSession("claude-code", "c1", 100, 50)]);
    mockReadGemini.mockReturnValue([makeSession("gemini", "g1", 200, 80)]);
    mockReadCodex.mockReturnValue([makeSession("codex", "x1", 300, 0)]);

    const result = aggregateSessions(WORKING_DIR, FROM, TO);
    expect(result.sessions).toHaveLength(3);
    expect(result.byAgent["claude-code"]).toBeDefined();
    expect(result.byAgent["gemini"]).toBeDefined();
    expect(result.byAgent["codex"]).toBeDefined();
  });

  it("computes token totals correctly across all agents", () => {
    mockReadClaude.mockReturnValue([makeSession("claude-code", "c1", 100, 50, 10)]);
    mockReadGemini.mockReturnValue([makeSession("gemini", "g1", 200, 80, 20)]);

    const result = aggregateSessions(WORKING_DIR, FROM, TO);
    expect(result.totalInputTokens).toBe(300);
    expect(result.totalOutputTokens).toBe(130);
    expect(result.totalCachedTokens).toBe(30);
    expect(result.totalTokens).toBe(430);
  });

  it("counts sessions per agent correctly", () => {
    mockReadClaude.mockReturnValue([
      makeSession("claude-code", "c1", 100, 50),
      makeSession("claude-code", "c2", 80, 40),
    ]);

    const result = aggregateSessions(WORKING_DIR, FROM, TO);
    expect(result.byAgent["claude-code"]?.sessionCount).toBe(2);
    expect(result.byAgent["claude-code"]?.inputTokens).toBe(180);
    expect(result.byAgent["claude-code"]?.outputTokens).toBe(90);
  });

  it("forwards the commitSha argument to the codex reader", () => {
    aggregateSessions(WORKING_DIR, FROM, TO, "sha123");
    expect(mockReadCodex).toHaveBeenCalledWith(WORKING_DIR, FROM, TO, "sha123");
  });

  it("does not forward commitSha to claude or gemini readers", () => {
    aggregateSessions(WORKING_DIR, FROM, TO, "sha123");
    expect(mockReadClaude).toHaveBeenCalledWith(WORKING_DIR, FROM, TO);
    expect(mockReadGemini).toHaveBeenCalledWith(WORKING_DIR, FROM, TO);
  });
});
