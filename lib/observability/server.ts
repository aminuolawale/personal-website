import * as Sentry from "@sentry/nextjs";
import type { TelemetryEvent } from "@/lib/observability/events";
import { sanitizeAttributes } from "@/lib/observability/events";

export function logTelemetryEvent(event: TelemetryEvent) {
  const attributes = {
    route: event.route,
    section: event.section,
    target_type: event.targetType,
    target_id: event.targetId,
    ...sanitizeAttributes(event.attributes),
  };

  Sentry.logger.info(event.name, attributes);
  Sentry.addBreadcrumb({
    category: "telemetry",
    message: event.name,
    level: "info",
    data: attributes,
  });
}

export function captureTelemetryError(error: unknown, event: string, attributes?: Record<string, unknown>) {
  Sentry.captureException(error, {
    tags: { telemetry_event: event },
    extra: sanitizeAttributes(attributes),
  });
}
