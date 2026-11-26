"use client";

import Link from "next/link";
import { useLearner } from "@/components/learn/LearnerProvider";

const LABELS: Record<string, { title: string; desc: string; cta: string }> = {
  ko: {
    title: "📜 한국어 표준어 규정 전체 (56개 항)",
    desc: "국립국어원 공식 표준어 사정 원칙(26항) 및 표준 발음법(30항) 전문과 6대 언어 병기 해설을 제공합니다.",
    cta: "규정 학습하기 →",
  },
  en: {
    title: "📜 Standard Korean Norms (56 Articles)",
    desc: "Explore all 56 official articles of Standard Korean determination & pronunciation with bilingual annotations.",
    cta: "View Standards →",
  },
  vi: {
    title: "📜 Quy chuẩn tiếng Hàn tiêu chuẩn (56 điều)",
    desc: "Toàn bộ 26 điều nguyên tắc xác định và 30 điều quy tắc phát âm tiêu chuẩn với chú giải song ngữ.",
    cta: "Xem quy chuẩn →",
  },
  "zh-hant": {
    title: "📜 韓語標準語規範全文 (共56條)",
    desc: "國立國語院官方標準語審定原則(26條)及標準發音法(30條)全文與多語言對照釋義。",
    cta: "查閱規範 →",
  },
  "zh-hans": {
    title: "📜 韩语标准语规范全文 (共56条)",
    desc: "国立国语院官方标准语审定原则(26条)及标准发音法(30条)全文与多语言对照释义。",
    cta: "查阅规范 →",
  },
  ja: {
    title: "📜 韓国語標準語規定全文 (全56項)",
    desc: "国立国語院公式の標準語査定原則(26項)及び標準発音法(30項)の全文と多言語対訳解説。",
    cta: "規定を見る →",
  },
};

export function KoreanStandardsEntry() {
  const { href, locale, isBilingual, secondaryLocales } = useLearner();
  const langKey = locale.toLowerCase();
  const label = LABELS[langKey] || LABELS.en || LABELS.ko;

  const secLangKey = (secondaryLocales?.[0] || "").toLowerCase();
  const secLabel = isBilingual && secLangKey ? LABELS[secLangKey] : null;

  return (
    <Link
      href={href("/standards")}
      className="l-card l-stack border border-indigo-200 dark:border-indigo-900 bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/30 hover:border-indigo-400 dark:hover:border-indigo-700 transition shadow-2xs group"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            국립국어원 공식 규정
          </span>
          <span className="text-xs text-slate-400 font-mono">56 Articles</span>
        </div>
        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
          {label.cta}
        </span>
      </div>

      <h2 className="l-h2 text-indigo-950 dark:text-indigo-100 flex flex-col gap-1">
        <span>{label.title}</span>
        {secLabel && secLabel.title !== label.title && (
          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
            {secLabel.title}
          </span>
        )}
      </h2>

      <p className="l-muted text-xs leading-relaxed">
        <span>{label.desc}</span>
        {secLabel && secLabel.desc !== label.desc && (
          <span className="block mt-1 text-[11px] text-slate-400">
            {secLabel.desc}
          </span>
        )}
      </p>
    </Link>
  );
}
