import { execSync } from "child_process";
import { aggregateSessions } from "./coding-agents";
import { scoreSpecificity } from "./specificity-scorer";
import { computeOCS } from "./ocs-calculator";
import type {
  CommitMetrics,
  PromptEntry,
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

// ---- Prompt chain extraction ----

function buildPromptChain(sessions: AgentSession[]): PromptEntry[] {
  // Flatten all user turns across sessions, sorted by timestamp.
  const userTurns: (SessionTurn & { agentOutputTokens: number })[] = [];

  for (const session of sessions) {
    for (let i = 0; i < session.turns.length; i++) {
      const turn = session.turns[i];
      if (turn.role !== "user") continue;
      // Attribute the output tokens of the following assistant turn to this prompt.
      const next = session.turns[i + 1];
      userTurns.push({
        ...turn,
        agentOutputTokens: next?.role === "assistant" ? next.outputTokens : 0,
      });
    }
  }

  userTurns.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return userTurns.map((t, idx): PromptEntry => ({
    index: idx,
    role: idx === 0 ? "foundation" : "refinement",
    text: t.text,
    timestamp: t.timestamp,
    tokensConsumed: t.agentOutputTokens,
  }));
}

// ---- Foundation prompt ----

function findFoundationPrompt(chain: PromptEntry[]): string | null {
  const substantial = chain.find((p) => p.text.length >= 60);
  return substantial?.text ?? chain[0]?.text ?? null;
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
  // Look at the first few assistant turns across all sessions.
  const candidates: (SessionTurn & { turnIndex: number })[] = [];
  for (const session of sessions) {
    for (const turn of session.turns) {
      if (turn.role !== "assistant") continue;
      if (turn.index > 3) break; // only early turns qualify
      candidates.push({ ...turn, turnIndex: turn.index });
    }
  }

  candidates.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  for (const c of candidates) {
    if (c.outputTokens < 150) continue;         // too short
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

  const chain = buildPromptChain(sessions);
  const foundationText = findFoundationPrompt(chain);
  const clDesign = findClDesign(sessions);

  let foundationPrompt: CommitMetrics["foundationPrompt"] = null;
  let ocs = 0;

  if (foundationText) {
    const specificity = await scoreSpecificity(foundationText);
    foundationPrompt = { text: foundationText, specificity };
    // Some agents (Codex) lump all tokens into inputTokens with outputTokens=0.
    // Fall back to totalTokens so the efficiency score isn't artificially 100.
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
    promptChain: chain,
    foundationPrompt,
    clDesign,
    scores: { ocs },
  };
}
