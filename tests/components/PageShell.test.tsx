import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import PageShell from "@/components/PageShell";

vi.mock("@/components/Navbar", () => ({
  default: () => <nav data-testid="navbar" />,
}));

vi.mock("@/components/Footer", () => ({
  default: () => <footer data-testid="footer" />,
}));

vi.mock("@/components/CelestialBackground", () => ({
  default: () => <div data-testid="celestial-background" />,
}));

describe("PageShell performance behavior", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders content before the decorative background", () => {
    vi.stubGlobal("requestIdleCallback", vi.fn());

    render(<PageShell><main>Primary content</main></PageShell>);

    expect(screen.getByText("Primary content")).toBeInTheDocument();
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.queryByTestId("celestial-background")).not.toBeInTheDocument();
  });

  it("skips the decorative background on data saver connections", () => {
    vi.stubGlobal("requestIdleCallback", vi.fn());
    Object.defineProperty(window.navigator, "connection", {
      value: { saveData: true, effectiveType: "4g" },
      configurable: true,
    });

    render(<PageShell><main>Primary content</main></PageShell>);

    expect(screen.queryByTestId("celestial-background")).not.toBeInTheDocument();
  });

  it("loads the decorative background during idle on capable connections", async () => {
    Object.defineProperty(window.navigator, "connection", {
      value: { saveData: false, effectiveType: "4g" },
      configurable: true,
    });
    vi.stubGlobal("requestIdleCallback", (callback: IdleRequestCallback) => {
      callback({ didTimeout: false, timeRemaining: () => 10 });
      return 1;
    });
    vi.stubGlobal("cancelIdleCallback", vi.fn());

    render(<PageShell><main>Primary content</main></PageShell>);

    await waitFor(() => {
      expect(screen.getByTestId("celestial-background")).toBeInTheDocument();
    });
  });
});
