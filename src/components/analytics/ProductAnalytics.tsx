"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SESSION_KEY = "sajivo-analytics-session";

function sessionId() {
  let value = window.sessionStorage.getItem(SESSION_KEY);
  if (!value) { value = crypto.randomUUID(); window.sessionStorage.setItem(SESSION_KEY, value); }
  return value;
}

function record(eventName: "page_view" | "ui_click", path: string, metadata: Record<string, string | number | boolean | null> = {}) {
  const payload = JSON.stringify({ sessionId: sessionId(), eventName, path, referrerHost: document.referrer ? new URL(document.referrer).host : null, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight, metadata });
  if (navigator.sendBeacon) navigator.sendBeacon("/api/v2/analytics/events", new Blob([payload], { type: "application/json" }));
  else void fetch("/api/v2/analytics/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true });
}

export function ProductAnalytics() {
  const pathname = usePathname();
  useEffect(() => { record("page_view", pathname); }, [pathname]);
  useEffect(() => {
    function click(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest("button,a,[role='button']") : null;
      if (!target) return;
      record("ui_click", window.location.pathname, { x_pct: Number((event.clientX / Math.max(1, window.innerWidth)).toFixed(3)), y_pct: Number((event.clientY / Math.max(1, window.innerHeight)).toFixed(3)), element: target.tagName.toLowerCase(), role: target.getAttribute("role") || null });
    }
    document.addEventListener("click", click, { passive: true });
    return () => document.removeEventListener("click", click);
  }, []);
  return null;
}
