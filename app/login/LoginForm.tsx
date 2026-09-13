"use client";

import Link from "next/link";
import { login, signup } from "./actions";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { navigateToMainHome } from "@/lib/navigation";

interface LoginFormProps {
  message?: string;
  error?: string;
}

export function LoginForm({ message, error }: LoginFormProps) {
  const { locale, setLocale, t, formatBilingual } = useLocale();

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Header with Language Switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8">
        <LanguageSwitcher locale={locale} onChange={setLocale} />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          href="/"
          onClick={navigateToMainHome}
          className="text-2xl font-black tracking-tight text-blue-800 hover:opacity-85 transition cursor-pointer"
        >
          LIFE.HELP
        </Link>
        <h2 className="mt-4 text-xl font-black tracking-tight text-slate-900">
          {formatBilingual(t("login.title"), "로그인 및 회원가입")}
        </h2>
        <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
          {formatBilingual(t("login.subtitle"), "이메일로 로그인하거나 계정을 생성하세요")}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl sm:px-10 border border-slate-200/80">
          <form className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-extrabold text-slate-700">
                {formatBilingual(t("login.emailLabel"), "이메일")}
              </label>
              <div className="mt-1.5">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@example.com"
                  className="block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-extrabold text-slate-700">
                {formatBilingual(t("login.passwordLabel"), "비밀번호")}
              </label>
              <div className="mt-1.5">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs font-bold text-red-700">
                ⚠️ {error}
              </div>
            )}

            {message && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-3.5 text-xs font-bold text-blue-700">
                ℹ️ {message}
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                formAction={login}
                type="submit"
                className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-black text-white bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 hover:brightness-105 active:scale-[0.98] border border-blue-500/30 transition cursor-pointer"
              >
                {formatBilingual(t("login.signInBtn"), "로그인")}
              </button>
              <button
                formAction={signup}
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 rounded-xl text-sm font-extrabold text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 border border-slate-200/90 shadow-2xs hover:shadow-xs active:scale-[0.98] transition cursor-pointer"
              >
                {formatBilingual(t("login.signUpBtn"), "회원가입")}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              onClick={navigateToMainHome}
              className="text-xs font-bold text-slate-500 hover:text-blue-700 transition"
            >
              ← {formatBilingual(t("login.backHome"), "홈으로 돌아가기")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

