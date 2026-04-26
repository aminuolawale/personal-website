import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AuthButton from "@/components/AuthButton";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import { useSession, signIn } from "next-auth/react";

describe("AuthButton", () => {
  it("renders loading state while session is loading", () => {
    vi.mocked(useSession).mockReturnValue({ data: null, status: "loading", update: vi.fn() });
    const { container } = render(<AuthButton />);
    expect(container.firstChild).toHaveClass("animate-pulse");
  });

  it("renders sign-in button when not authenticated", () => {
    vi.mocked(useSession).mockReturnValue({ data: null, status: "unauthenticated", update: vi.fn() });
    render(<AuthButton />);
    expect(screen.getByText("Sign in")).toBeInTheDocument();
  });

  it("calls signIn with google when sign-in button clicked", () => {
    vi.mocked(useSession).mockReturnValue({ data: null, status: "unauthenticated", update: vi.fn() });
    render(<AuthButton />);
    fireEvent.click(screen.getByText("Sign in"));
    expect(signIn).toHaveBeenCalledWith("google", expect.any(Object));
  });

  it("renders avatar when authenticated", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { name: "Alice", email: "alice@test.com", image: "https://example.com/avatar.jpg" },
        expires: "2100-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });
    render(<AuthButton />);
    expect(screen.getByAltText("Alice")).toBeInTheDocument();
  });

  it("shows dropdown menu when avatar clicked", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { name: "Alice", email: "alice@test.com", image: null },
        expires: "2100-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });
    render(<AuthButton />);
    const trigger = screen.getByRole("button", { name: /account menu/i });
    fireEvent.click(trigger);
    expect(screen.getByText("My Bookmarks")).toBeInTheDocument();
    expect(screen.getByText("Sign out")).toBeInTheDocument();
  });

  it("inline mode renders flat links when authenticated", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { name: "Bob", email: "bob@test.com", image: null },
        expires: "2100-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });
    render(<AuthButton inline />);
    expect(screen.getByText("My Bookmarks")).toBeInTheDocument();
    expect(screen.getByText("Sign out")).toBeInTheDocument();
    // In inline mode there's no dropdown button
    expect(screen.queryByRole("button", { name: /account menu/i })).not.toBeInTheDocument();
  });
});
