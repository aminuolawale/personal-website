import Anthropic from "@anthropic-ai/sdk";
import type { SpecificityScore } from "./coding-agents/types";

const SYSTEM = `You are an expert evaluator of software engineering conversations between a developer and an AI coding agent.
You score conversations on task control — how clearly and usefully the developer guides the AI coding agent toward the right engineering outcome.
You must respond with valid JSON only, no prose outside the JSON object.`;

const RUBRIC = `Score the following conversation on how well the developer controls the task. Evaluate only the developer's messages (lines starting with "Mohammed:"). Use the assistant messages only as context for whether short developer follow-ups, approvals, or redirects are clear.

First classify the dominant prompt mode:
- bug_report: the developer reports broken behavior, errors, logs, or production/local mismatch.
- implementation_request: the developer asks for code changes or feature work.
- design_request: the developer asks for a proposed design/plan rather than immediate code.
- review_request: the developer asks for code/logic inspection, risks, or critique.
- approval_or_redirect: the developer approves, rejects, narrows, or redirects prior work.
- mixed: multiple modes are materially present.

Score these components:

1. taskIntentClarity (0-25)
   - 0-5: unclear or missing task.
   - 6-12: broad request with a weak target.
   - 13-19: clear task, but important behavior or target surface is incomplete.
   - 20-25: clear outcome and target behavior.

2. contextQuality (0-20)
   - 0-5: no useful context.
   - 6-12: some context, but incomplete.
   - 13-17: enough context to diagnose or implement.
   - 18-20: includes exact logs, affected environment, examples, or current/expected behavior.

3. constraintsAndAcceptance (0-20)
   - 0-5: no boundaries or success criteria.
   - 6-12: some implicit constraints or expected outcome.
   - 13-17: clear acceptance criteria, compatibility constraints, or do/don't boundaries.
   - 18-20: precise constraints with concrete verification expectations.

4. actionability (0-20)
   - 0-5: agent likely needs clarification.
   - 6-12: agent can start, but wrong scope is likely.
   - 13-17: agent can proceed safely.
   - 18-20: agent can implement or verify directly.

5. iterativeSteering (0-10)
   - 0-2: no useful follow-up or contradictory steering.
   - 3-6: basic approval/rejection/clarification.
   - 7-10: coherent refinement, prioritization, or redirection across turns.

6. communicationHygiene (0-5)
   - 0-1: wording frequently blocks understanding.
   - 2-3: readable with some ambiguity or mistakes.
   - 4-5: concise and easy to interpret.

Mode-aware guidance:
- For bug_report, reward exact errors, stack traces, environment, reproduction clues, and production/local distinctions.
- For implementation_request, reward affected surfaces, target behavior, constraints, and acceptance criteria.
- For design_request, reward architectural goals, tradeoffs requested, scope, and constraints.
- For review_request, reward a clear review target and risk category.
- For approval_or_redirect, do not punish short messages like "go ahead" when the prior context makes the action clear. Score the developer's ability to advance the existing task.
- Do not over-reward lists of file names or technical nouns if intent and acceptance remain unclear.
- Do not heavily punish typos or grammar unless they change meaning.

TOTAL = taskIntentClarity + contextQuality + constraintsAndAcceptance + actionability + iterativeSteering + communicationHygiene, clamped to [0, 100].
confidence is 0-1 and reflects how much usable developer context was available.

Write a 2–4 sentence explanation citing specific examples from the developer's messages. You should ALWAYS refer to the developer in the second person ("you"). You must never use any other pronoun or phrase to refer to them.
Write one concise improvement suggestion that would most improve task control next time.

Respond with ONLY this JSON shape:
{
  "total": number,
  "mode": "bug_report"|"implementation_request"|"design_request"|"review_request"|"approval_or_redirect"|"mixed",
  "components": {
    "taskIntentClarity": number,
    "contextQuality": number,
    "constraintsAndAcceptance": number,
    "actionability": number,
    "iterativeSteering": number,
    "communicationHygiene": number
  },
  "confidence": number,
  "explanation": "string",
  "improvement": "string"
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
        content: `${RUBRIC}\n\n<conversation>\n${promptText}\n</conversation>`,
      },
    ],
  });

  const raw = response.content[0];
  if (raw.type !== "text") throw new Error("Unexpected response type from scorer");

  // Strip markdown code fences if present
  const json = raw.text.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();

  return JSON.parse(json) as SpecificityScore;
}
