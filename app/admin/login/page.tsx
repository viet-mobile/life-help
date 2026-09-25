"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useLocale } from "@/lib/i18n/LocaleContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { t } = useLocale();

  const [adminId, setAdminId] = useState("");
  const [passcode, setPasscode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const response = await fetch("/api/sys/auth/session", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (active && response.ok) {
          router.replace("/admin");
          return;
        }
      } catch {
        // Not authenticated or temporarily unavailable.
      }

      if (active) {
        setCheckingSession(false);
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setErrorMsg("");
    setLoading(true);

    try {
      const response = await fetch("/api/sys/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: adminId.trim(),
          password: passcode,
        }),
      });

      if (!response.ok) {
        setErrorMsg(t("admin.loginError"));
        setPasscode("");
        setLoading(false);
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setErrorMsg(t("admin.loginError"));
      setPasscode("");
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-sm font-bold text-slate-400">
          {t("admin.loginVerifying")}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6">
      <header className="mx-auto flex w-full max-w-md items-center justify-between py-2 border-b border-slate-800/80">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-black tracking-tight text-white hover:text-blue-400 transition"
        >
          <BrandLogo portal="sys" size="md" priority />
          <span className="font-black text-white text-base sm:text-lg">HQ</span>
        </Link>
        <LanguageSwitcher />
      </header>

      <div className="mx-auto my-auto w-full max-w-md py-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-7 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-500/40 text-2xl shadow-inner">
              🛡️
            </div>

            <h1 className="text-xl font-extrabold text-white tracking-tight">
              {t("admin.loginTitle")}
            </h1>

            <p className="text-xs text-slate-400">
              {t("admin.loginDesc")}
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-rose-500/60 bg-rose-950/40 p-3 text-xs font-bold text-rose-300">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="adminId"
                className="block text-xs font-bold uppercase text-slate-300 mb-1"
              >
                {t("admin.loginAccountLabel")}
              </label>

              <input
                id="adminId"
                name="adminId"
                type="text"
                required
                autoComplete="username"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm font-medium text-white outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase text-slate-300 mb-1"
              >
                {t("admin.loginPasswordLabel")}
              </label>

              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm font-mono text-white outline-none focus:border-blue-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-3.5 text-sm font-black text-white shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 hover:brightness-105 active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer border border-blue-500/30"
            >
              <span>🔒</span>
              <span>
                {loading
                  ? t("admin.loginVerifying")
                  : t("admin.loginSubmitBtn")}
              </span>
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-400 hover:text-blue-400 transition"
            >
              ← {t("admin.loginBackHome")}
            </Link>
          </div>
        </div>
      </div>

      <footer className="mx-auto w-full max-w-md text-center text-xs text-slate-600 py-3">
        {t("admin.loginFooter")}
      </footer>
    </main>
  );
}
