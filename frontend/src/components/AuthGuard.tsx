"use client";

import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { getToken, isProtectedPath } from "@/lib/auth";

const subscribe = () => () => {};

/** Himoyalangan sahifalarga tokensiz kirilsa /401 ga yo'naltiradi. */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const needsAuth = isProtectedPath(pathname);
  // Serverda token noma'lum (undefined), brauzerda esa string | null
  const token = useSyncExternalStore<string | null | undefined>(subscribe, getToken, () => undefined);

  useEffect(() => {
    if (needsAuth && token === null) window.location.replace("/401");
  }, [needsAuth, token]);

  if (needsAuth && !token) return null;
  return <>{children}</>;
}
