import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FinderPreviewPlayer from "@/components/astrophotography/FinderPreviewPlayer";

const preview = {
  id: 7,
  name: "Find Hercules",
  description: "A route to Hercules",
  targetId: "constellation-hercules",
  stepDelaySeconds: 4,
  loop: false,
  steps: [
    {
      targetId: "constellation-hercules",
      description: "Frame the keystone.",
      zoomLevel: 2,
    },
  ],
};

describe("FinderPreviewPlayer", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders embedded previews as launch buttons instead of inline maps", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => preview,
    })));

    render(<FinderPreviewPlayer previewId={preview.id} compact />);

    expect(await screen.findByRole("button", { name: /find hercules/i })).toBeInTheDocument();
    expect(document.querySelector("canvas")).not.toBeInTheDocument();
  });

  it("updates compact preview buttons when the preview prop changes", () => {
    const { rerender } = render(<FinderPreviewPlayer preview={preview} compact />);

    expect(screen.getByRole("button", { name: /find hercules/i })).toBeInTheDocument();

    rerender(
      <FinderPreviewPlayer
        preview={{
          ...preview,
          name: "Find Orion",
          steps: [{ ...preview.steps[0], targetId: "constellation-orion" }],
        }}
        compact
      />
    );

    expect(screen.getByRole("button", { name: /find orion/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /find hercules/i })).not.toBeInTheDocument();
  });
});
