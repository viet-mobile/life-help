"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleContext";

/** Common legal links for the public customer flows (request, chat, payment, visa): terms and privacy are always one click away. */
export function LegalLinksFooter() {
  const { t, locale } = useLocale();
  const termsLabel = t("legal.terms") || (locale === "ko" ? "이용약관" : "Terms of Service");
  const privacyLabel = t("legal.privacy") || (locale === "ko" ? "개인정보처리방침" : "Privacy Policy");

  return (
    <nav aria-label="Legal" className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
      <Link href="/terms" className="font-semibold text-slate-600 underline-offset-2 hover:text-blue-700 hover:underline">{termsLabel}</Link>
      <span aria-hidden="true"> · </span>
      <Link href="/privacy" className="font-semibold text-slate-600 underline-offset-2 hover:text-blue-700 hover:underline">{privacyLabel}</Link>
    </nav>
  );
}
