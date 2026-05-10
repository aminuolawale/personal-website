// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockExecSync, mockAggregate, mockScoreSpecificity, mockComputeOCS } = vi.hoisted(() => ({
  mockExecSync: vi.fn(),
  mockAggregate: vi.fn(),
  mockScoreSpecificity: vi.fn(),
  mockComputeOCS: vi.fn(),
}));

vi.mock("child_process", () => ({
  execSync: mockExecSync,
}));

vi.mock("@/lib/coding-agents", () => ({
  aggregateSessions: mockAggregate,
}));

vi.mock("@/lib/specificity-scorer", () => ({
  scoreSpecificity: mockScoreSpecificity,
}));

vi.mock("@/lib/ocs-calculator", () => ({
  computeOCS: mockComputeOCS,
}));

import { computeCommitMetrics } from "@/lib/commit-metrics";

const SHA = "abc123";
const PREV = "def456";
const WORKING_DIR = "/projects/myapp";

const MOCK_SPECIFICITY = {
  total: 75,
  components: { informationDensity: 35, coherence: 20, languageQuality: 20 },
  penalties: {
    typos: { count: 0, deduction: 0 },
    incorrectUsage: { count: 0, deduction: 0 },
    grammarQuality: { severity: "none", deduction: 0 },
  },
  explanation: "Solid prompt.",
};

function makeEmptyAggregate() {
  return {
    sessions: [],
    byAgent: {},
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCachedTokens: 0,
    totalTokens: 0,
  };
}

function makeAggregateWithSession() {
  const from = new Date("2026-04-25T10:00:00Z");
  const to = new Date("2026-04-25T11:00:00Z");
  return {
    sessions: [
      {
        sessionId: "s1",
        agent: "claude-code",
        startTime: from,
        endTime: to,
        workingDir: WORKING_DIR,
        turns: [
          {
            index: 0,
            role: "user",
            text: "Implement dark mode for the settings page and ensure it persists in localStorage",
            timestamp: from,
            inputTokens: 0,
            outputTokens: 0,
            cachedTokens: 0,
          },
          {
            index: 1,
            role: "assistant",
            text: "Here's my plan:\n## Phase 1\nI will update the theme context\n## Phase 2\nI will wire the toggle to localStorage",
            timestamp: new Date(from.getTime() + 60000),
            inputTokens: 500,
            outputTokens: 300,
            cachedTokens: 100,
          },
        ],
      },
    ],
    byAgent: { "claude-code": { inputTokens: 500, outputTokens: 300, cachedTokens: 100, totalTokens: 800, sessionCount: 1 } },
    totalInputTokens: 500,
    totalOutputTokens: 300,
    totalCachedTokens: 100,
    totalTokens: 800,
  };
}

function setupExecSync(locOutput = "10\t5\tsrc/theme.ts\n3\t1\tsrc/toggle.tsx\n") {
  mockExecSync
    .mockReturnValueOnce("2026-04-25T11:00:00+00:00\n")  // getCommitTime sha
    .mockReturnValueOnce("2026-04-25T10:00:00+00:00\n")  // getCommitTime prevSha
    .mockReturnValueOnce(locOutput);                      // getLoc
}

describe("computeCommitMetrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAggregate.mockReturnValue(makeEmptyAggregate());
    mockScoreSpecificity.mockResolvedValue(MOCK_SPECIFICITY);
    mockComputeOCS.mockReturnValue(80);
  });

  it("returns metrics with correct LOC values", async () => {
    setupExecSync();
    const metrics = await computeCommitMetrics({ sha: SHA, prevSha: PREV, workingDir: WORKING_DIR, repoPath: WORKING_DIR });
    expect(metrics.loc.additions).toBe(13);
    expect(metrics.loc.deletions).toBe(6);
    expect(metrics.loc.filesChanged).toBe(2);
  });

  it("returns zero LOC values when git diff command fails", async () => {
    mockExecSync
      .mockReturnValueOnce("2026-04-25T11:00:00+00:00\n")
      .mockReturnValueOnce("2026-04-25T10:00:00+00:00\n")
      .mockImplementationOnce(() => { throw new Error("git error"); });

    const metrics = await computeCommitMetrics({ sha: SHA, prevSha: PREV, workingDir: WORKING_DIR, repoPath: WORKING_DIR });
    expect(metrics.loc.additions).toBe(0);
    expect(metrics.loc.deletions).toBe(0);
    expect(metrics.loc.net).toBe(0);
  });

  it("returns null conversation when there are no sessions", async () => {
    setupExecSync();
    const metrics = await computeCommitMetrics({ sha: SHA, prevSha: PREV, workingDir: WORKING_DIR, repoPath: WORKING_DIR });
    expect(metrics.conversation).toBeNull();
    expect(metrics.conversationScore).toBeNull();
    expect(metrics.scores.ocs).toBe(0);
    expect(mockScoreSpecificity).not.toHaveBeenCalled();
  });

  it("scores the conversation and computes OCS when sessions exist", async () => {
    setupExecSync();
    mockAggregate.mockReturnValue(makeAggregateWithSession());
    const metrics = await computeCommitMetrics({ sha: SHA, prevSha: PREV, workingDir: WORKING_DIR, repoPath: WORKING_DIR });

    expect(mockScoreSpecificity).toHaveBeenCalledTimes(1);
    expect(mockComputeOCS).toHaveBeenCalledTimes(1);
    expect(metrics.conversation).not.toBeNull();
    expect(metrics.conversationScore).not.toBeNull();
    expect(metrics.conversationScore?.specificity.total).toBe(75);
    expect(metrics.scores.ocs).toBe(80);
  });

  it("identifies a CL design from an early assistant turn with enough output tokens", async () => {
    setupExecSync();
    mockAggregate.mockReturnValue(makeAggregateWithSession());
    const metrics = await computeCommitMetrics({ sha: SHA, prevSha: PREV, workingDir: WORKING_DIR, repoPath: WORKING_DIR });

    expect(metrics.clDesign).not.toBeNull();
    expect(metrics.clDesign?.isPlanMode).toBe(true); // has markdown headings
    expect(metrics.clDesign?.outputTokens).toBe(300);
  });

  it("populates tokenMetrics correctly from aggregated sessions", async () => {
    setupExecSync();
    mockAggregate.mockReturnValue(makeAggregateWithSession());
    const metrics = await computeCommitMetrics({ sha: SHA, prevSha: PREV, workingDir: WORKING_DIR, repoPath: WORKING_DIR });

    expect(metrics.tokenMetrics.totalTokens).toBe(800);
    expect(metrics.tokenMetrics.outputTokens).toBe(300);
    expect(metrics.tokenMetrics.inputTokens).toBe(500);
    expect(metrics.tokenMetrics.byAgent["claude-code"]).toBeDefined();
  });

  it("includes capturedAt as an ISO date string", async () => {
    setupExecSync();
    const metrics = await computeCommitMetrics({ sha: SHA, prevSha: PREV, workingDir: WORKING_DIR, repoPath: WORKING_DIR });
    expect(() => new Date(metrics.capturedAt)).not.toThrow();
    expect(metrics.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
