"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminLogin, isAdminLoggedIn } from "@/lib/auth/adminAuth";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useLocale } from "@/lib/i18n/LocaleContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { t } = useLocale();

  const [email, setEmail] = useState("sys@life.help");
  const [passcode, setPasscode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // If already authenticated, forward to /admin
  useEffect(() => {
    if (isAdminLoggedIn()) {
      router.replace("/admin");
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const success = adminLogin(passcode, email);
    if (success) {
      router.push("/admin");
    } else {
      setErrorMsg(t("admin.loginError"));
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail("sys@life.help");
    setPasscode("admin1234");
    setErrorMsg("");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-md items-center justify-between py-2 border-b border-slate-800/80">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-black tracking-tight text-white hover:text-blue-400 transition"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-black text-white shadow-xs">
            HQ
          </span>
          <span>LIFE.HELP HQ</span>
        </Link>
        <LanguageSwitcher />
      </header>

      {/* Center Auth Card */}
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
            <div className="rounded-xl border border-rose-500/60 bg-rose-950/40 p-3 text-xs font-bold text-rose-300 animate-fade-in">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                {t("admin.loginAccountLabel")}
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sys@life.help"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm font-medium text-white outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                {t("admin.loginPasswordLabel")}
              </label>
              <input
                type="password"
                required
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
              <span>{loading ? t("admin.loginVerifying") : t("admin.loginSubmitBtn")}</span>
            </button>
          </form>

          {/* Quick Test Credential Filler */}
          <div className="border-t border-slate-800 pt-4 text-center">
            <button
              type="button"
              onClick={handleQuickFill}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white shadow-2xs active:scale-[0.98] transition cursor-pointer"
            >
              <span>⚡</span>
              <span>{t("admin.loginQuickFill")}</span>
            </button>
            <p className="mt-2 text-[11px] text-slate-500 font-mono">
              {t("admin.loginTestHint")}
            </p>
          </div>

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

      {/* Footer */}
      <footer className="mx-auto w-full max-w-md text-center text-xs text-slate-600 py-3">
        {t("admin.loginFooter")}
      </footer>
    </main>
  );
}
