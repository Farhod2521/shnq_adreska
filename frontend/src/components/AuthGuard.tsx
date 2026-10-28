"use client";

import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { IDLE_TIMEOUT_MS, getLastActivity, getToken, isProtectedPath, logout, markActivity } from "@/lib/auth";

const subscribe = () => () => {};
const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"] as const;

/** Himoyalangan sahifalarga tokensiz kirilsa /401 ga yo'naltiradi, faoliyatsizlikda sessiyani tugatadi. */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const needsAuth = isProtectedPath(pathname);
  // Serverda token noma'lum (undefined), brauzerda esa string | null
  const token = useSyncExternalStore<string | null | undefined>(subscribe, getToken, () => undefined);

  useEffect(() => {
    if (needsAuth && token === null) window.location.replace("/401");
  }, [needsAuth, token]);

  useEffect(() => {
    if (!token) return;
    if (Date.now() - getLastActivity() > IDLE_TIMEOUT_MS) {
      void logout("idle");
      return;
    }
    let lastMark = 0;
    const onActivity = () => {
      // localStorage ga har harakatda emas, 15 soniyada bir marta yozamiz
      const now = Date.now();
      if (now - lastMark > 15_000) {
        lastMark = now;
        markActivity();
      }
    };
    const timer = window.setInterval(() => {
      if (Date.now() - getLastActivity() > IDLE_TIMEOUT_MS) void logout("idle");
    }, 30_000);
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    return () => {
      window.clearInterval(timer);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
    };
  }, [token]);

  if (needsAuth && !token) return null;
  return <>{children}</>;
}
