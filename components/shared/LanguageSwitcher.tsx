"use client";
import type { Locale } from "@/messages";
export function LanguageSwitcher({
  locale,
  onChange,
}: {
  locale: Locale;
  onChange: (locale: Locale) => void;
}) {
  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1" aria-label="Language">
      <button
        onClick={() => onChange("vi")}
        className={`rounded-lg px-3 py-2 text-sm font-bold ${locale === "vi" ? "bg-white text-blue-800 shadow-sm" : "text-slate-500"}`}
      >
        Tiếng Việt
      </button>
      <button
        onClick={() => onChange("ko")}
        className={`rounded-lg px-3 py-2 text-sm font-bold ${locale === "ko" ? "bg-white text-blue-800 shadow-sm" : "text-slate-500"}`}
      >
        한국어
      </button>
    </div>
  );
}
