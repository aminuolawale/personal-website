export const TELEMETRY_EVENTS = [
  "public.page_view",
  "public.reader.opened",
  "public.writing_tab.changed",
  "public.reading_notes.book_selected",
  "public.misc_tab.changed",
  "public.misc_series.changed",
  "public.sky_map.loaded",
  "public.sky_map.target_selected",
  "public.astro_session.opened",
  "public.gear.opened",
  "admin.article.created",
  "admin.article.updated",
  "admin.article.deleted",
  "admin.misc_tab.created",
  "admin.misc_tab.updated",
  "admin.misc_tab.deleted",
  "admin.misc_series.created",
  "admin.misc_series.updated",
  "admin.misc_series.deleted",
  "admin.astro_session.created",
  "admin.astro_session.deleted",
  "web_vital.reported",
] as const;

export type TelemetryEventName = (typeof TELEMETRY_EVENTS)[number];

export type TelemetryAttributes = Record<string, string | number | boolean | null | undefined>;

export interface TelemetryEvent {
  name: TelemetryEventName;
  route?: string;
  section?: string;
  targetType?: string;
  targetId?: string | number;
  attributes?: TelemetryAttributes;
}

export function isTelemetryEventName(value: unknown): value is TelemetryEventName {
  return typeof value === "string" && TELEMETRY_EVENTS.includes(value as TelemetryEventName);
}

export function sanitizeAttributes(attributes: unknown): TelemetryAttributes {
  if (!attributes || typeof attributes !== "object") return {};

  return Object.fromEntries(
    Object.entries(attributes as Record<string, unknown>)
      .filter(([, value]) => (
        value === null ||
        value === undefined ||
        ["string", "number", "boolean"].includes(typeof value)
      ))
      .slice(0, 25)
  ) as TelemetryAttributes;
}
