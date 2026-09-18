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

export function TopPwaBar() {
  const { locale, formatBilingual } = useLocale();
  const { country } = useCountry();

  const [os, setOs] = useState<UserOS>("windows");
  const [guide, setGuide] = useState<OsInstallGuide>(() => getOsInstallGuide("windows", "ko"));
  const [details, setDetails] = useState<DomainShortcutDetails | null>(null);
  const [hasPrompt, setHasPrompt] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect Client OS
    const detected = detectUserOS();
    setOs(detected);
    setGuide(getOsInstallGuide(detected, locale));

    // Resolve Domain Details
    const resolved = getDomainShortcutDetails({
      host: window.location.host,
      pathname: window.location.pathname,
      localeOverride: locale,
    });
    setDetails(resolved);

    // Check if session dismissed
    if (sessionStorage.getItem("lifehelp_pwa_dismissed") === "true") {
      setIsDismissed(true);
    }

    // Check prompt availability
    if (window.deferredPwaPrompt) {
      setHasPrompt(true);
    }

    const onPromptReady = () => setHasPrompt(true);
    const onInstalled = () => {
      setHasPrompt(false);
      setIsModalOpen(false);
      setIsDismissed(true);
    };

    window.addEventListener("pwa-prompt-available", onPromptReady);
    window.addEventListener("pwa-installed", onInstalled);

    return () => {
      window.removeEventListener("pwa-prompt-available", onPromptReady);
      window.removeEventListener("pwa-installed", onInstalled);
    };
  }, [locale, country]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("lifehelp_pwa_dismissed", "true");
    }
  };

  const handleActionClick = async () => {
    if (window.deferredPwaPrompt && (os === "windows" || os === "android" || os === "macos")) {
      try {
        const promptEvent = window.deferredPwaPrompt;
        promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === "accepted") {
          window.deferredPwaPrompt = null;
          setHasPrompt(false);
          setIsDismissed(true);
          return;
        }
      } catch {
        // Fall back to modal guide
      }
    }
    // Open tailored modal for iOS, iPadOS, or browsers without prompt
    setIsModalOpen(true);
  };

  const handleClassicDownload = () => {
    if (details) {
      downloadDesktopShortcut(details);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  if (isDismissed || !details) return null;

  const isKorean = locale === "ko";
  const buttonLabel = isKorean ? guide.buttonLabelKo : guide.buttonLabelEn;

  return (
    <>
      {/* Top Banner placed at the very top of every site screen */}
      <aside
        aria-label="PWA Web App Installation Banner"
        className="w-full bg-slate-950 text-white border-b border-slate-800 text-xs py-2 px-3 sm:px-4 z-40 relative shadow-xs"
      >
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-4">
          {/* Domain & Brand Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-6 h-6 shrink-0 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center">
              <Image
                src={details.iconPngUrl}
                alt={details.shortName}
                width={24}
                height={24}
                className="object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <span className="font-black text-amber-300 truncate max-w-[120px] sm:max-w-[200px]">
                {details.canonicalDomain}
              </span>
              <span className="hidden md:inline text-slate-400">·</span>
              <span className="hidden md:inline text-slate-300 truncate max-w-[320px]">
                {details.description}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button
              type="button"
              onClick={handleActionClick}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1 text-xs font-black transition cursor-pointer shadow-sm active:scale-95"
            >
              <span>{buttonLabel}</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-md transition cursor-pointer"
              title={isKorean ? "닫기" : "Close"}
              aria-label="Close banner"
            >
              ✕
            </button>
          </div>
        </div>
      </aside>

      {/* OS-tailored Interactive Installation Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
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
                  <h3 className="mt-0.5 text-base sm:text-lg font-black text-slate-950">
                    {isKorean ? guide.modalTitleKo : guide.modalTitleEn}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Target URL & Icon Preview */}
            <div className="mt-4 rounded-2xl bg-slate-50 p-3.5 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">
                  {isKorean ? "연결 대상 사이트 주소:" : "Target Website URL:"}
                </span>
                <span className="font-mono font-bold text-blue-700 text-xs sm:text-sm">
                  {details.canonicalUrl}
                </span>
              </div>
              <span className="shrink-0 droplet-pill bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 border border-slate-200">
                PWA Web App
              </span>
            </div>

            {/* Step-by-Step Installation Instructions */}
            <div className="mt-5 space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                {isKorean ? "설치 및 바로가기 생성 단계:" : "Installation Steps:"}
              </h4>
              <ol className="space-y-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
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

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col gap-2.5 pt-2">
              {hasPrompt && (
                <button
                  type="button"
                  onClick={handleActionClick}
                  className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-black text-white shadow-md hover:bg-blue-700 transition cursor-pointer"
                >
                  🚀 {isKorean ? "지금 1클릭 앱 설치하기" : "Install App Now"}
                </button>
              )}

              {os === "windows" && (
                <button
                  type="button"
                  onClick={handleClassicDownload}
                  className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition cursor-pointer"
                >
                  {downloadSuccess
                    ? (isKorean ? "✓ 바로가기 파일 다운로드 완료" : "✓ Shortcut File Downloaded")
                    : (isKorean ? "🖥️ Windows 전통 바로가기 파일 · .url 다운로드" : "Download Classic Windows .url File")}
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full rounded-2xl bg-slate-100 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
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
