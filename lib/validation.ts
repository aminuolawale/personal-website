export function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
