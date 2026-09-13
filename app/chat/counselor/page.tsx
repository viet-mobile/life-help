"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useChat } from "@/lib/chat/ChatContext";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { languages, type Locale } from "@/messages";
import { navigateToMainHome } from "@/lib/navigation";
import {
  getAdminMessages,
  sendAdminMessage,
  markAllAdminMessagesAsRead,
  ADMIN_MESSAGE_EVENT,
  type AdminMessage,
} from "@/lib/admin/adminMessage";
import { formatCounselorName } from "@/lib/chat/counselorFormat";

export default function CounselorPortalPage() {
  const { locale, setLocale, t, tKo, formatBilingual, isBilingual } = useLocale();
  const isKorean = locale === "ko";

  const {
    currentCounselor,
    loginCounselor,
    registerCounselor,
    logoutCounselor,
    updateCounselorStatus,
    updateCounselorLanguages,
    requestCounselorAccessKey,
    verifyCounselorAccessKey,
    remainingDays,
    sessions,
    sendMessage,
    acceptSession,
    closeSession,
  } = useChat();

  // Mode: "login" | "register"
  const [activeTab, setActiveTab] = useState<"login" | "register">("register");

  // Form state
  const [phone, setPhone] = useState("");
  const [counselorName, setCounselorName] = useState("");
  const [region, setRegion] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [authCode, setAuthCode] = useState("");
  const [accessKeyNotice, setAccessKeyNotice] = useState<{
    accessKey: string;
    expiresAt: string;
    expiryFormatted: string;
    channel: string;
    title: string;
    body: string;
  } | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);
  const [selectedLangs, setSelectedLangs] = useState<Locale[]>(["vi", "ko"]);
  const [showPhoneReissue, setShowPhoneReissue] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [langSearch, setLangSearch] = useState("");

  // Admin Direct Messaging state
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);
  const [showAdminChatModal, setShowAdminChatModal] = useState(false);
  const [adminReplyText, setAdminReplyText] = useState("");

  const refreshAdminMessages = useCallback(() => {
    if (currentCounselor?.phone) {
      const msgs = getAdminMessages({ targetId: currentCounselor.phone, targetType: "counselor" });
      setAdminMessages(msgs);
    }
  }, [currentCounselor?.phone]);

  useEffect(() => {
    refreshAdminMessages();
    const handleMsgUpdate = () => refreshAdminMessages();
    window.addEventListener(ADMIN_MESSAGE_EVENT, handleMsgUpdate);
    return () => window.removeEventListener(ADMIN_MESSAGE_EVENT, handleMsgUpdate);
  }, [refreshAdminMessages]);

  const unreadAdminCount = adminMessages.filter(
    (m) => !m.isRead && m.sender === "admin",
  ).length;
  const latestAdminMsg = adminMessages.find((m) => m.sender === "admin");

  const handleOpenAdminChat = () => {
    setShowAdminChatModal(true);
    if (currentCounselor?.phone) {
      markAllAdminMessagesAsRead(currentCounselor.phone, "partner");
      refreshAdminMessages();
    }
  };

  const handleSendAdminReply = () => {
    if (!adminReplyText.trim() || !currentCounselor?.phone) return;
    sendAdminMessage({
      targetType: "counselor",
      targetId: currentCounselor.phone,
      targetName: currentCounselor.name,
      sender: "partner",
      senderName: formatCounselorName({
        rawName: currentCounselor.name,
        roleTitle: t("chat.counselorRole"),
        locale,
        isBilingual,
      }),
      text: adminReplyText.trim(),
    });
    setAdminReplyText("");
    refreshAdminMessages();
  };

  const handleSendAccessKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg(
        isKorean
          ? "올바른 휴대폰 번호를 입력해 주세요. (예: 010-1234-5678)"
          : `${t("tech.invalidPhoneError")} · 올바른 휴대폰 번호를 입력해 주세요.`,
      );
      return;
    }
    setErrorMsg("");
    setLoading(true);
    const res = await requestCounselorAccessKey(phone);
    setLoading(false);

    if (res.success) {
      setCodeSent(true);
      setAccessKeyNotice(res.notice);
      setAuthCode(res.accessKey); // Auto-filled for convenient mobile testing
    } else {
      setErrorMsg(isKorean ? "접속 코드 발송에 실패했습니다." : "Failed to send access key.");
    }
  };

  const handleCopyKey = () => {
    if (!accessKeyNotice?.accessKey) return;
    navigator.clipboard.writeText(accessKeyNotice.accessKey);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authCode || authCode.trim().length < 6) {
      setErrorMsg(isKorean ? "3개월 전용 보안 코드를 입력해 주세요." : "Please enter the security access key.");
      return;
    }

    setLoading(true);
    const result = phone.trim()
      ? await verifyCounselorAccessKey(phone, authCode.trim())
      : await verifyCounselorAccessKey(authCode.trim());
    setLoading(false);

    if (!result.success) {
      setErrorMsg(result.error || (isKorean ? "보안 접속 코드가 올바르지 않거나 만료되었습니다." : "Invalid access key."));
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authCode || authCode.trim().length < 6) {
      setErrorMsg(isKorean ? "보안 접속 코드를 입력해 주세요." : "Please enter the security access key.");
      return;
    }
    if (!counselorName.trim()) {
      setErrorMsg(isKorean ? "상담원 성함을 입력해 주세요." : "Please enter your name.");
      return;
    }
    if (selectedLangs.length === 0) {
      setErrorMsg(isKorean ? "최소 하나 이상의 상담 가능 언어를 선택해 주세요." : "Please select at least one language.");
      return;
    }
    if (!agreeTerms) {
      setErrorMsg(isKorean ? "상담원 활동 규정 및 개인정보 수집에 동의해 주세요." : "Please agree to the regulations.");
      return;
    }

    setLoading(true);
    registerCounselor({
      phone,
      name: counselorName.trim(),
      languages: selectedLangs,
      region: region.trim() || undefined,
      specialty: specialty.trim() || undefined,
      accessKey: authCode,
      accessKeyExpiresAt: accessKeyNotice?.expiresAt,
    });
    setLoading(false);
  };

  const toggleLanguage = (code: Locale) => {
    if (currentCounselor) {
      const current = currentCounselor.languages;
      const updated = current.includes(code)
        ? current.filter((l) => l !== code)
        : [...current, code];
      if (updated.length > 0) {
        updateCounselorLanguages(updated);
      }
    } else {
      setSelectedLangs((prev) =>
        prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code],
      );
    }
  };

  // Filter sessions relevant to this counselor
  const myActiveSessions = sessions.filter(
    (s) =>
      currentCounselor &&
      s.counselorPhone === currentCounselor.phone &&
      s.status === "active",
  );

  const waitingSessions = sessions.filter(
    (s) =>
      currentCounselor &&
      s.status === "waiting" &&
      currentCounselor.languages.includes(s.customerLocale),
  );

  const activeSession = sessions.find((s) => s.id === selectedSessionId);

  const handleSendCounselorMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedSessionId || !currentCounselor) return;
    sendMessage(selectedSessionId, "counselor", currentCounselor.name, replyText);
    setReplyText("");
  };

  // Quick canned responses
  const sendCannedResponse = (msg: string) => {
    if (!selectedSessionId || !currentCounselor) return;
    sendMessage(selectedSessionId, "counselor", currentCounselor.name, msg);
  };

  const filteredLanguages = languages.filter(
    (l) =>
      l.name.includes(langSearch) ||
      l.nativeName.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.code.toLowerCase().includes(langSearch.toLowerCase()),
  );

  // If not logged in, render SMS Phone Authentication & Registration Screen
  if (!currentCounselor) {
    return (
      <main className="min-h-screen bg-slate-100 flex flex-col justify-between py-8 px-4 sm:px-6">
        <header className="mx-auto flex w-full max-w-xl items-center justify-between">
          <Link
            href="/"
            onClick={navigateToMainHome}
            className="inline-flex items-center gap-2 text-xl font-black text-indigo-700 hover:opacity-80 transition cursor-pointer"
            title="LIFE.HELP"
          >
            <span>🎧</span>
            <span>LIFE.HELP {t("chat.counselorPortal")}</span>
          </Link>
          <LanguageSwitcher locale={locale} onChange={setLocale} />
        </header>

        <div className="mx-auto my-6 w-full max-w-xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-slate-900">
              LIFE.HELP {t("chat.counselorPortal")}
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-600">
              {t("chat.registerDesc")}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
            {/* Mode Switch Tabs: Register vs Login */}
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("register");
                  setErrorMsg("");
                }}
                className={`rounded-xl py-2.5 text-xs font-black transition ${
                  activeTab === "register"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t("chat.tabRegister")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setErrorMsg("");
                }}
                className={`rounded-xl py-2.5 text-xs font-black transition ${
                  activeTab === "login"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t("chat.tabLogin")}
              </button>
            </div>

            <div className="mb-4">
              <h2 className="text-lg font-black text-slate-900">
                {activeTab === "register" ? t("chat.registerTitle") : t("chat.loginTitle")}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {activeTab === "register" ? t("chat.registerDesc") : t("chat.loginDesc")}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-600">
                ⚠️ {errorMsg}
              </div>
            )}

            {activeTab === "login" ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700">
                    {t("chat.securitySessionBadge")}
                  </label>
                  <input
                    type="text"
                    required
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                    placeholder="LH-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3.5 text-center text-base sm:text-lg font-black tracking-wider font-mono uppercase text-indigo-700 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 py-3.5 text-sm font-black text-white shadow-md shadow-indigo-600/25 hover:shadow-lg hover:shadow-indigo-600/35 hover:brightness-105 active:scale-[0.98] transition flex flex-col items-center justify-center disabled:opacity-50 cursor-pointer border border-indigo-500/30"
                >
                  {loading ? (
                    <span>{t("chat.verifying")}</span>
                  ) : (
                    <span>{t("chat.loginSubmit")}</span>
                  )}
                </button>

                <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 text-xs text-indigo-900">
                  <p className="leading-relaxed">
                    💡 {t("chat.loginKeyNotice")}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("register");
                      setErrorMsg("");
                    }}
                    className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                  >
                    {t("chat.registerAsNewCounselor")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPhoneReissue((prev) => !prev)}
                    className="text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
                  >
                    {t("chat.lostCode")}
                  </button>
                </div>

                {showPhoneReissue && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 mt-2 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      {t("chat.reissuePhoneTitle")}
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="010-XXXX-XXXX"
                        className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold font-mono outline-none focus:border-indigo-600"
                      />
                      <button
                        type="button"
                        onClick={handleSendAccessKey}
                        disabled={loading}
                        className="rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-3.5 py-2 text-xs font-extrabold text-white shadow-sm shadow-indigo-600/20 hover:brightness-105 active:scale-[0.98] shrink-0 cursor-pointer"
                      >
                        {loading ? t("chat.sendingCode") : t("chat.getCode")}
                      </button>
                    </div>
                    {accessKeyNotice && (
                      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 flex items-center justify-between">
                        <span className="font-mono font-bold">{accessKeyNotice.accessKey}</span>
                        <button
                          type="button"
                          onClick={handleCopyKey}
                          className="text-[11px] bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-bold hover:bg-emerald-700 active:scale-95 transition cursor-pointer shadow-2xs"
                        >
                          {copiedToast ? t("chat.copied") : t("chat.copy")}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </form>
            ) : (
              <form
                onSubmit={!codeSent ? handleSendAccessKey : handleRegisterSubmit}
                className="space-y-4"
              >
                {/* Phone Input */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700">
                    {t("chat.phoneLabel")}
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="010-XXXX-XXXX"
                      disabled={codeSent}
                      className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold tracking-wide outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                    />
                    {!codeSent ? (
                      <button
                        type="submit"
                        disabled={loading}
                        className="rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2.5 text-xs font-black text-white shadow-sm shadow-indigo-600/20 hover:brightness-105 active:scale-[0.98] transition shrink-0 disabled:opacity-50 cursor-pointer"
                      >
                        {loading ? t("chat.sendingCode") : (isKorean ? "3개월 보안 코드 받기" : t("chat.getCode"))}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCodeSent(false)}
                        className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs active:scale-[0.98] transition shrink-0 cursor-pointer"
                      >
                        {isKorean ? "재입력" : "Change"}
                      </button>
                    )}
                  </div>
                  {!codeSent && (
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      💡 {formatBilingual(
                        t("chat.loginKeyNotice"),
                        "카카오톡 또는 문자로 3개월 전용 보안 코드가 발송되며, 90일간 자동 로그인이 유지됩니다.",
                      )}
                    </p>
                  )}
                </div>

                {/* Code Verification & Profile Details */}
                {codeSent && (
                  <>
                    {/* Issued Key Card */}
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-900">
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1 text-emerald-700">
                          <span>💬</span>
                          <span>{t("chat.securityCodeSentNotice")}</span>
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">{phone}</span>
                      </div>

                      <div className="mt-2.5 rounded-xl border border-emerald-300 bg-white p-2.5 flex items-center justify-between gap-2 shadow-xs">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase block">
                            {t("chat.accessKeyTitle")}
                          </span>
                          <span className="font-mono text-sm sm:text-base font-black tracking-wider text-slate-900 select-all">
                            {accessKeyNotice?.accessKey}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyKey}
                          className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-700 active:scale-95 transition cursor-pointer shadow-2xs"
                        >
                          {copiedToast ? `✓ ${t("chat.copied")}` : `📋 ${t("chat.copy")}`}
                        </button>
                      </div>

                      <p className="mt-2 text-[11px] text-emerald-700 font-medium">
                        📅 {t("chat.expiryNotice").replace("{expiry}", accessKeyNotice?.expiryFormatted || "")}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700">
                        {t("chat.securitySessionBadge")}
                      </label>
                      <input
                        type="text"
                        value={authCode}
                        onChange={(e) => setAuthCode(e.target.value)}
                        placeholder="LH-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-black tracking-wider font-mono uppercase text-indigo-700 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700">
                        {t("chat.counselorNameLabel")}
                      </label>
                      <input
                        type="text"
                        required
                        value={counselorName}
                        onChange={(e) => setCounselorName(e.target.value)}
                        placeholder={t("chat.counselorNamePlaceholder")}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700">
                        {t("chat.regionLabel")}
                      </label>
                      <input
                        type="text"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        placeholder={formatBilingual("e.g. Seoul, Suwon, Iksan", "예: 서울특별시, 경기도 수원시, 전북 익산시")}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700">
                        {t("chat.specialtyLabel")}
                      </label>
                      <input
                        type="text"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder={t("chat.specialtyPlaceholder")}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-extrabold text-slate-700">
                          {t("chat.langsLabel")}
                        </label>
                        <span className="text-[11px] text-indigo-600 font-bold">
                          {t("chat.selectedLangsCount").replace("{count}", String(selectedLangs.length))}
                        </span>
                      </div>

                      <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-200 p-2.5 bg-slate-50/50 grid grid-cols-2 gap-2">
                        {languages.map((l) => (
                          <label
                            key={l.code}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border text-xs font-bold transition ${
                              selectedLangs.includes(l.code)
                                ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedLangs.includes(l.code)}
                              onChange={() => toggleLanguage(l.code)}
                              className="rounded text-indigo-600 focus:ring-0"
                            />
                            <span className="truncate">{l.nativeName} ({l.name})</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs">
                      <label className="flex items-start gap-2 cursor-pointer font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-0"
                        />
                        <span>{t("chat.agreeLabel")}</span>
                      </label>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 py-3.5 text-sm font-black text-white shadow-md shadow-indigo-600/25 hover:shadow-lg hover:shadow-indigo-600/35 hover:brightness-105 active:scale-[0.98] transition flex flex-col items-center justify-center cursor-pointer border border-indigo-500/30"
                      >
                        <span>{t("chat.registerSubmit")}</span>
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <Link href="/chat" className="text-xs font-bold text-slate-500 hover:text-slate-800">
                {t("chat.backToCustomerChat")}
              </Link>
            </div>
          </div>
        </div>

        <footer className="mx-auto w-full max-w-xl text-center text-xs text-slate-400">
          LIFE.HELP COUNSELOR PORTAL · 010-5757-5757 / 010-5959-5959
        </footer>
      </main>
    );
  }

  // Logged-in Counselor Workstation View
  return (
    <main className="min-h-screen bg-slate-100 flex flex-col">
      {/* Counselor Navigation Bar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              onClick={navigateToMainHome}
              className="flex items-center gap-2 text-lg font-black text-indigo-700 hover:opacity-80 transition cursor-pointer"
              title="LIFE.HELP"
            >
              <span>🎧</span>
              <span>LIFE.HELP {t("chat.workstationTitle")}</span>
            </Link>
            <div className="hidden sm:flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1 text-xs">
              <span className="font-bold text-slate-700">
                👤 {formatCounselorName({
                  rawName: currentCounselor.name,
                  roleTitle: t("chat.counselorRole"),
                  locale,
                  isBilingual,
                })}
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">{currentCounselor.phone}</span>
              {currentCounselor.region && (
                <>
                  <span className="text-slate-400">|</span>
                  <span className="text-indigo-600 font-bold">{currentCounselor.region}</span>
                </>
              )}
              {remainingDays > 0 && (
                <>
                  <span className="text-slate-400">|</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <span>🛡️ {t("chat.securitySessionBadge")}</span>
                    <span className="text-emerald-600 font-medium">({remainingDays}{isKorean ? "" : " "}{t("chat.daysRemaining")})</span>
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* HQ Admin Chat Button */}
            <button
              type="button"
              onClick={handleOpenAdminChat}
              className="relative inline-flex items-center gap-1.5 rounded-xl border border-indigo-200/90 bg-indigo-50/80 px-3.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100/90 shadow-2xs transition active:scale-[0.98] cursor-pointer"
              title={formatBilingual(t("workspace.adminChatTitle"), "본사 관리자 1:1 온라인 연락")}
            >
              <span>💬 {formatBilingual(t("workspace.adminChat"), "본사 관리자")}</span>
              {unreadAdminCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white animate-pulse">
                  {unreadAdminCount}
                </span>
              )}
            </button>

            {/* Duty Status Toggle */}
            <button
              type="button"
              onClick={() =>
                updateCounselorStatus(currentCounselor.status === "duty" ? "break" : "duty")
              }
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-extrabold shadow-sm transition active:scale-[0.98] cursor-pointer ${
                currentCounselor.status === "duty"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:brightness-105 shadow-emerald-600/20"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:brightness-105 shadow-amber-500/20"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
              <span>
                {currentCounselor.status === "duty" ? t("chat.duty") : t("chat.breakStatus")}
              </span>
            </button>

            <button
              type="button"
              onClick={logoutCounselor}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition active:scale-[0.98] cursor-pointer"
            >
              {t("chat.logout")}
            </button>

            <LanguageSwitcher locale={locale} onChange={setLocale} />
          </div>
        </div>
      </header>

      {/* Admin Message Alert Banner */}
      {unreadAdminCount > 0 && latestAdminMsg && (
        <div className="mx-auto mt-3 w-full max-w-7xl px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-xs">
            <div className="flex items-start gap-3">
              <span className="text-xl">🔔</span>
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-xs font-black text-amber-900">
                    {formatBilingual(t("workspace.adminNoticeBanner"), "[본사 관리자 메시지]")}
                  </strong>
                  <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                    {unreadAdminCount} {t("workspace.unreadCount") || (isKorean ? "건 미확인" : "unread")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-amber-800 line-clamp-1">
                  &ldquo;{latestAdminMsg.text}&rdquo;
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenAdminChat}
              className="rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-2 text-xs font-black text-white shadow-sm shadow-amber-600/20 hover:brightness-105 active:scale-[0.98] transition self-end sm:self-center shrink-0 cursor-pointer"
            >
              {formatBilingual(t("workspace.openAdminChat"), "메시지 확인 및 답장")}
            </button>
          </div>
        </div>
      )}

      {/* Main Workstation Layout */}
      <div className="mx-auto w-full max-w-7xl flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Language Proficiencies & Session Queues (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Languages Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                {t("chat.langSettings")}
              </h3>
              <span className="text-[11px] font-bold text-indigo-600">
                {currentCounselor.languages.length}{isKorean ? "" : " "}{t("chat.langsActive")}
              </span>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {currentCounselor.languages.map((code) => {
                const meta = languages.find((l) => l.code === code);
                return (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-xs font-bold text-indigo-800"
                  >
                    {meta?.nativeName || code}
                    <button
                      type="button"
                      onClick={() => toggleLanguage(code)}
                      className="text-indigo-400 hover:text-indigo-700"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>

            {/* Language Quick Add Input */}
            <div className="mt-3 pt-3 border-t border-slate-100">
              <input
                type="text"
                value={langSearch}
                onChange={(e) => setLangSearch(e.target.value)}
                placeholder={t("chat.searchLang")}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500"
              />
              {langSearch && (
                <div className="mt-1.5 max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-1.5 space-y-1">
                  {filteredLanguages.slice(0, 6).map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        toggleLanguage(l.code);
                        setLangSearch("");
                      }}
                      className="w-full text-left p-1 rounded hover:bg-white text-xs font-medium text-slate-700 flex justify-between"
                    >
                      <span>{l.nativeName} ({l.name})</span>
                      <span>{currentCounselor.languages.includes(l.code) ? "✓" : "+"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Incoming Waiting Queue */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>{t("chat.waitingQueue")}</span>
                <span className="rounded-full bg-amber-100 text-amber-800 px-1.5 py-0.2 text-[10px] font-bold">
                  {waitingSessions.length}
                </span>
              </h3>
            </div>

            <div className="mt-3 space-y-2">
              {waitingSessions.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  {t("chat.noWaiting")}
                </p>
              ) : (
                waitingSessions.map((s) => {
                  const langMeta = languages.find((l) => l.code === s.customerLocale);
                  return (
                    <div
                      key={s.id}
                      className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-800">
                          {s.customerName}
                        </span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                          {langMeta?.nativeName || s.customerLocale}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {s.messages.find((m) => m.sender === "customer")?.text || t("chat.inquiryDefault")}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          acceptSession(s.id, currentCounselor);
                          setSelectedSessionId(s.id);
                        }}
                        className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-2 text-xs font-black text-white shadow-sm shadow-indigo-600/20 hover:brightness-105 active:scale-[0.98] transition cursor-pointer"
                      >
                        {t("chat.acceptBtn")}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* My Active Assigned Chats */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>{t("chat.myActiveChats")}</span>
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[10px] font-bold">
                {myActiveSessions.length}
              </span>
            </h3>

            <div className="mt-3 space-y-2">
              {myActiveSessions.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  {t("chat.noActive")}
                </p>
              ) : (
                myActiveSessions.map((s) => {
                  const isSelected = s.id === selectedSessionId;
                  const langMeta = languages.find((l) => l.code === s.customerLocale);
                  const lastMsg = s.messages[s.messages.length - 1];

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSessionId(s.id)}
                      className={`w-full text-left rounded-xl p-3 border transition ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/70"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900">
                          {s.customerName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {langMeta?.nativeName}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 truncate">
                        {lastMsg ? lastMsg.text : t("chat.chatStarted")}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Chat Work Window (8 cols) */}
        <div className="lg:col-span-8">
          {activeSession ? (
            <div className="h-[680px] rounded-2xl border border-slate-200 bg-white shadow-md flex flex-col overflow-hidden">
              {/* Active Chat Header */}
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-extrabold text-slate-900">
                      {t("chat.chattingWith")}: {activeSession.customerName}
                    </h2>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                      {languages.find((l) => l.code === activeSession.customerLocale)?.nativeName}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {t("chat.sessionStart")}: {new Date(activeSession.createdAt).toLocaleTimeString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => closeSession(activeSession.id)}
                    className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-300 shadow-2xs transition active:scale-[0.98] cursor-pointer"
                  >
                    {t("chat.endChat")}
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
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

                  const isCounselor = msg.sender === "counselor";

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isCounselor ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-baseline gap-1.5 mb-1 px-1">
                        <span className="text-[11px] font-bold text-slate-700">
                          {msg.senderName}
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
                          isCounselor
                            ? "bg-indigo-600 text-white rounded-tr-xs"
                            : "bg-white text-slate-900 border border-slate-200 rounded-tl-xs"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Canned Quick Response Chips */}
              <div className="border-t border-slate-100 bg-white px-3 py-2 flex items-center gap-1.5 overflow-x-auto text-xs">
                <span className="text-[11px] font-bold text-slate-400 shrink-0">{t("chat.quickReplies")}</span>
                <button
                  type="button"
                  onClick={() => sendCannedResponse(t("chat.quickHelloText"))}
                  className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  {t("chat.quickHello")}
                </button>
                <button
                  type="button"
                  onClick={() => sendCannedResponse(t("chat.quickTechText"))}
                  className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  {t("chat.quickTech")}
                </button>
                <button
                  type="button"
                  onClick={() => sendCannedResponse(t("chat.quickHousingText"))}
                  className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  {t("chat.quickHousing")}
                </button>
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendCounselorMessage}
                className="border-t border-slate-200 bg-white p-3 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t("chat.replyPlaceholder")}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm shadow-indigo-600/20 hover:brightness-105 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {t("chat.send")}
                </button>
              </form>
            </div>
          ) : (
            <div className="h-[680px] rounded-2xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <span className="text-4xl mb-3">💬</span>
              <p className="text-sm font-bold text-slate-600">
                {t("chat.emptyWorkspace")}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {t("chat.emptyWorkspaceSub")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Admin 1:1 Direct Chat Modal */}
      {showAdminChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="relative flex flex-col h-[600px] max-h-[90vh] w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl text-slate-900 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-xs font-black text-white shadow-xs">
                  HQ
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <span>
                      {formatBilingual(
                        t("workspace.adminChatTitle"),
                        "본사 관리자 1:1 온라인 연락",
                      )}
                    </span>
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                      {formatBilingual(t("workspace.adminChatOnline"), "실시간 온라인")}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {formatBilingual(
                      t("workspace.adminChatRecipientCounselor"),
                      "수신자: 상담원",
                    )}:{" "}
                    {formatCounselorName({
                      rawName: currentCounselor.name,
                      roleTitle: t("chat.counselorRole"),
                      locale,
                      isBilingual,
                    })}{" "}
                    ({currentCounselor.phone})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminChatModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Message History Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100/50">
              {adminMessages.length === 0 ? (
                <div className="grid h-full place-content-center text-center text-xs text-slate-500">
                  <p className="text-2xl mb-2">💬</p>
                  <p>
                    {formatBilingual(
                      t("workspace.adminChatEmpty"),
                      "본사 관리자와 주고받은 메시지가 없습니다.",
                    )}
                  </p>
                  <p className="text-slate-400 mt-1">
                    {formatBilingual(
                      t("workspace.adminChatEmptyHint"),
                      "문의사항이나 지원 요청을 남겨주시면 관리자가 확인합니다.",
                    )}
                  </p>
                </div>
              ) : (
                adminMessages.map((msg) => {
                  const isAdmin = msg.sender === "admin";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                        <span className="font-bold text-slate-600">{msg.senderName}</span>
                        <span>·</span>
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                          isAdmin
                            ? "bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs"
                            : "bg-indigo-600 text-white rounded-tr-xs shadow-xs"
                        }`}
                      >
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Input Bar */}
            <div className="border-t border-slate-200 bg-white p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendAdminReply();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  placeholder={formatBilingual(
                    t("workspace.adminChatPlaceholder"),
                    "본사 관리자에게 전달할 메시지 입력...",
                  )}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={!adminReplyText.trim()}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm shadow-indigo-600/20 hover:brightness-105 active:scale-[0.98] disabled:opacity-50 transition cursor-pointer"
                >
                  {formatBilingual(t("workspace.adminChatSend"), "전송")}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
