import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import RichTextContent from "@/components/RichTextContent";

const renderToString = vi.fn((latex: string) => `<math>${latex}</math>`);

vi.mock("katex", () => ({
  default: { renderToString },
  renderToString,
}));

describe("RichTextContent", () => {
  beforeEach(() => {
    renderToString.mockClear();
  });

  it("does not import or render KaTeX when no formula is present", async () => {
    render(<RichTextContent html="<p>Plain note</p>" />);

    expect(screen.getByText("Plain note")).toBeInTheDocument();
    await Promise.resolve();
    expect(renderToString).not.toHaveBeenCalled();
  });

  it("renders formula nodes with KaTeX when present", async () => {
    render(
      <RichTextContent html={'<p>Energy <span data-latex-formula="true" data-display="inline" data-latex="E=mc^2">E=mc^2</span></p>'} />
    );

    await waitFor(() => {
      expect(renderToString).toHaveBeenCalledWith(
        "E=mc^2",
        expect.objectContaining({ displayMode: false })
      );
    });
    expect(document.querySelector("math")?.textContent).toContain("E=mc^2");
  });
});
