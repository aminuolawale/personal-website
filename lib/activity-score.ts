export type OcsBucket = "poor" | "good" | "great";

export const OCS_BUCKET_LABELS: Record<OcsBucket, string> = {
  poor: "Poor",
  good: "Good",
  great: "Great",
};

export const OCS_BUCKET_CLASSES: Record<OcsBucket, string> = {
  poor: "border-rose-500/30 text-rose-400 bg-rose-500/5",
  good: "border-amber-400/30 text-amber-300 bg-amber-400/5",
  great: "border-emerald-400/30 text-emerald-300 bg-emerald-400/5",
};

export function getOcsBucket(ocs: number): OcsBucket {
  if (ocs < 50) return "poor";
  if (ocs < 80) return "good";
  return "great";
}

export function deriveScsFromOcs(ocs: number): number {
  return Math.max(0, Math.min(100, Math.round(100 - ocs)));
}
