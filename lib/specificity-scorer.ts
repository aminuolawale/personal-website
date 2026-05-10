import Anthropic from "@anthropic-ai/sdk";
import type { SpecificityScore } from "./coding-agents/types";

const SYSTEM = `You are an expert evaluator of software engineering prompts.
You score prompts on specificity — how precisely and coherently they communicate intent to an AI coding agent.
You must respond with valid JSON only, no prose outside the JSON object.`;

const RUBRIC = `Score the following prompt on these three components. Return a JSON object.

COMPONENTS:
1. informationDensity (0–40): Award points for:
   - Each concrete technical entity (named file, function, component, API, constraint): +3
   - Each specific expected outcome or acceptance criterion: +5
   - Each quantitative constraint (number, threshold, timeout, size): +2
   - Deduct 2 for each vague placeholder ("something", "kind of", "maybe", "etc.")

2. coherence (0–30): Split as:
   - Problem/context clearly stated (0–10)
   - Requirement separated from background noise (0–10)
   - No internal contradictions or ambiguous scope (0–10)

3. languageQuality (0–30): Start at 30, apply penalties:
   - Typos: −0.5 per instance, capped at −3 total
   - Wrong word / incorrect terminology / malapropism: −2 per instance, capped at −8
   - Grammar: none=0, minor=−1, moderate=−3, poor=−6

PENALTIES (record separately for transparency):
- typos: { count, deduction }
- incorrectUsage: { count, deduction }  (wrong words, not typos)
- grammarQuality: { severity: "none"|"minor"|"moderate"|"poor", deduction }

TOTAL = informationDensity + coherence + languageQuality_after_penalties, clamped to [0, 100].

Write a 2–4 sentence explanation citing specific examples from the prompt.

Respond with ONLY this JSON shape:
{
  "total": number,
  "components": {
    "informationDensity": number,
    "coherence": number,
    "languageQuality": number
  },
  "penalties": {
    "typos": { "count": number, "deduction": number },
    "incorrectUsage": { "count": number, "deduction": number },
    "grammarQuality": { "severity": "none"|"minor"|"moderate"|"poor", "deduction": number }
  },
  "explanation": "string"
}`;

export async function scoreSpecificity(promptText: string): Promise<SpecificityScore> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `${RUBRIC}\n\n<prompt>\n${promptText}\n</prompt>`,
      },
    ],
  });

  const raw = response.content[0];
  if (raw.type !== "text") throw new Error("Unexpected response type from scorer");

  // Strip markdown code fences if present
  const json = raw.text.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();

  return JSON.parse(json) as SpecificityScore;
}
