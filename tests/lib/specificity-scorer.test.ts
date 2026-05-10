import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockCreate, MockAnthropic } = vi.hoisted(() => {
  const mockCreate = vi.fn();
  class MockAnthropic {
    messages: { create: typeof mockCreate };
    constructor() {
      this.messages = { create: mockCreate };
    }
  }
  return { mockCreate, MockAnthropic };
});

vi.mock("@anthropic-ai/sdk", () => ({
  default: MockAnthropic,
}));

import { scoreSpecificity } from "@/lib/specificity-scorer";

const MOCK_SCORE = {
  total: 72,
  components: { informationDensity: 30, coherence: 22, languageQuality: 20 },
  penalties: {
    typos: { count: 0, deduction: 0 },
    incorrectUsage: { count: 0, deduction: 0 },
    grammarQuality: { severity: "none", deduction: 0 },
  },
  explanation: "Clear and well-scoped prompt.",
};

describe("scoreSpecificity", () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = originalKey;
  });

  it("throws if ANTHROPIC_API_KEY is not set", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await expect(scoreSpecificity("hello")).rejects.toThrow("ANTHROPIC_API_KEY");
  });

  it("returns a parsed SpecificityScore from the API response", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(MOCK_SCORE) }],
    });
    const result = await scoreSpecificity("Add pagination to the user list endpoint");
    expect(result.total).toBe(72);
    expect(result.components.informationDensity).toBe(30);
    expect(result.components.coherence).toBe(22);
    expect(result.penalties.grammarQuality.severity).toBe("none");
    expect(result.explanation).toBe("Clear and well-scoped prompt.");
  });

  it("strips markdown code fences before parsing JSON", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "```json\n" + JSON.stringify(MOCK_SCORE) + "\n```" }],
    });
    const result = await scoreSpecificity("some prompt text");
    expect(result.total).toBe(72);
  });

  it("throws when the response content is not a text block", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "tool_use", id: "x", name: "foo", input: {} }],
    });
    await expect(scoreSpecificity("prompt")).rejects.toThrow("Unexpected response type");
  });

  it("calls the API with the haiku model", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(MOCK_SCORE) }],
    });
    await scoreSpecificity("my prompt");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: "claude-haiku-4-5-20251001" })
    );
  });

  it("includes the prompt text in the user message sent to the API", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(MOCK_SCORE) }],
    });
    await scoreSpecificity("implement dark mode toggle");
    const call = mockCreate.mock.calls[0][0];
    expect(call.messages[0].content).toContain("implement dark mode toggle");
  });
});
