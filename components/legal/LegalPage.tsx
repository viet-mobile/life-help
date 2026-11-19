"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { languages } from "@/messages/registry";
import { LegalDocument } from "./LegalDocument";
import type { LegalKind } from "@/lib/legal/documents";
import "./legal.css";

/** Standalone page shell: provides language selection across all 89 platform languages, with Korean as the governing legal original. */
export function LegalPage({
  kind,
  primary = "ko",
  home = "/",
  other,
}: {
  kind: LegalKind;
  primary?: string;
  home?: string;
  other: { href: string; label: string };
}) {
  const { locale: currentLocale } = useLocale();
  const [selectedLang, setSelectedLang] = useState<string>(primary || currentLocale || "ko");

  useEffect(() => {
    if (currentLocale && currentLocale !== "ko" && currentLocale !== "en") {
      setSelectedLang(currentLocale);
    }
  }, [currentLocale]);

  // Order of display: Selected language first, followed by Korean governing text, then English reference
  const langs =
    selectedLang === "ko"
      ? ["ko", "en"]
      : selectedLang === "en"
      ? ["en", "ko"]
      : [selectedLang, "ko", "en"];

  const getLangName = (code: string) => {
    const meta = languages.find((l) => l.code === code);
    return meta ? meta.nativeName || meta.name : code.toUpperCase();
  };

  return (
    <main className="min-h-screen bg-white text-slate-800">
      <nav className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 pt-5 pb-3 text-sm font-bold border-b border-slate-100">
        <Link href={home} className="text-blue-700 hover:underline">
          ← LIFE.HELP
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <span aria-hidden="true">🌐</span>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-xs focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              {languages.map((meta) => (
                <option key={meta.code} value={meta.code}>
                  {meta.nativeName} ({meta.name})
                </option>
              ))}
            </select>
          </label>
          <span className="flex items-center gap-2 text-xs">
            {langs.map((l) => (
              <a
                key={l}
                href={`#${kind}-${l}`}
                className="rounded-md bg-slate-100 px-2 py-1 text-slate-700 hover:bg-slate-200 hover:underline"
              >
                {getLangName(l)}
              </a>
            ))}
          </span>
          <Link href={other.href} className="text-xs font-bold text-blue-700 hover:underline">
            {other.label}
          </Link>
        </div>
      </nav>

      {/* Governing Law Disclaimer */}
      <div className="mx-auto max-w-4xl px-4 pt-3">
        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-900 leading-relaxed">
          ⚖️ <strong>대한민국 준거법 안내 · Governing Law:</strong> 본 약관 및 방침은 이용자의 편의를 위해 다국어로 번역되어 제공됩니다. 대한민국 법령에 따른 법적 해석 및 분쟁 시에는 <strong>한국어 원문(Korean original)</strong>이 우선합니다.
        </div>
      </div>

      <LegalDocument kind={kind} langs={langs} />
    </main>
  );
}
