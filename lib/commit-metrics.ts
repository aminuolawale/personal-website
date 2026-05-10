import { execSync } from "child_process";
import { aggregateSessions } from "./coding-agents";
import { scoreSpecificity } from "./specificity-scorer";
import { computeOCS } from "./ocs-calculator";
import type {
  CommitMetrics,
  ChangelistDesign,
  AgentSession,
  SessionTurn,
} from "./coding-agents/types";

// ---- LOC from git ----

function getLoc(
  sha: string,
  prevSha: string,
  repoPath: string,
): CommitMetrics["loc"] {
  try {
    const cmd = prevSha
      ? `git -C "${repoPath}" diff --numstat ${prevSha} ${sha}`
      : `git -C "${repoPath}" show --numstat ${sha}`;
    const output = execSync(cmd, { encoding: "utf8" });
    let additions = 0;
    let deletions = 0;
    let filesChanged = 0;
    for (const line of output.split("\n")) {
      const [add, del] = line.trim().split(/\s+/);
      const a = parseInt(add, 10);
      const d = parseInt(del, 10);
      if (!Number.isNaN(a) && !Number.isNaN(d)) {
        additions += a;
        deletions += d;
        filesChanged++;
      }
    }
    return { additions, deletions, net: additions + deletions, filesChanged };
  } catch {
    return { additions: 0, deletions: 0, net: 0, filesChanged: 0 };
  }
}

// ---- Commit timestamps ----

function getCommitTime(sha: string, repoPath: string): Date | null {
  try {
    const ts = execSync(`git -C "${repoPath}" log -1 --format=%cI ${sha}`, {
      encoding: "utf8",
    }).trim();
    return new Date(ts);
  } catch {
    return null;
  }
}

// ---- Conversation builder ----

const AGENT_DISPLAY: Record<string, string> = {
  "claude-code": "Claude Code",
  gemini: "Gemini",
  codex: "Codex",
};

function buildConversation(sessions: AgentSession[]): string {
  const allTurns: { turn: SessionTurn; agent: string }[] = [];
  for (const session of sessions) {
    for (const turn of session.turns) {
      allTurns.push({ turn, agent: session.agent });
    }
  }
  allTurns.sort((a, b) => a.turn.timestamp.getTime() - b.turn.timestamp.getTime());

  const lines: string[] = [];
  for (const { turn, agent } of allTurns) {
    if (!turn.text.trim()) continue;
    const speaker = turn.role === "user" ? "Mohammed" : (AGENT_DISPLAY[agent] ?? agent);
    lines.push(`${speaker}: ${turn.text.trim()}`);
  }
  return lines.join("\n\n");
}

// ---- CL Design extraction ----

const PLAN_PATTERNS = [
  /\bphase\s+\d/i,
  /\bhere['']s\s+(my\s+)?plan\b/i,
  /\bhere['']s\s+(my\s+)?approach\b/i,
  /\bbefore\s+implement/i,
  /\bmy\s+design\b/i,
  /^#{1,3}\s/m,          // markdown headings
  /\d+\.\s+\*\*/m,       // numbered bold items
];

function isPlanMode(text: string): boolean {
  return PLAN_PATTERNS.some((p) => p.test(text));
}

function findClDesign(sessions: AgentSession[]): ChangelistDesign | null {
  const candidates: (SessionTurn & { turnIndex: number })[] = [];
  for (const session of sessions) {
    for (const turn of session.turns) {
      if (turn.role !== "assistant") continue;
      if (turn.index > 3) break;
      candidates.push({ ...turn, turnIndex: turn.index });
    }
  }

  candidates.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  for (const c of candidates) {
    if (c.outputTokens < 150) continue;
    if (!c.text.trim()) continue;
    return {
      text: c.text,
      turnIndex: c.turnIndex,
      isPlanMode: isPlanMode(c.text),
      outputTokens: c.outputTokens,
    };
  }

  return null;
}

// ---- Main ----

export async function computeCommitMetrics(params: {
  sha: string;
  prevSha: string;
  workingDir: string;
  repoPath: string;
}): Promise<CommitMetrics> {
  const { sha, prevSha, workingDir, repoPath } = params;

  const commitTime = getCommitTime(sha, repoPath) ?? new Date();
  const prevCommitTime = prevSha ? (getCommitTime(prevSha, repoPath) ?? new Date(0)) : new Date(0);

  const loc = getLoc(sha, prevSha, repoPath);

  const { sessions, byAgent, totalInputTokens, totalOutputTokens, totalCachedTokens, totalTokens } =
    aggregateSessions(workingDir, prevCommitTime, commitTime, sha);

  const effectiveLOC = Math.max(loc.net, 1);
  const tokensPerLOC = Math.round(totalTokens / effectiveLOC);

  const conversation = buildConversation(sessions) || null;
  const clDesign = findClDesign(sessions);

  let conversationScore: CommitMetrics["conversationScore"] = null;
  let ocs = 0;

  if (conversation) {
    const scoreText = conversation.slice(0, 3000);
    const specificity = await scoreSpecificity(scoreText);
    conversationScore = { specificity };
    const effectiveOutputTokens = totalOutputTokens > 0 ? totalOutputTokens : totalTokens;
    ocs = computeOCS({
      specificityScore: specificity.total,
      outputTokens: effectiveOutputTokens,
      netLOC: loc.net,
    });
  }

  return {
    capturedAt: new Date().toISOString(),
    loc,
    tokenMetrics: {
      totalTokens,
      outputTokens: totalOutputTokens,
      inputTokens: totalInputTokens,
      cachedTokens: totalCachedTokens,
      tokensPerLOC,
      byAgent,
    },
    conversation,
    conversationScore,
    clDesign,
    scores: { ocs },
  };
}
