"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { useCountry } from "@/lib/country/CountryContext";
import {
  detectUserOS,
  getOsInstallGuide,
  type UserOS,
  type OsInstallGuide,
} from "@/lib/pwa/pwaHelper";
import {
  getDomainShortcutDetails,
  downloadDesktopShortcut,
  type DomainShortcutDetails,
} from "@/lib/shortcut/desktopShortcut";

interface DesktopShortcutButtonProps {
  variant?: "header" | "footer" | "card" | "banner";
  portal?: "tech" | "chat" | "sys" | "customer";
  className?: string;
}

export function DesktopShortcutButton({
  variant = "header",
  portal,
  className = "",
}: DesktopShortcutButtonProps) {
  const { locale, formatBilingual } = useLocale();
  const { country } = useCountry();

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [os, setOs] = useState<UserOS>("windows");
  const [guide, setGuide] = useState<OsInstallGuide>(() => getOsInstallGuide("windows", "ko"));
  const [details, setDetails] = useState<DomainShortcutDetails>(() =>
    getDomainShortcutDetails({
      host: typeof window !== "undefined" ? window.location.host : "korea.life.help",
      pathname: typeof window !== "undefined" ? window.location.pathname : "/",
      localeOverride: locale,
    })
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const detected = detectUserOS();
      setOs(detected);
      setGuide(getOsInstallGuide(detected, locale));

      const searchParams = new URLSearchParams(window.location.search);
      if (portal) {
        searchParams.set("portal", portal);
      }
      if (country && country !== "default") {
        searchParams.set("country", country);
      }
      const resolved = getDomainShortcutDetails({
        host: window.location.host,
        pathname: window.location.pathname,
        localeOverride: locale,
        searchParams,
      });
      setDetails(resolved);
    }
  }, [locale, country, portal]);

  const handleDownload = () => {
    downloadDesktopShortcut(details);
    setCopied(true);
    setTimeout(() => setCopied(false), 3500);
  };

  const handlePwaInstall = async () => {
    if (typeof window !== "undefined" && window.deferredPwaPrompt) {
      try {
        const promptEvent = window.deferredPwaPrompt;
        promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === "accepted") {
          window.deferredPwaPrompt = null;
          setIsOpen(false);
          return;
        }
      } catch {
        // Continue
      }
    }
    setIsOpen(true);
  };

  const isKorean = locale === "ko";
  const buttonLabel = isKorean
    ? guide.buttonLabelKo
    : formatBilingual(guide.buttonLabelEn, guide.buttonLabelKo);

  const hasPwaPrompt = typeof window !== "undefined" && !!window.deferredPwaPrompt;

  return (
    <>
      {/* Header variant disabled in favor of TopPwaBar at the top */}

      {variant === "footer" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold transition cursor-pointer text-xs ${className}`}
        >
          <span>{os === "ios" || os === "ipados" || os === "android" ? "📱" : "🖥️"}</span>
          <span>{buttonLabel}</span>
        </button>
      )}

      {variant === "card" && (
        <div
          onClick={() => setIsOpen(true)}
          className={`droplet-card p-3 border border-slate-200 bg-white/90 hover:bg-white hover:border-blue-300 transition cursor-pointer text-center ${className}`}
        >
          <span className="text-2xl mb-1 block">
            {os === "ios" || os === "ipados" || os === "android" ? "📱" : "🖥️"}
          </span>
          <span className="text-xs sm:text-sm font-black text-slate-900 block">
            {buttonLabel}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {details.canonicalDomain}
          </span>
        </div>
      )}

      {/* Modal Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-fadeIn"
        >
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl max-h-[92vh] overflow-y-auto text-slate-900">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer p-1 rounded-full transition"
              title={isKorean ? "닫기" : "Close"}
            >
              ✕
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="relative w-12 h-12 shrink-0 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center shadow-xs">
                <Image
                  src={details.iconPngUrl}
                  alt={details.shortName}
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-800">
                    {guide.osDisplayName}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {details.canonicalDomain}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-950 mt-0.5">
                  {isKorean ? guide.modalTitleKo : guide.modalTitleEn}
                </h3>
              </div>
            </div>

            {/* Target URL & Icon Preview */}
            <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 font-bold block text-[11px]">
                  {isKorean ? "연결 대상 도메인 주소:" : "Target Domain URL:"}
                </span>
                <span className="font-mono font-bold text-blue-800 text-sm break-all">
                  {details.canonicalUrl}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-bold block text-[11px]">
                  {isKorean ? "설명:" : "Description:"}
                </span>
                <p className="mt-1 font-medium text-slate-800 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200/80">
                  {details.description}
                </p>
              </div>
            </div>

            {copied && (
              <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-300 p-2.5 text-center text-xs font-bold text-emerald-800">
                ✓ {isKorean ? "바로가기 파일이 다운로드 폴더에 안전하게 저장되었습니다." : "Shortcut file downloaded safely."}
              </div>
            )}

            {/* Step-by-Step Installation Instructions */}
            <div className="mt-5 space-y-2.5">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                {isKorean ? "운영체제별 바로가기 추가 절차:" : "Installation Instructions:"}
              </h4>
              <ol className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {(isKorean ? guide.stepsKo : guide.stepsEn).map((step, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-2.5 border border-slate-100"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-black text-white">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-2.5">
              {hasPwaPrompt && (
                <button
                  type="button"
                  onClick={handlePwaInstall}
                  className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-black text-white shadow-md transition cursor-pointer"
                >
                  🚀 {isKorean ? "지금 1클릭 앱 설치하기" : "Install App Now"}
                </button>
              )}

              {os === "windows" && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 py-2.5 text-xs font-bold text-slate-800 transition cursor-pointer"
                >
                  🖥️ {isKorean ? "Windows 전통 바로가기 파일 · .url 다운로드" : "Download Classic Windows .url File"}
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full rounded-2xl bg-slate-100 hover:bg-slate-200 py-2.5 text-xs font-bold text-slate-600 transition cursor-pointer"
              >
                {isKorean ? "닫기" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
