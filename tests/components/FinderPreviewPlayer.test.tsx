import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FinderPreviewPlayer, { finderStepDrift, finderStepRotationDeg, FRAME_ANIMATION_MS } from "@/components/astrophotography/FinderPreviewPlayer";

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

  it("uses a nonzero pan-rotate transition duration and target-based rotation", () => {
    expect(FRAME_ANIMATION_MS).toBeGreaterThanOrEqual(1000);
    expect(finderStepRotationDeg({ alt: 45, az: 135 })).toBeCloseTo(-24.3);
    expect(finderStepDrift({ alt: 45, az: 135 }).x).toBeLessThan(0);
  });
});
