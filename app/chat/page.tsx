"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useChat } from "@/lib/chat/ChatContext";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { useRegion } from "@/lib/region/RegionContext";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { languages, type Locale } from "@/messages";
import { navigateToMainHome } from "@/lib/navigation";
import { formatCounselorName } from "@/lib/chat/counselorFormat";

export default function CustomerChatPage() {
  const { locale, setLocale, currentMeta, t, tKo, formatBilingual, isBilingual } = useLocale();
  const isKorean = locale === "ko";
  const { formattedRegion, shortRegionText, openModal } = useRegion();
  const {
    getDutyCounselorsByLocale,
    activeDutyCounselors,
    createChatSession,
    sendMessage,
    closeSession,
    sessions,
  } = useChat();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [consultationLocale, setConsultationLocale] = useState<Locale>(locale);
  const [isCustomConsultationLocale, setIsCustomConsultationLocale] = useState(false);
  const [initialInquiry, setInitialInquiry] = useState("");
  const [messageInput, setMessageInput] = useState("");

  // Sync consultation language if user hasn't explicitly customized it
  useEffect(() => {
    if (!isCustomConsultationLocale) {
      setConsultationLocale(locale);
    }
  }, [locale, isCustomConsultationLocale]);

  const consultationMeta =
    languages.find((l) => l.code === consultationLocale) || currentMeta;
  const dutyCounselorsForLocale = getDutyCounselorsByLocale(consultationLocale);
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const sessionLangMeta = activeSession
    ? languages.find((l) => l.code === activeSession.customerLocale) || currentMeta
    : currentMeta;

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = customerName.trim() || `고객 (${consultationMeta.nativeName})`;
    const sessionId = createChatSession(
      consultationLocale,
      finalName,
      initialInquiry.trim() || undefined,
    );
    setActiveSessionId(sessionId);
    setInitialInquiry("");
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeSessionId || !activeSession) return;
    sendMessage(activeSessionId, "customer", activeSession.customerName, messageInput);
    setMessageInput("");
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-1.5 px-3 py-2 sm:gap-4 sm:px-4 sm:py-3.5">
          <div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0">
            <Link
              href="/"
              onClick={navigateToMainHome}
              className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-xl font-extrabold text-blue-800 hover:opacity-80 transition cursor-pointer shrink-0"
              title={formatBilingual("Go to LIFE.HELP Home", "LIFE.HELP 메인 홈으로 이동")}
            >
              <BrandLogo size="md" priority />
              <span className="rounded-md bg-blue-100 text-blue-800 px-1.5 py-0.5 text-[10px] sm:text-xs font-black shrink-0">CHAT</span>
            </Link>
            <button
              type="button"
              onClick={openModal}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-blue-50 shrink-0"
            >
              <span>📍 {shortRegionText}</span>
              <span className="text-[10px] text-slate-400">▾</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link
              href="/chat/counselor"
              className="rounded-xl border border-indigo-200 bg-indigo-50 px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shrink-0"
            >
              <span className="sm:hidden">🎧 {t("chat.counselor") || "상담원"}</span>
              <span className="hidden sm:inline">🎧 {formatBilingual(t("chat.counselorPortal"), "상담원 포털")}</span>
            </Link>
            <LanguageSwitcher locale={locale} onChange={setLocale} />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {/* Banner with Real-Time Duty Counselor Info */}
        <div className="mb-6 rounded-2xl bg-linear-to-r from-blue-700 via-indigo-700 to-blue-800 p-5 text-white shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold tracking-wide">
                <span>🌐 {formatBilingual(t("chat.tag"), "실시간 모국어 상담")}</span>
                <span className="text-blue-200">|</span>
                <span>{consultationMeta.nativeName} ({consultationMeta.name})</span>
                {consultationLocale !== locale && (
                  <span className="rounded-full bg-blue-900/60 border border-blue-300/40 px-2 py-0.5 text-[10px] text-blue-100 font-semibold">
                    {t("chat.screenLabel")}{currentMeta.nativeName}
                  </span>
                )}
              </div>
              <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
                {isBilingual ? (
                  <>
                    <span>{t("chat.title")}</span>
                    <span className="block mt-1 text-xl font-bold text-blue-200">
                      {tKo("chat.title")}
                    </span>
                  </>
                ) : (
                  <span>{isKorean ? tKo("chat.title") : t("chat.title")}</span>
                )}
              </h1>
              <div className="mt-1 text-sm text-blue-100">
                <p>{t("chat.desc")}</p>
                {isBilingual && (
                  <p className="mt-0.5 text-xs text-blue-200 font-medium">
                    {tKo("chat.desc")}
                  </p>
                )}
                {formattedRegion && (
                  <p className="mt-1 text-xs text-blue-200/90 font-semibold">📍 {formattedRegion}</p>
                )}
              </div>
            </div>

            {/* Real-time Duty Status Card */}
            <div className="shrink-0 rounded-xl bg-white/10 p-4 backdrop-blur-md border border-white/20">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  {dutyCounselorsForLocale.length > 0 ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
                  )}
                </span>
                <span className="text-sm font-extrabold">
                  {dutyCounselorsForLocale.length > 0
                    ? formatBilingual(
                        t("chat.dutyCount").replace("{count}", String(dutyCounselorsForLocale.length)),
                        `[${consultationMeta.nativeName}] ${dutyCounselorsForLocale.length}명 상담 근무 중`,
                      )
                    : formatBilingual(
                        t("chat.dutyPreparing"),
                        `[${consultationMeta.nativeName}] 상담원 연결 준비 중`,
                      )}
                </span>
              </div>

              <div className="mt-2 text-xs text-blue-100 space-y-1">
                {dutyCounselorsForLocale.length > 0 ? (
                  dutyCounselorsForLocale.map((c) => (
                    <div key={c.phone} className="flex items-center gap-1.5 font-medium">
                      <span>
                        👤{" "}
                        {formatCounselorName({
                          rawName: c.name,
                          roleTitle: t("chat.counselorRole"),
                          locale,
                          isBilingual,
                        })}
                      </span>
                      <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded-full">
                        {t("chat.dutyStatus")}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-blue-200 max-w-xs">
                    {formatBilingual(
                      t("chat.allDutyNotice").replace("{count}", String(activeDutyCounselors.length)),
                      `전체 상담원 ${activeDutyCounselors.length}명 근무 중. 메시지를 남기시면 [${consultationMeta.nativeName}] 가능 상담원이 즉시 배정됩니다.`,
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        {!activeSession ? (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Left 2 Cols: Start Consultation Form */}
            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <span>💬</span>
                <span>{formatBilingual(t("chat.startTitle"), "실시간 상담 시작")}</span>
              </h2>
              <div className="mt-1 text-xs text-slate-500">
                <p>{t("chat.startDesc")}</p>
                {isBilingual && (
                  <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
                    {tKo("chat.startDesc")}
                  </p>
                )}
              </div>

              <form onSubmit={handleStartChat} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    {formatBilingual(t("chat.nameLabel"), "성함")}
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={t("chat.namePlaceholder")}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                </div>

                {/* Independent Consultation Language Selector */}
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <span>🗣️</span>
                      <span>{formatBilingual(t("chat.langLabel"), "상담 희망 언어")}</span>
                    </label>
                    <span className="text-[11px] text-slate-500 font-medium">
                      ({t("chat.screenLabel")}{currentMeta.nativeName})
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {t("chat.langIndependentDesc")}
                  </p>

                  {/* Dropdown Select + Reset Button */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1 flex items-center rounded-xl border-2 border-indigo-300 bg-white px-3 py-2 hover:border-indigo-500 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 transition">
                      <span className="mr-2 text-base select-none">🌐</span>
                      <select
                        value={consultationLocale}
                        onChange={(e) => {
                          setConsultationLocale(e.target.value as Locale);
                          setIsCustomConsultationLocale(true);
                        }}
                        className="w-full cursor-pointer bg-transparent text-xs sm:text-sm font-extrabold text-slate-900 outline-none"
                      >
                        {languages.map((lang) => (
                          <option key={lang.code} value={lang.code} className="text-slate-900 bg-white font-medium">
                            {lang.nativeName} {lang.name !== lang.nativeName ? `(${lang.name})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {consultationLocale !== locale && (
                      <button
                        type="button"
                        onClick={() => {
                          setConsultationLocale(locale);
                          setIsCustomConsultationLocale(false);
                        }}
                        className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition active:scale-[0.98] flex items-center justify-center gap-1 cursor-pointer"
                        title={t("chat.syncWithWeb")}
                      >
                        <span>↺</span>
                        <span>{t("chat.syncWithWeb")}</span>
                      </button>
                    )}
                  </div>

                  {/* Quick Language Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 mr-0.5">
                      {t("chat.quickSelect")}
                    </span>
                    {(
                      [
                        { code: "ko", label: "한국어" },
                        { code: "vi", label: "Tiếng Việt" },
                        { code: "en", label: "English" },
                        { code: "zh-Hans", label: "中文" },
                        { code: "ru", label: "Русский" },
                        { code: "uz", label: "O'zbekcha" },
                        { code: "ne", label: "नेपाली" },
                        { code: "th", label: "ไทย" },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => {
                          setConsultationLocale(item.code as Locale);
                          setIsCustomConsultationLocale(true);
                        }}
                        className={`rounded-lg px-2 py-1 text-[11px] font-bold transition cursor-pointer ${
                          consultationLocale === item.code
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Dynamic Status / Counselor Availability Badge */}
                  <div className="rounded-lg bg-blue-50/80 border border-blue-200 p-2 text-xs text-blue-900 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span>💡</span>
                      <span>
                        {isKorean ? (
                          <>
                            상담 언어: <strong className="font-extrabold text-blue-900">{consultationMeta.nativeName} ({consultationMeta.name})</strong>
                          </>
                        ) : (
                          <>
                            <span>{t("chat.langLabel")}:</span> <strong className="font-extrabold text-blue-900">{consultationMeta.nativeName}</strong>
                          </>
                        )}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                      {dutyCounselorsForLocale.length > 0
                        ? t("chat.counselorReadyCount").replace("{count}", String(dutyCounselorsForLocale.length))
                        : t("chat.counselorAutoMatch")}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    {formatBilingual(t("chat.inquiryLabel"), "문의 내용")}
                  </label>
                  <textarea
                    rows={4}
                    value={initialInquiry}
                    onChange={(e) => setInitialInquiry(e.target.value)}
                    placeholder={t("chat.inquiryPlaceholder")}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 py-3.5 text-base font-black text-white shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 hover:brightness-105 active:scale-[0.98] transition flex flex-col items-center justify-center cursor-pointer border border-blue-500/30"
                  >
                    {isBilingual ? (
                      <>
                        <span className="flex items-center gap-1.5 text-base font-black">
                          <span>🚀</span>
                          <span>{t("chat.enterRoom")}</span>
                        </span>
                        <span className="text-xs text-blue-200 font-bold mt-0.5">
                          {tKo("chat.enterRoom")}
                        </span>
                      </>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span>🚀</span>
                        <span>{t("chat.enterRoom")}</span>
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Col: Consultation Guidelines & Counselor Link */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span>🛡️</span>
                  <span>{formatBilingual(t("chat.guideTitle"), "상담 센터 안내")}</span>
                </h3>
                <ul className="mt-3 space-y-2.5 text-xs text-slate-600 font-medium leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">✓</span>
                    <span>{t("chat.guide1")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">✓</span>
                    <span>{t("chat.guide2")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">✓</span>
                    <span>{t("chat.guide3")}</span>
                  </li>
                </ul>
              </div>

              {/* Counselor recruitment banner */}
              <div className="rounded-2xl border border-indigo-200 bg-linear-to-br from-indigo-50 to-purple-50 p-5 shadow-xs">
                <p className="text-xs font-extrabold text-indigo-900">
                  🎧 {t("chat.counselorRecruit")}
                </p>
                <p className="mt-1 text-xs text-indigo-700 leading-relaxed">
                  {t("chat.counselorRecruitDesc")}
                </p>
                <Link
                  href="/chat/counselor"
                  className="mt-3 block text-center rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 py-2.5 text-xs font-bold text-white shadow-sm shadow-indigo-600/20 hover:shadow-md hover:brightness-105 active:scale-[0.98] transition cursor-pointer"
                >
                  {formatBilingual(t("chat.counselorPortalBtn"), "상담원 포털 이동")}
                </Link>
              </div>

              {/* Existing active sessions list */}
              {sessions.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                  <p className="text-xs font-bold text-slate-700 mb-2">{t("chat.recentChats")}</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {sessions.slice(0, 5).map((s) => {
                      const sessionLang = languages.find((l) => l.code === s.customerLocale);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setActiveSessionId(s.id)}
                          className="w-full text-left rounded-lg p-2 hover:bg-slate-50 border border-slate-100 flex items-center justify-between text-xs cursor-pointer"
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold text-slate-800">{s.customerName}</span>
                            {sessionLang && (
                              <span className="ml-1.5 text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                                {sessionLang.nativeName}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-slate-400 text-[10px]">
                              {s.counselorName
                                ? `(${formatCounselorName({
                                    rawName: s.counselorName,
                                    roleTitle: t("chat.counselorRole"),
                                    locale,
                                    isBilingual,
                                  })})`
                                : `(${t("chat.waiting")})`}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                s.status === "active"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : s.status === "waiting"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {s.status === "active"
                                ? t("chat.chatting")
                                : s.status === "waiting"
                                ? t("chat.waiting")
                                : t("chat.closed")}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Active Chat Room */
          <div className="flex flex-col h-[650px] rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden">
            {/* Chat Room Header */}
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveSessionId(null)}
                  className="rounded-xl p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 bg-white shadow-2xs active:scale-[0.96] transition cursor-pointer"
                  title={formatBilingual(t("common.back") || "Back", "목록으로")}
                >
                  ←
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-extrabold text-slate-900">
                      {activeSession.counselorName
                        ? formatCounselorName({
                            rawName: activeSession.counselorName,
                            roleTitle: t("chat.counselorRole"),
                            locale,
                            isBilingual,
                          })
                        : t("chat.connecting")}
                    </h2>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                        activeSession.status === "active"
                          ? "bg-emerald-100 text-emerald-800"
                          : activeSession.status === "waiting"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {activeSession.status === "active"
                        ? t("chat.statusConnected")
                        : activeSession.status === "waiting"
                        ? t("chat.statusWaiting")
                        : t("chat.statusClosed")}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                    <span>{t("chat.customer")}: <strong className="text-slate-800 font-bold">{activeSession.customerName}</strong></span>
                    <span>•</span>
                    <span>
                      {t("chat.langLabel")}:{" "}
                      <strong className="text-indigo-700 font-extrabold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                        🗣️ {sessionLangMeta.nativeName} ({sessionLangMeta.name})
                      </strong>
                    </span>
                    {activeSession.customerLocale !== locale && (
                      <span className="text-[10px] text-slate-400">
                        ({t("chat.screenLabel")}{currentMeta.nativeName})
                      </span>
                    )}
                    <span>•</span>
                    <span>📍 {shortRegionText}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeSession.status !== "closed" && (
                  <button
                    type="button"
                    onClick={() => closeSession(activeSession.id)}
                    className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-300 shadow-2xs transition active:scale-[0.98] cursor-pointer"
                  >
                    {t("chat.endChat")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveSessionId(null)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition active:scale-[0.98] cursor-pointer"
                >
                  {t("chat.leaveRoom")}
                </button>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
              {activeSession.messages.map((msg) => {
                if (msg.sender === "system") {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="rounded-full bg-slate-200/80 px-4 py-1 text-xs font-medium text-slate-600">
                        🔔 {msg.text}
                      </div>
                    </div>
                  );
                }

                const isCustomer = msg.sender === "customer";

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isCustomer ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-baseline gap-1.5 mb-1 px-1">
                      <span className="text-[11px] font-bold text-slate-700">
                        {msg.sender === "counselor"
                          ? formatCounselorName({
                              rawName: msg.senderName,
                              roleTitle: t("chat.counselorRole"),
                              locale,
                              isBilingual,
                            })
                          : msg.senderName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-xs ${
                        isCustomer
                          ? "bg-blue-600 text-white rounded-tr-xs"
                          : "bg-white text-slate-900 border border-slate-200 rounded-tl-xs"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input Bar */}
            {activeSession.status !== "closed" ? (
              <form
                onSubmit={handleSendMessage}
                className="border-t border-slate-200 bg-white p-3 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={
                    isKorean
                      ? `${sessionLangMeta.nativeName} 또는 한국어로 메시지를 입력하세요...`
                      : `${sessionLangMeta.nativeName} · ${t("chat.inputPlaceholder")}`
                  }
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm shadow-blue-600/20 hover:shadow-md hover:brightness-105 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {t("chat.send")}
                </button>
              </form>
            ) : (
              <div className="border-t border-slate-200 bg-slate-100 p-4 text-center text-xs font-bold text-slate-500">
                {t("chat.closedNotice")}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
