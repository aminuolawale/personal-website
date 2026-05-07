"use client";

import { useReportWebVitals } from "next/web-vitals";
import { trackEvent } from "@/lib/observability/client";

export default function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    trackEvent({
      name: "web_vital.reported",
      attributes: {
        metric: metric.name,
        value: metric.value,
        rating: "rating" in metric ? metric.rating : undefined,
        id: metric.id,
      },
    });
  });

  return null;
}
