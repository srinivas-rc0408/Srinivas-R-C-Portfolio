"use client";

import { useReportWebVitals } from "next/web-vitals";
import { useEffect } from "react";

export default function WebVitalsTracker() {
  useReportWebVitals((metric: any) => {
    // Determine rating based on standard thresholds
    let rating = "good";
    if (metric.name === "FCP") rating = metric.value > 3000 ? "poor" : metric.value > 1800 ? "needs-improvement" : "good";
    if (metric.name === "LCP") rating = metric.value > 4000 ? "poor" : metric.value > 2500 ? "needs-improvement" : "good";
    if (metric.name === "CLS") rating = metric.value > 0.25 ? "poor" : metric.value > 0.1 ? "needs-improvement" : "good";
    if (metric.name === "FID") rating = metric.value > 300 ? "poor" : metric.value > 100 ? "needs-improvement" : "good";
    if (metric.name === "INP") rating = metric.value > 500 ? "poor" : metric.value > 200 ? "needs-improvement" : "good";
    if (metric.name === "TTFB") rating = metric.value > 1500 ? "poor" : metric.value > 800 ? "needs-improvement" : "good";

    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating,
      delta: metric.delta,
      path: window.location.pathname,
    });

    // Use `navigator.sendBeacon` for best effort delivery
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/vitals", body);
    } else {
      fetch("/api/analytics/vitals", { body, method: "POST", keepalive: true });
    }
  });

  return null;
}
