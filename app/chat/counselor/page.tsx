"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleContext";

/** The former counselor portal was a client-side mock (generated access codes, seeded counselors). It is replaced by an honest notice. */
export default function CounselorPortalPage() {
  const { t } = useLocale();
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
      <div role="status" className="rounded-3xl border border-amber-300 bg-amber-50 p-6 sm:p-8 shadow-md">
        <h1 className="text-xl sm:text-2xl font-black text-amber-950">{t("counselorPortal.title")}</h1>
        <p className="mt-2 text-sm text-amber-900 leading-relaxed">{t("counselorPortal.desc")}</p>
        <Link href="/chat" className="mt-6 inline-block rounded-xl bg-amber-500 px-5 py-3 text-sm font-black text-slate-950 hover:bg-amber-400 transition">
          {t("counselorPortal.cta")}
        </Link>
      </div>
    </main>
  );
}
