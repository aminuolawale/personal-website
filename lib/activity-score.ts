import type { AgentName, AgentTokenSummary } from "@/lib/coding-agents/types";

export type OcsBucket = "okay" | "good" | "great" | "excellent";

export const OCS_BUCKET_LABELS: Record<OcsBucket, string> = {
  okay: "Okay",
  good: "Good",
  great: "Great",
  excellent: "Excellent",
};

export const OCS_BUCKET_CLASSES: Record<OcsBucket, string> = {
  okay: "border-zinc-400/30 text-zinc-300 bg-zinc-400/5",
  good: "border-amber-400/30 text-amber-300 bg-amber-400/5",
  great: "border-emerald-400/30 text-emerald-300 bg-emerald-400/5",
  excellent: "border-sky-400/30 text-sky-300 bg-sky-400/5",
};

export function getOcsBucket(ocs: number): OcsBucket {
  if (ocs < 30) return "okay";
  if (ocs <= 50) return "good";
  if (ocs <= 80) return "great";
  return "excellent";
}

export function formatTokens(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

const AGENT_DISPLAY_NAMES: Record<AgentName, string> = {
  "claude-code": "Claude Code",
  gemini: "Gemini",
  codex: "Codex",
};

export function getDominantAgent(
  byAgent: Partial<Record<AgentName, AgentTokenSummary>>
): string {
  const entries = Object.entries(byAgent) as [AgentName, AgentTokenSummary][];
  if (entries.length === 0) return "AI";
  const [topAgent] = entries.sort((a, b) => b[1].totalTokens - a[1].totalTokens);
  return AGENT_DISPLAY_NAMES[topAgent[0]];
}
