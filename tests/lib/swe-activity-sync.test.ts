import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncActivitiesToDb } from "@/lib/swe-activity-sync";
import { sweActivity } from "@/lib/schema";
import type { ActivityItem } from "@/lib/github-activity";

// Mock the DB methods
const mockDb = {
  insert: vi.fn(() => ({
    values: vi.fn(() => ({
      onConflictDoUpdate: vi.fn(() => Promise.resolve()),
    })),
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
  });

  it("should only sync events on or after April 24th, 2026", async () => {
    await syncActivitiesToDb(mockActivities);

    // Only 'new-event' and 'edge-event' should trigger a DB insert
    expect(mockDb.insert).toHaveBeenCalledTimes(2);
    
    const calls = (mockDb.insert as any).mock.calls;
    expect(calls).toContainEqual([sweActivity]);
  });

  it("should handle empty activity list gracefully", async () => {
    await syncActivitiesToDb([]);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});
