import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncActivitiesToDb } from "@/lib/swe-activity-sync";
import { sweActivity } from "@/lib/schema";
import type { ActivityItem } from "@/lib/vercel-activity";

// Mock the DB methods
const mockValues = vi.fn(() => ({
  onConflictDoUpdate: vi.fn(() => Promise.resolve()),
}));
const mockInsert = vi.fn(() => ({ values: mockValues }));
const mockDb = {
  insert: mockInsert,
  select: vi.fn(() => ({
    from: () => ({
      where: async () => [],
    }),
  })),
};

// Mock the lib/db module to return our mock object
vi.mock("@/lib/db", () => ({
  getDb: vi.fn(() => mockDb),
}));

describe("SWE Activity Sync Engine", () => {
  const mockActivities: ActivityItem[] = [
    {
      id: "old-event",
      type: "commit",
      message: "Old commit",
      repo: "repo-1",
      timestamp: "2026-04-23T23:59:59Z", // Before cutoff
      url: "http://github.com/1",
    },
    {
      id: "new-event",
      type: "commit",
      message: "New commit",
      repo: "repo-1",
      timestamp: "2026-04-24T00:00:01Z", // After cutoff
      url: "http://github.com/2",
    },
    {
      id: "edge-event",
      type: "deployment",
      message: "Deployment",
      repo: "repo-2",
      timestamp: "2026-04-24T00:00:00Z", // Exactly on cutoff
      url: "http://vercel.com/1",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnValue({
      from: () => ({
        where: async () => [],
      }),
    });
    mockInsert.mockReturnValue({ values: mockValues });
  });

  it("should only sync events on or after April 24th, 2026", async () => {
    await syncActivitiesToDb(mockActivities);

    // Now uses a single BATCH insert call
    expect(mockInsert).toHaveBeenCalledWith(sweActivity);
    
    // Check that values() was called with the 2 correct items
    const activityValuesCall = mockValues.mock.calls.find(([arg]) => Array.isArray(arg))?.[0];
    expect(activityValuesCall).toBeDefined();
    const valuesCall = activityValuesCall!;
    expect(valuesCall).toHaveLength(2);
    expect(valuesCall[0].externalId).toBe("new-event");
    expect(valuesCall[1].externalId).toBe("edge-event");
  });

  it("should handle empty activity list gracefully", async () => {
    await syncActivitiesToDb([]);
    expect(mockInsert).not.toHaveBeenCalledWith(sweActivity);
  });

  it("deduplicates repeated external IDs before batch upsert", async () => {
    await syncActivitiesToDb([
      {
        id: "vercel-commit-abc123",
        type: "commit",
        message: "Older duplicate",
        repo: "repo-1",
        timestamp: "2026-05-10T10:00:00Z",
        url: "http://github.com/old",
      },
      {
        id: "vercel-commit-abc123",
        type: "commit",
        message: "Newer duplicate",
        repo: "repo-1",
        timestamp: "2026-05-10T11:00:00Z",
        url: "http://github.com/new",
      },
    ]);

    const activityValuesCall = mockValues.mock.calls.find(([arg]) => Array.isArray(arg))?.[0];
    expect(activityValuesCall).toBeDefined();
    const valuesCall = activityValuesCall!;
    expect(valuesCall).toHaveLength(1);
    expect(valuesCall[0]).toMatchObject({
      externalId: "vercel-commit-abc123",
      message: "Newer duplicate",
      url: "http://github.com/new",
    });
  });
});
