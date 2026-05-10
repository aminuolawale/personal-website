export type AgentName = "claude-code" | "gemini" | "codex";

export interface SessionTurn {
  index: number;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
}

export interface AgentSession {
  sessionId: string;
  agent: AgentName;
  startTime: Date;
  endTime: Date;
  workingDir: string;
  turns: SessionTurn[];
}

export interface AgentTokenSummary {
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  totalTokens: number;
  sessionCount: number;
}

// ---- Specificity Score ----

export interface SpecificityPenalties {
  typos: { count: number; deduction: number };
  incorrectUsage: { count: number; deduction: number };
  grammarQuality: {
    severity: "none" | "minor" | "moderate" | "poor";
    deduction: number;
  };
}

export interface SpecificityScore {
  total: number;
  components: {
    informationDensity: number;
    coherence: number;
    languageQuality: number;
  };
  penalties: SpecificityPenalties;
  explanation: string;
}

// ---- Changelist Design ----

export interface ChangelistDesign {
  text: string;
  turnIndex: number;
  isPlanMode: boolean;
  outputTokens: number;
}

// ---- Per-commit stored metrics ----

export interface CommitMetrics {
  capturedAt: string;
  loc: {
    additions: number;
    deletions: number;
    net: number;
    filesChanged: number;
  };
  tokenMetrics: {
    totalTokens: number;
    outputTokens: number;
    inputTokens: number;
    cachedTokens: number;
    tokensPerLOC: number;
    byAgent: Partial<Record<AgentName, AgentTokenSummary>>;
  };
  conversation: string | null;
  conversationScore: {
    specificity: SpecificityScore;
  } | null;
  clDesign: ChangelistDesign | null;
  scores: {
    ocs: number;
  };
}
