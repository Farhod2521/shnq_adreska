export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://192.168.20.104:8000/api";

const TOKEN_KEY = "shnq_auth_token";
const USER_KEY = "shnq_auth_user";

export type AuthUser = {
  id: number;
  username: string;
  full_name: string;
  is_staff: boolean;
  is_superuser: boolean;
};

// Himoyalangan sahifalar: token bo'lmasa /401 ga yo'naltiriladi
export const PROTECTED_PATHS = ["/dashboard", "/hujjatlar", "/hisobotlar", "/baza_xlsx", "/sozlamalar"];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function safeGet(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return safeGet(localStorage, TOKEN_KEY) ?? safeGet(sessionStorage, TOKEN_KEY);
}

export function getUserRaw(): string | null {
  if (typeof window === "undefined") return null;
  return safeGet(localStorage, USER_KEY) ?? safeGet(sessionStorage, USER_KEY);
}

export function parseUser(raw: string | null): AuthUser | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveAuth(token: string, user: AuthUser, remember: boolean) {
  clearAuth();
  // "Meni eslab qol" belgilansa localStorage, aks holda brauzer yopilguncha sessionStorage
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  for (const storage of [localStorage, sessionStorage]) {
    try {
      storage.removeItem(TOKEN_KEY);
      storage.removeItem(USER_KEY);
    } catch {
      // storage mavjud emas
    }
  }
}

function redirectTo(path: string) {
  if (typeof window !== "undefined" && window.location.pathname !== path) {
    window.location.replace(path);
  }
}

/** Token qo'shib API'ga so'rov yuboradi. 401 -> /401, 403 -> /403 sahifasiga yo'naltiradi. */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Token ${token}`);

  const response = await fetch(input, { ...init, headers });

  if (response.status === 401) {
    clearAuth();
    redirectTo("/401");
  } else if (response.status === 403) {
    redirectTo("/403");
  }
  return response;
}

export async function logout() {
  try {
    await apiFetch(`${API_BASE_URL}/auth/logout/`, { method: "POST" });
  } catch {
    // tarmoq xatosi bo'lsa ham lokal tokenni o'chiramiz
  }
  clearAuth();
  window.location.replace("/login");
}
