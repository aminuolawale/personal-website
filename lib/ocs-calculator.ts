// OCS = 0.60 × S  +  0.25 × E  +  0.15 × L
//
// S — Specificity score of the foundation prompt (0–100)
// E — Efficiency score: 100 × exp(−k × outputTokens / netLOC), k = ln(2)/80
//     Baseline: 80 output tokens/LOC → E = 50
// L — LOC contribution: min(100, 100 × log1p(netLOC) / log1p(locRef))
//     Default locRef = 150 (substantial single-session commit)

const K = Math.log(2) / 80;

export function computeOCS(inputs: {
  specificityScore: number;
  outputTokens: number;
  netLOC: number;
  locRef?: number;
}): number {
  const { specificityScore: S, outputTokens, netLOC, locRef = 150 } = inputs;

  const effectiveLOC = Math.max(netLOC, 1);

  const E = 100 * Math.exp(-K * (outputTokens / effectiveLOC));

  const L = Math.min(100, (100 * Math.log1p(Math.max(netLOC, 0))) / Math.log1p(locRef));

  return Math.round(0.6 * S + 0.25 * E + 0.15 * L);
}
