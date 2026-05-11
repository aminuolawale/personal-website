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

// ---- Specificity / Task Control Score ----

export type PromptMode =
  | "bug_report"
  | "implementation_request"
  | "design_request"
  | "review_request"
  | "approval_or_redirect"
  | "mixed";

export interface SpecificityScore {
  total: number;
  mode: PromptMode;
  components: {
    taskIntentClarity: number;
    contextQuality: number;
    constraintsAndAcceptance: number;
    actionability: number;
    iterativeSteering: number;
    communicationHygiene: number;
  };
  confidence: number;
  explanation: string;
  improvement: string;
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
