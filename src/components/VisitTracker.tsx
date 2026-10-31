"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Counts a visit for the public pages. It stores nothing about the person: only a "last visit day"
// and a "has visited before" flag in the browser itself, and sends anonymous totals.
export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/presentation") || pathname.startsWith("/api")) return;

    let visitor = false;
    let newEver = false;

    try {
      const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
      const lastDay = window.localStorage.getItem("ccc_last_visit_day");
      const seenBefore = window.localStorage.getItem("ccc_seen_before") === "1";

      visitor = lastDay !== today;
      newEver = visitor && !seenBefore;

      window.localStorage.setItem("ccc_last_visit_day", today);
      window.localStorage.setItem("ccc_seen_before", "1");
    } catch {
      // Storage is blocked (for example private browsing): count the page view only.
    }

    const body = JSON.stringify({
      path: pathname,
      visitor,
      newEver,
      mobile: window.matchMedia("(max-width: 767px)").matches,
    });

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
      } else {
        fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
      }
    } catch {
      // Counting is best-effort and must never affect the page.
    }
  }, [pathname]);

  return null;
}
