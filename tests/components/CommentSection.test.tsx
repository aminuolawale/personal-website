import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import CommentSection from "@/components/CommentSection";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

global.fetch = vi.fn();

import { useSession, signIn } from "next-auth/react";

const approvedComment = {
  id: 1,
  articleId: 5,
  readerEmail: "alice@test.com",
  readerName: "Alice",
  readerAvatarUrl: null,
  content: "Nice article!",
  approved: true,
  country: null,
  createdAt: new Date().toISOString(),
};

describe("CommentSection", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  it("shows sign-in prompt when not authenticated", async () => {
    vi.mocked(useSession).mockReturnValue({ data: null, status: "unauthenticated", update: vi.fn() });
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [] } as Response);

    render(<CommentSection articleId={5} />);
    await waitFor(() => {
      expect(screen.getByText("Sign in to leave a comment")).toBeInTheDocument();
    });
  });

  it("shows textarea form when authenticated", async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { name: "Bob", email: "bob@test.com", image: null },
        expires: "2100-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [] } as Response);

    render(<CommentSection articleId={5} />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Share a thought…")).toBeInTheDocument();
    });
  });

  it("loads and displays approved comments", async () => {
    vi.mocked(useSession).mockReturnValue({ data: null, status: "unauthenticated", update: vi.fn() });
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [approvedComment],
    } as Response);

    render(<CommentSection articleId={5} />);
    await waitFor(() => {
      expect(screen.getByText("Nice article!")).toBeInTheDocument();
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
  });

  it("shows pending notice after successful comment submission", async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { name: "Bob", email: "bob@test.com", image: null },
        expires: "2100-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    // First fetch: load comments (empty)
    // Second fetch: post comment (success)
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)
      .mockResolvedValueOnce({ ok: true } as Response);

    render(<CommentSection articleId={5} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Share a thought…")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Share a thought…"), {
      target: { value: "My test comment" },
    });
    fireEvent.click(screen.getByText("Post"));

    await waitFor(() => {
      expect(screen.getByText("Your comment is awaiting approval.")).toBeInTheDocument();
    });
  });

  it("shows empty state message when no comments exist", async () => {
    vi.mocked(useSession).mockReturnValue({ data: null, status: "unauthenticated", update: vi.fn() });
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [] } as Response);

    render(<CommentSection articleId={5} />);
    await waitFor(() => {
      expect(screen.getByText("No comments yet. Be the first.")).toBeInTheDocument();
    });
  });

  it("shows comment count in heading", async () => {
    vi.mocked(useSession).mockReturnValue({ data: null, status: "unauthenticated", update: vi.fn() });
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [approvedComment],
    } as Response);

    render(<CommentSection articleId={5} />);
    await waitFor(() => {
      expect(screen.getByText("Comments (1)")).toBeInTheDocument();
    });
  });
});
