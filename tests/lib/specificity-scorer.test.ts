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
  mode: "implementation_request",
  components: {
    taskIntentClarity: 20,
    contextQuality: 14,
    constraintsAndAcceptance: 12,
    actionability: 16,
    iterativeSteering: 6,
    communicationHygiene: 4,
  },
  confidence: 0.82,
  explanation: "You gave a clear implementation target and enough context to start.",
  improvement: "Add explicit acceptance criteria.",
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
    expect(result.mode).toBe("implementation_request");
    expect(result.components.taskIntentClarity).toBe(20);
    expect(result.components.actionability).toBe(16);
    expect(result.confidence).toBe(0.82);
    expect(result.improvement).toBe("Add explicit acceptance criteria.");
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
