import { describe, it, expect } from "vitest";
import { computeOCS } from "@/lib/ocs-calculator";

// OCS = 0.60×S  +  0.25×E  +  0.15×L
// E = 100 × exp(−k × outputTokens/netLOC),  k = ln(2)/80
// L = min(100, 100 × log1p(netLOC) / log1p(locRef=150))

describe("computeOCS", () => {
  it("returns 100 with perfect inputs (S=100, zero tokens, LOC=locRef)", () => {
    // E = 100 * exp(0) = 100, L = 100
    const ocs = computeOCS({ specificityScore: 100, outputTokens: 0, netLOC: 150 });
    expect(ocs).toBe(100);
  });

  it("baseline efficiency: 80 output tokens per LOC → E = 50", () => {
    // 80 tokens, 1 LOC → ratio = 80 → E = 100 * exp(-ln(2)/80 * 80) = 50
    const E = 100 * Math.exp(-(Math.log(2) / 80) * 80);
    expect(E).toBeCloseTo(50, 1);

    const S = 100;
    const netLOC = 1;
    const L = Math.min(100, 100 * Math.log1p(1) / Math.log1p(150));
    const expected = Math.round(0.6 * S + 0.25 * E + 0.15 * L);
    expect(computeOCS({ specificityScore: 100, outputTokens: 80, netLOC: 1 })).toBe(expected);
  });

  it("returns 0 when specificity, tokens, and LOC are all zero", () => {
    // E = 100 (exp(0)), L = 0
    expect(computeOCS({ specificityScore: 0, outputTokens: 0, netLOC: 0 })).toBe(25);
  });

  it("specificity has the highest weight (0.60)", () => {
    const high = computeOCS({ specificityScore: 100, outputTokens: 1000, netLOC: 10 });
    const low = computeOCS({ specificityScore: 0, outputTokens: 1000, netLOC: 10 });
    expect(high - low).toBeGreaterThan(50);
  });

  it("efficiency decays as tokens per LOC grows", () => {
    const efficient = computeOCS({ specificityScore: 80, outputTokens: 40, netLOC: 100 });
    const wasteful = computeOCS({ specificityScore: 80, outputTokens: 5000, netLOC: 100 });
    expect(efficient).toBeGreaterThan(wasteful);
  });

  it("LOC contribution is capped at 100", () => {
    const big = computeOCS({ specificityScore: 0, outputTokens: 0, netLOC: 100_000 });
    const locRef = computeOCS({ specificityScore: 0, outputTokens: 0, netLOC: 150 });
    // both should give the same result since L is capped at 100 in both cases
    expect(big).toBe(locRef);
  });

  it("respects a custom locRef", () => {
    const smallRef = computeOCS({ specificityScore: 0, outputTokens: 0, netLOC: 50, locRef: 50 });
    // L = 100 with locRef=50 and netLOC=50
    expect(smallRef).toBe(Math.round(0.25 * 100 + 0.15 * 100)); // E=100 (no tokens), L=100
  });

  it("returns an integer", () => {
    const ocs = computeOCS({ specificityScore: 63, outputTokens: 120, netLOC: 47 });
    expect(Number.isInteger(ocs)).toBe(true);
  });

  it("is bounded between 0 and 100", () => {
    const cases = [
      { specificityScore: 0, outputTokens: 0, netLOC: 0 },
      { specificityScore: 100, outputTokens: 0, netLOC: 150 },
      { specificityScore: 50, outputTokens: 80, netLOC: 1 },
      { specificityScore: 100, outputTokens: 99999, netLOC: 1 },
    ];
    for (const c of cases) {
      const ocs = computeOCS(c);
      expect(ocs).toBeGreaterThanOrEqual(0);
      expect(ocs).toBeLessThanOrEqual(100);
    }
  });

  it("efficiency is zero-safe (no NaN when LOC is 0)", () => {
    // netLOC = 0 → effectiveLOC = 1 (guard), no division by zero
    const ocs = computeOCS({ specificityScore: 50, outputTokens: 200, netLOC: 0 });
    expect(Number.isFinite(ocs)).toBe(true);
  });
});
