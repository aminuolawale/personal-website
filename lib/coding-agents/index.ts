import { readClaudeCodeSessions } from "./claude-code";
import { readGeminiSessions } from "./gemini";
import { readCodexSessions } from "./codex";
import type { AgentSession, AgentTokenSummary, AgentName } from "./types";

export type { AgentSession, AgentTokenSummary, AgentName };
export type { SessionTurn, PromptEntry, SpecificityScore, ChangelistDesign, CommitMetrics } from "./types";

export interface AggregatedSessions {
  sessions: AgentSession[];
  byAgent: Partial<Record<AgentName, AgentTokenSummary>>;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCachedTokens: number;
  totalTokens: number;
}

export function aggregateSessions(
  workingDir: string,
  fromTime: Date,
  toTime: Date,
  commitSha?: string,
): AggregatedSessions {
  const all: AgentSession[] = [
    ...readClaudeCodeSessions(workingDir, fromTime, toTime),
    ...readGeminiSessions(workingDir, fromTime, toTime),
    ...readCodexSessions(workingDir, fromTime, toTime, commitSha),
  ];

  const byAgent: Partial<Record<AgentName, AgentTokenSummary>> = {};

  for (const session of all) {
    const summary = byAgent[session.agent] ?? {
      inputTokens: 0,
      outputTokens: 0,
      cachedTokens: 0,
      totalTokens: 0,
      sessionCount: 0,
    };
    for (const turn of session.turns) {
      summary.inputTokens += turn.inputTokens;
      summary.outputTokens += turn.outputTokens;
      summary.cachedTokens += turn.cachedTokens;
    }
    summary.totalTokens = summary.inputTokens + summary.outputTokens;
    summary.sessionCount += 1;
    byAgent[session.agent] = summary;
  }

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCachedTokens = 0;

  for (const s of Object.values(byAgent)) {
    if (!s) continue;
    totalInputTokens += s.inputTokens;
    totalOutputTokens += s.outputTokens;
    totalCachedTokens += s.cachedTokens;
  }

  return {
    sessions: all,
    byAgent,
    totalInputTokens,
    totalOutputTokens,
    totalCachedTokens,
    totalTokens: totalInputTokens + totalOutputTokens,
  };
}
