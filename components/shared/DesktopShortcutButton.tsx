"use client";

import React, { useState, useEffect } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { useCountry } from "@/lib/country/CountryContext";
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
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [details, setDetails] = useState<DomainShortcutDetails>(() =>
    getDomainShortcutDetails({
      host: typeof window !== "undefined" ? window.location.host : "korea.life.help",
      pathname: typeof window !== "undefined" ? window.location.pathname : "/",
      localeOverride: locale,
    })
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
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

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleDownload = () => {
    downloadDesktopShortcut(details);
    setCopied(true);
    setTimeout(() => setCopied(false), 3500);
  };

  const handlePwaInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstallPrompt(null);
        setIsOpen(false);
      }
    }
  };

  const isKorean = locale === "ko";

  // STRICT RULE: ABSOLUTELY ZERO PARENTHESES IN KOREAN TEXT
  const buttonLabel = isKorean
    ? "🖥️ 바로가기 저장"
    : formatBilingual("🖥️ Desktop Shortcut", "🖥️ 바로가기 저장");

  return (
    <>
      {variant === "header" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`droplet-pill inline-flex items-center gap-1 border border-slate-300 bg-white/95 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-black text-slate-800 hover:bg-slate-100 hover:border-slate-400 transition cursor-pointer shadow-2xs ${className}`}
          title={isKorean ? "바탕화면에 바로가기 저장" : "Save desktop shortcut"}
        >
          <span>🖥️</span>
          <span className="hidden sm:inline">
            {isKorean ? "바탕화면 바로가기" : "Desktop Shortcut"}
          </span>
          <span className="sm:hidden">
            {isKorean ? "바로가기" : "Shortcut"}
          </span>
        </button>
      )}

      {variant === "footer" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-bold transition cursor-pointer text-xs ${className}`}
        >
          <span>🖥️</span>
          <span>{isKorean ? "바탕화면 바로가기 저장" : "Save Desktop Shortcut"}</span>
        </button>
      )}

      {variant === "card" && (
        <div
          onClick={() => setIsOpen(true)}
          className={`droplet-card p-3 border border-slate-200 bg-white/90 hover:bg-white hover:border-blue-300 transition cursor-pointer text-center ${className}`}
        >
          <span className="text-2xl mb-1 block">🖥️</span>
          <span className="text-xs sm:text-sm font-black text-slate-900 block">
            {isKorean ? "바탕화면 바로가기" : "Desktop Shortcut"}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {details.canonicalDomain}
          </span>
        </div>
      )}

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer p-1"
              title={isKorean ? "닫기" : "Close"}
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl border border-blue-200">
                🖥️
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {isKorean ? "바탕화면 바로가기 저장" : "Save Desktop Shortcut"}
                </h3>
                <p className="text-xs text-slate-500">
                  {details.canonicalDomain}
                </p>
              </div>
            </div>

            {/* Shortcut Info Card */}
            <div className="mt-4 space-y-2.5 rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block">
                  {isKorean ? "🌐 연결 도메인" : "Domain URL"}
                </span>
                <span className="font-mono font-bold text-blue-800 text-sm break-all">
                  {details.canonicalUrl}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-semibold block">
                  {isKorean ? "📝 번역된 사이트 설명" : "Site URL Description"}
                </span>
                <p className="mt-1 font-medium text-slate-800 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200/80">
                  {details.description}
                </p>
              </div>
            </div>

            {copied && (
              <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-300 p-2.5 text-center text-xs font-bold text-emerald-800">
                ✓ {isKorean ? "바로가기 파일이 다운로드되었습니다. 다운로드된 파일을 바탕화면에 두시면 즉시 접속 가능합니다." : "Shortcut file downloaded. Move it to your desktop for 1-click access."}
              </div>
            )}

            {/* Actions */}
            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full rounded-2xl bg-blue-700 hover:bg-blue-800 py-3.5 text-center text-sm font-black text-white shadow-md transition active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>📥</span>
                <span>
                  {isKorean ? "바탕화면 바로가기 파일 다운로드" : "Download Desktop Shortcut File"}
                </span>
              </button>

              {installPrompt && (
                <button
                  type="button"
                  onClick={handlePwaInstall}
                  className="w-full rounded-2xl border border-blue-300 bg-blue-50 hover:bg-blue-100 py-3 text-center text-xs sm:text-sm font-black text-blue-900 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>📲</span>
                  <span>
                    {isKorean ? "브라우저 홈 화면에 앱으로 추가" : "Add to Home Screen as App"}
                  </span>
                </button>
              )}
            </div>

            <p className="mt-3 text-[11px] text-slate-400 text-center leading-relaxed">
              {isKorean
                ? "💡 크롬·엣지 브라우저의 상단 주소창 아이콘을 바탕화면으로 드래그하셔도 바로가기가 생성됩니다."
                : "Tip: You can also drag the address bar icon to your desktop."}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
