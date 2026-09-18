"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const SESSION_KEY = "sajivo-analytics-session";
let memorySession: string | undefined;

function sessionId() {
  if (memorySession) return memorySession;
  try {
    const stored = window.sessionStorage.getItem(SESSION_KEY);
    memorySession = stored && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(stored) ? stored : crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, memorySession);
  } catch {
    memorySession ??= crypto.randomUUID();
  }
  return memorySession;
}

function record(eventName: "page_view" | "ui_click", path: string, metadata: Record<string, string | number | boolean | null> = {}) {
  try {
    const payload = JSON.stringify({ sessionId: sessionId(), eventName, path, referrerHost: document.referrer ? new URL(document.referrer).host : null, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight, metadata });
    if (navigator.sendBeacon?.("/api/v2/analytics/events", new Blob([payload], { type: "application/json" }))) return;
    void fetch("/api/v2/analytics/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
  } catch {
    // Analytics must not interrupt navigation when browser storage/network is blocked.
  }
}

export function ProductAnalytics() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);
  useEffect(() => {
    if (!pathname || lastPath.current === pathname) return;
    lastPath.current = pathname;
    record("page_view", pathname);
  }, [pathname]);
  useEffect(() => {
    function click(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest("button,a,[role='button']") : null;
      if (!target || !event.isTrusted) return;
      // Keyboard activation has no pointer location and must not heat the top-left cell.
      const position: Record<string, number> = event.detail > 0 ? { x_pct: Number(Math.min(1, Math.max(0, event.clientX / Math.max(1, window.innerWidth))).toFixed(3)), y_pct: Number(Math.min(1, Math.max(0, event.clientY / Math.max(1, window.innerHeight))).toFixed(3)) } : {};
      record("ui_click", window.location.pathname, { ...position, element: target.tagName.toLowerCase(), role: target.getAttribute("role") || null });
    }
    document.addEventListener("click", click, { passive: true });
    return () => document.removeEventListener("click", click);
  }, []);
  return null;
}
