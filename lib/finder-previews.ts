import { getSkyTargetById } from "@/lib/sky-targets";

export interface FinderPreviewStep {
  targetId: string;
  description: string;
  zoomLevel?: number;
}

export interface FinderPreviewPayload {
  name: string;
  description: string;
  targetId: string;
  stepDelaySeconds: number;
  loop: boolean;
  steps: FinderPreviewStep[];
}

export function parseFinderSteps(value: string | null): FinderPreviewStep[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((step) => {
      if (!step || typeof step !== "object") return [];
      const targetId = typeof step.targetId === "string" ? step.targetId : "";
      const description = typeof step.description === "string" ? step.description.trim() : "";
      const zoomLevel = Number(step.zoomLevel);
      return targetId && getSkyTargetById(targetId)
        ? [{
            targetId,
            description,
            ...(Number.isFinite(zoomLevel) ? { zoomLevel: Math.max(0.65, Math.min(8, zoomLevel)) } : {}),
          }]
        : [];
    });
  } catch {
    return [];
  }
}

export function normalizeFinderPayload(body: Record<string, unknown>): FinderPreviewPayload | { error: string } {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const targetId = typeof body.targetId === "string" ? body.targetId : "";
  const stepDelaySeconds = Number(body.stepDelaySeconds ?? 4);
  const loop = body.loop === true;
  const stepsInput = Array.isArray(body.steps) ? body.steps : [];

  if (!name) return { error: "Name is required" };
  if (!getSkyTargetById(targetId)) return { error: "A valid target is required" };
  if (!Number.isFinite(stepDelaySeconds) || stepDelaySeconds < 1 || stepDelaySeconds > 60) {
    return { error: "Step duration must be between 1 and 60 seconds" };
  }

  const steps = stepsInput.flatMap((step): FinderPreviewStep[] => {
    if (!step || typeof step !== "object") return [];
    const raw = step as Record<string, unknown>;
    const stepTargetId = typeof raw.targetId === "string" ? raw.targetId : "";
    const stepDescription = typeof raw.description === "string" ? raw.description.trim() : "";
    const zoomLevel = Number(raw.zoomLevel ?? 2.2);
    if (!Number.isFinite(zoomLevel) || zoomLevel < 0.65 || zoomLevel > 8) return [];
    return stepTargetId && getSkyTargetById(stepTargetId)
      ? [{ targetId: stepTargetId, description: stepDescription, zoomLevel }]
      : [];
  });

  if (steps.length === 0) return { error: "At least one valid step is required" };

  return { name, description, targetId, stepDelaySeconds, loop, steps };
}
