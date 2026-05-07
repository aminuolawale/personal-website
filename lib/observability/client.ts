"use client";

import type { TelemetryEvent } from "@/lib/observability/events";

const ENDPOINT = "/api/telemetry/events";

export function trackEvent(event: TelemetryEvent) {
  if (process.env.NODE_ENV !== "production") return;
  if (typeof window === "undefined") return;

  const payload = JSON.stringify({
    ...event,
    route: event.route || window.location.pathname,
    timestamp: new Date().toISOString(),
  });

  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: "application/json" }));
    if (sent) return;
  }

  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}
