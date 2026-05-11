import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ActivityManager from "@/components/admin/ActivityManager";
import "@testing-library/jest-dom";

type FetchMock = typeof fetch & {
  mockResolvedValue: (value: unknown) => void;
  mockImplementation: (implementation: typeof fetch) => void;
};

// Mock fetch
const globalFetch = global.fetch;
beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  global.fetch = globalFetch;
});

describe("ActivityManager Admin Component", () => {
  const mockActivities = [
    {
      id: 1,
      type: "commit",
      message: "Initial commit",
      repo: "my-repo",
      timestamp: new Date().toISOString(),
      note: ""
    }
  ];

  it("should load and display activities", async () => {
    (global.fetch as FetchMock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ activities: mockActivities, syncState: {} })
    });

    render(<ActivityManager />);

    expect(screen.getByText(/Loading activities.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Initial commit")).toBeInTheDocument();
    });
  });

  it("should enter edit mode when save button is clicked (used as edit here)", async () => {
    (global.fetch as FetchMock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ activities: mockActivities, syncState: {} })
    });

    render(<ActivityManager />);

    await waitFor(() => screen.getByText("Initial commit"));
    
    const editBtn = screen.getByTitle("Edit");
    fireEvent.click(editBtn);

    expect(screen.getByLabelText(/Display Message/i)).toBeInTheDocument();
    expect(screen.queryByText(/Mohammed vs AI Contribution/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Context Note/i)).toBeInTheDocument();
  });

  it("should sync latest GitHub commits from the admin panel", async () => {
    (global.fetch as FetchMock).mockImplementation(((url: RequestInfo | URL, init?: RequestInit) => {
      if (String(url) === "/api/admin/swe-activity/sync" && init?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            synced: 2,
            repo: "aminuolawale/personal-website",
          }),
        } as Response);
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ activities: mockActivities, syncState: {} }),
      } as Response);
    }) as typeof fetch);

    render(<ActivityManager />);

    await waitFor(() => screen.getByText("Initial commit"));
    fireEvent.click(screen.getByRole("button", { name: /Sync GitHub/i }));

    await waitFor(() => {
      expect(screen.getByText("Synced 2 latest commits from aminuolawale/personal-website.")).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith("/api/admin/swe-activity/sync", { method: "POST" });
  });
});
