"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { API_BASE_URL, AuthUser, getToken, saveAuth } from "@/lib/auth";

type LoginResponse = {
  token?: string;
  user?: AuthUser;
  detail?: string;
  code?: string;
  mfa_required?: boolean;
  mfa_ticket?: string;
  mfa_setup?: boolean;
  secret?: string;
  qr_svg?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // 2-bosqich (MFA) holati
  const [mfaTicket, setMfaTicket] = useState("");
  const [mfaSetup, setMfaSetup] = useState<{ secret: string; qr_svg: string } | null>(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    if (getToken()) {
      router.replace("/dashboard");
    } else if (new URLSearchParams(window.location.search).get("sabab") === "idle") {
      setError("Faoliyatsizlik sababli sessiya yakunlandi. Qaytadan kiring.");
    }
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Login va parolni kiriting.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = (await response.json().catch(() => ({}))) as LoginResponse;
      if (!response.ok) {
        setError(data.detail ?? "Login yoki parol noto'g'ri.");
        return;
      }
      if (data.mfa_required && data.mfa_ticket) {
        setPassword("");
        setMfaTicket(data.mfa_ticket);
        setMfaSetup(data.mfa_setup && data.secret && data.qr_svg ? { secret: data.secret, qr_svg: data.qr_svg } : null);
        return;
      }
      if (!data.token || !data.user) {
        setError(data.detail ?? "Login yoki parol noto'g'ri.");
        return;
      }
      saveAuth(data.token, data.user, remember);
      router.replace("/dashboard");
    } catch {
      setError("Server bilan bog'lanib bo'lmadi. Keyinroq urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetToPasswordStep = () => {
    setMfaTicket("");
    setMfaSetup(null);
    setCode("");
  };

  const handleMfaSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Ilovadagi 6 xonali kodni kiriting.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/mfa/verify/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mfa_ticket: mfaTicket, code: code.trim() }),
      });
      const data = (await response.json().catch(() => ({}))) as LoginResponse;
      if (!response.ok || !data.token || !data.user) {
        setCode("");
        setError(data.detail ?? "Tasdiqlash kodi noto'g'ri.");
        if (data.code === "ticket_expired" || data.code === "locked") resetToPasswordStep();
        return;
      }
      saveAuth(data.token, data.user, remember);
      router.replace("/dashboard");
    } catch {
      setError("Server bilan bog'lanib bo'lmadi. Keyinroq urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-light p-4 font-sans text-slate-900">
      <div className="flex w-full max-w-[440px] flex-col items-center">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-white shadow-lg">
            <span
              className="material-symbols-outlined text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              architecture
            </span>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-primary uppercase">Qurilish tizimi</h1>
            <p className="text-sm font-medium text-slate-500">
              Qurilish reglamentlari boshqaruvi
            </p>
          </div>
        </div>

        <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="relative flex h-32 w-full items-center justify-center overflow-hidden bg-primary/10">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
            <div
              className="h-full w-full bg-cover bg-center bg-no-repeat opacity-20"
              data-alt="Qurilish chizmalari va me'moriy fon rasmi"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAPF19YokPO2WHtYkqGFvsyCl9TLY4rb-_FWB2fI4JH1IDaUWxO4ufMdH-oCZ1Zp1NRwTgS6OGma_Jw-DzjK55sYH6ycMj6DPEuyaiTb4bwM501QbIFc4iCHPejubYybu5udvfhLP7FUYq8rZUkdrqoAnwkQ6LervELYAAIjNu1az3sBkucUHLa189eBi-IPJuOH7G3pNSNjmAMrL1Ei4VptJ7cZpqQkRLmL96RiqGO78_nqCLVXoXhaQ5fZzIyyP59sHfSNNZPoc4")',
              }}
            />
            <span className="material-symbols-outlined absolute text-5xl text-primary opacity-30">
              gavel
            </span>
          </div>

          <div className="p-8">
            <h2 className="mb-1 text-center text-2xl font-bold text-slate-900">
              Tizimga kirish
            </h2>
            <p className="mb-8 text-center text-sm text-slate-500">
              Ma&apos;lumotlaringizni kiriting
            </p>

            {mfaTicket ? (
            <form className="space-y-5" onSubmit={handleMfaSubmit} noValidate>
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <span className="material-symbols-outlined text-[20px]">error</span>
                  <span>{error}</span>
                </div>
              )}

              {mfaSetup ? (
                <div className="space-y-3 text-sm text-slate-600">
                  <p>
                    Ikki bosqichli autentifikatsiyani sozlang: telefoningizdagi Google Authenticator yoki
                    Microsoft Authenticator ilovasida QR-kodni skanerlang.
                  </p>
                  <div
                    className="mx-auto w-48 rounded-lg border border-slate-200 bg-white p-2 [&_svg]:h-auto [&_svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: mfaSetup.qr_svg }}
                  />
                  <p className="text-center text-xs">
                    Yoki kalitni qo&apos;lda kiriting:
                    <br />
                    <code className="font-mono text-sm break-all text-slate-900 select-all">{mfaSetup.secret}</code>
                  </p>
                </div>
              ) : (
                <p className="text-center text-sm text-slate-600">
                  Autentifikator ilovasidagi 6 xonali tasdiqlash kodini kiriting.
                </p>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="ml-1 text-sm font-semibold text-slate-700">Tasdiqlash kodi</label>
                <div className="group relative">
                  <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-slate-400 transition-colors group-focus-within:text-primary">
                    verified_user
                  </span>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pr-4 pl-10 font-mono tracking-[0.4em] text-slate-900 outline-none transition-all placeholder:tracking-normal placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="000000"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="group flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 font-bold text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span>{submitting ? "Tekshirilmoqda..." : "Tasdiqlash"}</span>
                <span className="material-symbols-outlined text-lg">verified</span>
              </button>
              <button
                type="button"
                className="w-full text-sm text-slate-500 transition-colors hover:text-primary"
                onClick={() => {
                  setError("");
                  resetToPasswordStep();
                }}
              >
                Orqaga
              </button>
            </form>
            ) : (
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <span className="material-symbols-outlined text-[20px]">error</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="ml-1 text-sm font-semibold text-slate-700">Foydalanuvchi</label>
                <div className="group relative">
                  <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-slate-400 transition-colors group-focus-within:text-primary">
                    person
                  </span>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pr-4 pl-10 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Foydalanuvchi nomi"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between px-1">
                  <label className="text-sm font-semibold text-slate-700">Parol</label>
                </div>
                <div className="group relative">
                  <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-slate-400 transition-colors group-focus-within:text-primary">
                    lock
                  </span>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pr-12 pl-10 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Parolingiz"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                    type="button"
                    aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center px-1">
                <input
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 bg-slate-100 text-primary focus:ring-2 focus:ring-primary"
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <label className="ml-2 cursor-pointer text-sm text-slate-600" htmlFor="remember">
                  Meni eslab qol
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="group flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 font-bold text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span>{submitting ? "Tekshirilmoqda..." : "Kirish"}</span>
                <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">
                  login
                </span>
              </button>
            </form>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            (c) 2024 Qurilish Vazirligi. Barcha huquqlar himoyalangan.
          </p>
          <div className="mt-2 flex justify-center gap-4">
            <a className="text-xs text-slate-400 transition-colors hover:text-primary" href="#">
              Yordam
            </a>
            <a className="text-xs text-slate-400 transition-colors hover:text-primary" href="#">
              Maxfiylik siyosati
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
