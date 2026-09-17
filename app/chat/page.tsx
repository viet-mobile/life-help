"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { useRegion } from "@/lib/region/RegionContext";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { languages, type Locale, formatLanguageName } from "@/messages";
import { navigateToMainHome } from "@/lib/navigation";
import { services } from "@/lib/services";
import {
  getStoredChatSessions,
  findMatchingOnDutyProvider,
  createProviderChatSession,
  sendProviderChatMessage,
  type ProviderChatSession,
  type ServiceProvider,
} from "@/lib/chat/providerChatStore";
import { DesktopShortcutButton } from "@/components/shared/DesktopShortcutButton";
import {
  getOrCreateCustomerId,
  formatCustomerDisplayName,
} from "@/lib/id/userIdentifier";

export default function CustomerChatPage() {
  const { locale, setLocale, currentMeta, t, tKo, formatBilingual, isBilingual } = useLocale();
  const isKorean = locale === "ko";
  const { selectedRegion, formattedRegion, shortRegionText, openModal } = useRegion();

  const [selectedServiceSlug, setSelectedServiceSlug] = useState<string>("clog-clearing");
  const [customerId, setCustomerId] = useState<string>("");
  const [initialInquiry, setInitialInquiry] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setCustomerId(getOrCreateCustomerId());
  }, []);

  // Active Sessions state
  const [sessions, setSessions] = useState<ProviderChatSession[]>(getStoredChatSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setSessions(getStoredChatSessions());
    };
    window.addEventListener("life_help_provider_chat_update", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("life_help_provider_chat_update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // Matching On-Duty Provider for currently selected service & region
  const matchedProvider: ServiceProvider | null = useMemo(() => {
    return findMatchingOnDutyProvider(
      selectedServiceSlug,
      selectedRegion?.country || "KR",
      selectedRegion?.sido,
      selectedRegion?.gungu
    );
  }, [selectedServiceSlug, selectedRegion]);

  const selectedServiceObj = services.find((s) => s.slug === selectedServiceSlug) || services[0];

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCustomerId = customerId || getOrCreateCustomerId();
    const finalName = formatCustomerDisplayName(finalCustomerId, locale);
    const serviceName = isKorean
      ? tKo(`service.${selectedServiceObj.key}`)
      : t(`service.${selectedServiceObj.key}`);

    const newSession = await createProviderChatSession({
      serviceSlug: selectedServiceSlug,
      serviceName,
      country: selectedRegion?.country || "KR",
      sido: selectedRegion?.sido || "전북특별자치도",
      gungu: selectedRegion?.gungu || "익산시",
      customerName: finalName,
      customerLocale: locale,
      initialMessage: initialInquiry.trim() || undefined,
    });

    setSessions(getStoredChatSessions());
    setActiveSessionId(newSession.id);
    setInitialInquiry("");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeSessionId || !activeSession || isSending) return;

    const textToSend = messageInput.trim();
    setMessageInput("");
    setIsSending(true);

    try {
      await sendProviderChatMessage(
        activeSessionId,
        "customer",
        activeSession.customerName,
        locale,
        textToSend
      );
      setSessions(getStoredChatSessions());
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col overflow-x-hidden">
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
              <BrandLogo portal="chat" size="md" priority />
              <span className="droplet-pill bg-blue-100 text-blue-800 px-2 py-0.5 text-[10px] sm:text-xs font-black shrink-0">
                LIVE CHAT
              </span>
            </Link>
            <button
              type="button"
              onClick={openModal}
              className="hidden sm:inline-flex items-center gap-1.5 droplet-btn border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-blue-50 shrink-0"
            >
              <span>📍 {shortRegionText}</span>
              <span className="text-[10px] text-slate-400">▾</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link
              href="/tech"
              className="droplet-btn border border-amber-300 bg-amber-50 px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shrink-0"
            >
              <span className="sm:hidden">🛠️ 헬퍼</span>
              <span className="hidden sm:inline">🛠️ {formatBilingual("Helper Portal", "생활 헬퍼 포털")}</span>
            </Link>
            <DesktopShortcutButton variant="header" portal="chat" />
            <LanguageSwitcher locale={locale} onChange={setLocale} />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {/* Banner with Real-Time Matching Service Provider Status */}
        <div className="mb-6 droplet-banner bg-linear-to-r from-blue-700 via-indigo-700 to-blue-800 p-5 text-white shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex flex-wrap items-center gap-2 droplet-pill bg-white/20 px-3 py-1 text-xs font-bold tracking-wide">
                <span>🌐 {formatBilingual("Real-time Provider Chat", "현장 헬퍼 실시간 직결 대화")}</span>
                <span className="text-blue-200">|</span>
                <span>{formatLanguageName(currentMeta)}</span>
                <span className="text-blue-200">|</span>
                <span>실시간 양방향 자동 번역</span>
              </div>
              <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl whitespace-pre-line leading-snug">
                {formatBilingual(
                  "Connect Directly with On-Duty Specialist",
                  "근무 중인 지역 전담 헬퍼와 1:1 실시간 상담"
                )}
              </h1>
              <p className="mt-1 text-sm text-blue-100 whitespace-pre-line leading-relaxed">
                {formatBilingual(
                  "Chat in your language. Messages are translated in real time, showing both original and translated text to prevent any misunderstanding.",
                  "모국어로 편안하게 말씀하세요. 오해를 방지하기 위해 고객과 헬퍼 모두에게 원래 언어와 번역된 언어가 동시에 표기됩니다."
                )}
              </p>
              {formattedRegion && (
                <p className="mt-1.5 text-xs text-blue-200/90 font-semibold">📍 {formattedRegion}</p>
              )}
            </div>

            {/* Real-time On-Duty Provider Status Card */}
            <div className="shrink-0 droplet-card bg-white/10 p-4 backdrop-blur-md border border-white/20 min-w-[240px]">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  {matchedProvider?.onDuty ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
                  )}
                </span>
                <span className="text-sm font-extrabold text-white">
                  {matchedProvider?.onDuty
                    ? "🟢 전담 헬퍼 실시간 근무 중"
                    : "🟡 연결 대기 중"}
                </span>
              </div>

              {matchedProvider && (
                <div className="mt-2 text-xs text-blue-100 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <span>{matchedProvider.avatarIcon}</span>
                    <span>{matchedProvider.name}</span>
                  </div>
                  <p className="text-[11px] text-blue-200">
                    근무 시간: {matchedProvider.dutyHours} • 평점 ⭐ {matchedProvider.rating}
                  </p>
                  <p className="text-[10px] text-emerald-300 font-semibold">
                    ✓ 언어 자동 번역 지원 · 한국어 ↔ {currentMeta.nativeName}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        {!activeSession ? (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Left 2 Cols: Start Consultation Form */}
            <div className="md:col-span-2 droplet-card border border-slate-200 bg-white p-6 shadow-xs">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 whitespace-pre-line">
                <span>💬</span>
                <span>{formatBilingual("Start Real-time 1:1 Chat", "전담 헬퍼 1:1 실시간 대화 시작")}</span>
              </h2>
              <p className="mt-1 text-xs text-slate-500 whitespace-pre-line leading-relaxed">
                {formatBilingual(
                  "Select the service you need and enter your problem. You will be connected directly with a verified specialist on duty.",
                  "필요하신 서비스와 문의 내용을 입력하시면, 현재 근무 중인 전담 헬퍼와 즉시 실시간 대화방으로 연결됩니다."
                )}
              </p>

              <form onSubmit={handleStartChat} className="mt-5 space-y-4">
                {/* Service Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 whitespace-pre-line">
                    {formatBilingual("Required Service", "필요하신 서비스")}
                  </label>
                  <select
                    value={selectedServiceSlug}
                    onChange={(e) => setSelectedServiceSlug(e.target.value)}
                    className="mt-1.5 w-full droplet-input border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition cursor-pointer"
                  >
                    {services.map((s) => (
                      <option key={s.slug} value={s.slug}>
                        {s.icon} {isKorean ? tKo(`service.${s.key}`) : `${t(`service.${s.key}`)} · ${tKo(`service.${s.key}`)}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Auto-generated Safe Customer Identifier */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <span>🔒</span>
                      <span>{formatBilingual("Auto Safe Customer ID Assigned", "시스템 자동 발급 안심 식별자")}</span>
                    </span>
                    <span className="font-mono text-xs font-black text-emerald-950 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs">
                      {customerId ? formatCustomerDisplayName(customerId, locale) : "고객 · CST-AUTO"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-emerald-800 leading-relaxed font-medium">
                    {formatBilingual(
                      "Your real name and phone number are zero-collected. You are securely identified by your system-generated ID across 1:1 chat.",
                      "고객님의 실명과 전화번호는 일체 수집하지 않습니다. 시스템에서 자동 발급한 안심 식별자로 1:1 대화가 안전하게 진행됩니다."
                    )}
                  </p>
                </div>

                {/* Problem Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 whitespace-pre-line">
                    {formatBilingual("Describe your problem (In your language)", "문의 또는 문제 상황 · 모국어로 작성")}
                  </label>
                  <textarea
                    rows={4}
                    value={initialInquiry}
                    onChange={(e) => setInitialInquiry(e.target.value)}
                    placeholder={
                      isKorean
                        ? "예: 변기가 막혀서 물이 역류합니다. 오늘 바로 방문 가능한가요?"
                        : `Please describe what happened in ${currentMeta.nativeName}...`
                    }
                    className="mt-1.5 w-full droplet-input border border-slate-300 p-3 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                  <p className="mt-1 text-[11px] text-blue-600 font-medium">
                    💡 작성하신 내용은 담당 헬퍼의 언어(한국어 등)로 자동 번역되어 원문과 함께 실시간 전달됩니다.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full droplet-btn-lg bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 py-3.5 text-base font-black text-white shadow-md shadow-blue-600/25 hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer border border-blue-500/30"
                  >
                    <span>🚀</span>
                    <span>{formatBilingual("Connect with Specialist Now", "근무 중인 헬퍼와 1:1 대화 시작")}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right Col: Guidelines & Recent Sessions */}
            <div className="space-y-4">
              <div className="droplet-card border border-slate-200 bg-white p-5 shadow-xs">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span>🛡️</span>
                  <span>{formatBilingual("How It Works", "실시간 1:1 번역 대화 안내")}</span>
                </h3>
                <ul className="mt-3 space-y-2.5 text-xs text-slate-600 font-medium leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">✓</span>
                    <span>고객이 선택한 지역 및 서비스에 맞는 현장 헬퍼와 즉시 연결됩니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">✓</span>
                    <span>서로 언어가 다른 경우 실시간 자동 번역으로 전달됩니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">✓</span>
                    <span>오해를 없애기 위해 양측 화면 모두에 [원문]과 [번역문]이 항상 같이 보입니다.</span>
                  </li>
                </ul>
              </div>

              {/* Active / Recent Sessions List */}
              {sessions.length > 0 && (
                <div className="droplet-card border border-slate-200 bg-white p-4 shadow-xs">
                  <p className="text-xs font-bold text-slate-700 mb-2">
                    {formatBilingual("Recent Chat Rooms", "최근 진행 중인 대화방")}
                  </p>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {sessions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setActiveSessionId(s.id)}
                        className="w-full text-left droplet-btn p-2.5 hover:bg-slate-50 border border-slate-100 flex items-center justify-between text-xs cursor-pointer transition"
                      >
                        <div className="truncate pr-2">
                          <span className="font-bold text-slate-800">
                            {s.provider.avatarIcon} {s.provider.name}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                            {s.serviceName} • {s.sido} {s.gungu}
                          </p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 droplet-pill font-bold bg-emerald-100 text-emerald-800 shrink-0">
                          대화 진행 중
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Active Chat Room with Bidirectional Real-Time Translation */
          <div className="flex flex-col h-[680px] droplet-banner border border-slate-200 bg-white shadow-md overflow-hidden">
            {/* Chat Room Header */}
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveSessionId(null)}
                  className="droplet-btn p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 bg-white shadow-2xs active:scale-[0.96] transition cursor-pointer"
                  title="목록으로"
                >
                  ←
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{activeSession.provider.avatarIcon}</span>
                    <h2 className="text-sm font-extrabold text-slate-900">
                      {activeSession.provider.name}
                    </h2>
                    <span className="text-[11px] px-2 py-0.5 droplet-pill font-bold bg-emerald-100 text-emerald-800">
                      실시간 1:1 연결 중
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap mt-0.5">
                    <span>분야: <strong className="text-slate-800 font-bold">{activeSession.serviceName}</strong></span>
                    <span>•</span>
                    <span>지역: <strong>{activeSession.sido} {activeSession.gungu}</strong></span>
                    <span>•</span>
                    <span className="text-indigo-700 font-bold">
                      🗣️ 양방향 실시간 자동 번역 · 한국어 ↔ {currentMeta.nativeName}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveSessionId(null)}
                className="droplet-btn border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition active:scale-[0.98] cursor-pointer"
              >
                대화방 닫기
              </button>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
              {activeSession.messages.map((msg) => {
                if (msg.sender === "system") {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="droplet-card bg-blue-100/80 border border-blue-200/60 px-4 py-2 text-xs font-medium text-blue-900 max-w-lg text-center leading-relaxed">
                        🔔 {msg.text}
                        {msg.translatedText && (
                          <span className="block mt-1 text-[11px] text-blue-700 opacity-90">
                            {msg.translatedText}
                          </span>
                        )}
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
                        {isCustomer ? `${msg.senderName} · 고객` : `${msg.senderName} · 전담 헬퍼`}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Dual Message Bubble: Original + Translated */}
                    <div
                      className={`max-w-[85%] droplet-card p-3.5 text-sm leading-relaxed shadow-xs ${
                        isCustomer
                          ? "bg-blue-600 text-white !rounded-tr-xs"
                          : "bg-white text-slate-900 border border-slate-200 !rounded-tl-xs"
                      }`}
                    >
                      {/* 1. Primary Text */}
                      <p className="font-semibold text-sm">
                        {isCustomer
                          ? msg.text
                          : msg.translatedText || msg.text}
                      </p>

                      {/* 2. Subtitle: Accompanying Text to prevent any misunderstanding */}
                      {((isCustomer && msg.translatedText && msg.translatedText !== msg.text) ||
                        (!isCustomer && msg.text && msg.translatedText && msg.translatedText !== msg.text)) && (
                        <div
                          className={`mt-2 pt-2 border-t text-xs leading-normal ${
                            isCustomer
                              ? "border-blue-400/50 text-blue-100"
                              : "border-slate-100 text-slate-500"
                          }`}
                        >
                          <span className="font-bold opacity-75">
                            {isCustomer ? "헬퍼에게 번역 전달됨:" : "헬퍼 원문:"}{" "}
                          </span>
                          <span>{isCustomer ? msg.translatedText : msg.text}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input Bar with Live Translation Indicator */}
            <form
              onSubmit={handleSendMessage}
              className="border-t border-slate-200 bg-white p-3.5 flex items-center gap-2"
            >
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={
                  isKorean
                    ? "메시지를 입력하세요. 헬퍼에게 실시간 전달됩니다..."
                    : `Type in ${currentMeta.nativeName}... · Auto-translated to Korean`
                }
                className="flex-1 droplet-input border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
              <button
                type="submit"
                disabled={!messageInput.trim() || isSending}
                className="droplet-btn bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm hover:shadow-md hover:brightness-105 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
              >
                <span>{isSending ? "번역 중..." : "전송"}</span>
                <span>➤</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
