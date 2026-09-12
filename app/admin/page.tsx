"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useLocale } from "@/lib/i18n/LocaleContext";
import {
  getRegisteredHelpers,
  type HelperProfile,
  HELPERS_REGISTRY_KEY,
} from "@/lib/helper/HelperContext";
import {
  getStoredCounselors,
  type Counselor,
} from "@/lib/chat/ChatContext";
import {
  getAdminMessages,
  sendAdminMessage,
  markAllAdminMessagesAsRead,
  ADMIN_MESSAGE_EVENT,
  type AdminMessage,
} from "@/lib/admin/adminMessage";
import { getRemainingDays, isAccessKeyExpired } from "@/lib/auth/accessKey";
import { services } from "@/lib/services";
import {
  getStoredReviews,
  type CustomerReview,
  REVIEW_EVENT,
} from "@/lib/review/reviewStore";

export default function AdminPage() {
  const { locale, t } = useLocale();
  const isKorean = locale === "ko";

  // Active Tab: "helpers" | "counselors" | "messages" | "reviews"
  const [activeTab, setActiveTab] = useState<
    "helpers" | "counselors" | "messages" | "reviews"
  >("helpers");

  // Search & Filter
  const [helperSearch, setHelperSearch] = useState("");
  const [helperFilter, setHelperFilter] = useState<"all" | "active" | "paused" | "expiring">("all");

  const [counselorSearch, setCounselorSearch] = useState("");
  const [counselorFilter, setCounselorFilter] = useState<"all" | "duty" | "break" | "expiring">("all");

  // Data state
  const [helpers, setHelpers] = useState<HelperProfile[]>([]);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);

  // Messaging active conversation state
  const [selectedPartner, setSelectedPartner] = useState<{
    type: "helper" | "counselor";
    id: string; // phone
    name: string;
  } | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [showDirectChatModal, setShowDirectChatModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const refreshData = useCallback(() => {
    setHelpers(getRegisteredHelpers());
    setCounselors(getStoredCounselors());
    setMessages(getAdminMessages());
    setReviews(getStoredReviews());
  }, []);

  useEffect(() => {
    refreshData();

    const handleMessageUpdate = () => {
      setMessages(getAdminMessages());
    };

    const handleHelperUpdate = () => {
      setHelpers(getRegisteredHelpers());
    };

    const handleReviewUpdate = () => {
      setReviews(getStoredReviews());
    };

    window.addEventListener(ADMIN_MESSAGE_EVENT, handleMessageUpdate);
    window.addEventListener("storage", handleHelperUpdate);
    window.addEventListener(REVIEW_EVENT, handleReviewUpdate);

    return () => {
      window.removeEventListener(ADMIN_MESSAGE_EVENT, handleMessageUpdate);
      window.removeEventListener("storage", handleHelperUpdate);
      window.removeEventListener(REVIEW_EVENT, handleReviewUpdate);
    };
  }, [refreshData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // Filtered Helpers
  const filteredHelpers = useMemo(() => {
    return helpers.filter((h) => {
      const name = h.contract?.name || "";
      const phone = h.phone;
      const regionsStr = h.contract?.regions.map((r) => `${r.sido} ${r.gungu}`).join(" ") || "";
      const servicesStr = h.contract?.services.join(" ") || "";
      const searchTarget = `${name} ${phone} ${regionsStr} ${servicesStr}`.toLowerCase();

      if (helperSearch && !searchTarget.includes(helperSearch.toLowerCase())) {
        return false;
      }

      const daysLeft = h.accessKeyExpiresAt ? getRemainingDays(h.accessKeyExpiresAt) : 0;
      if (helperFilter === "active" && !h.isActive) return false;
      if (helperFilter === "paused" && h.isActive) return false;
      if (helperFilter === "expiring" && daysLeft > 14) return false;

      return true;
    });
  }, [helpers, helperSearch, helperFilter]);

  // Filtered Counselors
  const filteredCounselors = useMemo(() => {
    return counselors.filter((c) => {
      const name = c.name;
      const phone = c.phone;
      const region = c.region || "";
      const specialty = c.specialty || "";
      const langs = c.languages.join(" ");
      const searchTarget = `${name} ${phone} ${region} ${specialty} ${langs}`.toLowerCase();

      if (counselorSearch && !searchTarget.includes(counselorSearch.toLowerCase())) {
        return false;
      }

      const daysLeft = c.accessKeyExpiresAt ? getRemainingDays(c.accessKeyExpiresAt) : 0;
      if (counselorFilter === "duty" && c.status !== "duty") return false;
      if (counselorFilter === "break" && c.status !== "break") return false;
      if (counselorFilter === "expiring" && daysLeft > 14) return false;

      return true;
    });
  }, [counselors, counselorSearch, counselorFilter]);

  // Key System Statistics
  const stats = useMemo(() => {
    const activeHelpersCount = helpers.filter((h) => h.isActive).length;
    const pausedHelpersCount = helpers.length - activeHelpersCount;

    const dutyCounselorsCount = counselors.filter((c) => c.status === "duty").length;
    const breakCounselorsCount = counselors.length - dutyCounselorsCount;

    let expiringKeysCount = 0;
    helpers.forEach((h) => {
      if (h.accessKeyExpiresAt && getRemainingDays(h.accessKeyExpiresAt) <= 14) {
        expiringKeysCount++;
      }
    });
    counselors.forEach((c) => {
      if (c.accessKeyExpiresAt && getRemainingDays(c.accessKeyExpiresAt) <= 14) {
        expiringKeysCount++;
      }
    });

    const unreadMessagesCount = messages.filter((m) => !m.isRead && m.sender === "partner").length;

    return {
      totalHelpers: helpers.length,
      activeHelpers: activeHelpersCount,
      pausedHelpers: pausedHelpersCount,
      totalCounselors: counselors.length,
      dutyCounselors: dutyCounselorsCount,
      breakCounselors: breakCounselorsCount,
      expiringKeys: expiringKeysCount,
      unreadMessages: unreadMessagesCount,
    };
  }, [helpers, counselors, messages]);

  // Open direct chat modal with a specific partner
  const handleOpenPartnerChat = (partner: {
    type: "helper" | "counselor";
    id: string;
    name: string;
  }) => {
    setSelectedPartner(partner);
    setShowDirectChatModal(true);
    markAllAdminMessagesAsRead(partner.id, "admin");
    setMessages(getAdminMessages());
  };

  // Send message from Admin to Partner
  const handleSendMessage = (customText?: string) => {
    const textToSend = customText || messageInput;
    if (!textToSend.trim() || !selectedPartner) return;

    sendAdminMessage({
      targetType: selectedPartner.type,
      targetId: selectedPartner.id,
      targetName: selectedPartner.name,
      sender: "admin",
      senderName: "sys.life.help 본사 관리자",
      text: textToSend.trim(),
    });

    setMessageInput("");
    setMessages(getAdminMessages());
    showToast(
      isKorean
        ? `${selectedPartner.name}님에게 메시지가 전송되었습니다.`
        : `Message sent to ${selectedPartner.name}`,
    );
  };

  // Quick message templates
  const QUICK_TEMPLATES = [
    {
      label: isKorean ? "🚨 긴급 출동 요청" : "🚨 Emergency Dispatch",
      text: isKorean
        ? "해당 관할 지역에 고객 긴급 출동 요청이 접수되었습니다. 즉시 출동 가능 여부 확인 부탁드립니다."
        : "An emergency dispatch request was received in your area. Please confirm immediate availability.",
    },
    {
      label: isKorean ? "🛡️ 보안코드 갱신 안내" : "🛡️ Key Renewal Notice",
      text: isKorean
        ? "3개월 전용 보안 접속 코드 만료일이 14일 이내로 다가왔습니다. 시스템 접속 유지를 위해 갱신을 진행해 주시기 바랍니다."
        : "Your 3-month security access key is expiring within 14 days. Please renew to maintain access.",
    },
    {
      label: isKorean ? "⏰ 근무 상태 확인" : "⏰ Status Check",
      text: isKorean
        ? "현재 실시간 근무 및 출동 대기 상태 확인 요청드립니다. 변동 사항이 있으시면 시스템에 즉시 반영 바랍니다."
        : "Please verify your active dispatch/work status in the system.",
    },
    {
      label: isKorean ? "📅 휴무일 변동 확인" : "📅 Schedule Check",
      text: isKorean
        ? "이번 달 및 다음 달 활동 일정 또는 개별 휴무일 변경 사항이 있으시면 워크스페이스 달력에서 갱신해 주시기 바랍니다."
        : "Please review and update your working days and day-off exclusions in the workspace calendar.",
    },
  ];

  // Active messages thread for selected partner
  const partnerMessages = useMemo(() => {
    if (!selectedPartner) return [];
    return getAdminMessages({ targetId: selectedPartner.id, targetType: selectedPartner.type });
  }, [selectedPartner, messages]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top System Admin Brand Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 sticky top-0 z-30 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-lg font-black tracking-tight text-white hover:text-blue-400 transition"
              title="sys.life.help 관리자 콘솔"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white shadow-md">
                sys
              </span>
              <span>sys.life.help</span>
            </Link>
            <span className="rounded-md bg-blue-950/80 px-2 py-0.5 text-[11px] font-extrabold text-blue-300 border border-blue-800/60 hidden sm:inline-block">
              통합 시스템 관리 콘솔
            </span>
          </div>

          {/* Direct Address & Quick Nav */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>https://sys.life.help</span>
            </div>

            <Link
              href="/"
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition"
              title="고객 서비스 메인 홈"
            >
              🏠 메인홈
            </Link>
            <Link
              href="/tech/workspace"
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition"
              title="헬퍼 워크스페이스 바로가기"
            >
              🛠️ 헬퍼 WS
            </Link>
            <Link
              href="/chat/counselor"
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition"
              title="상담원 워크스테이션 바로가기"
            >
              🎧 상담원 WS
            </Link>

            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 space-y-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-16 right-6 z-50 rounded-2xl border border-emerald-500 bg-slate-900 px-4 py-3 text-xs font-bold text-emerald-300 shadow-2xl animate-fade-in flex items-center gap-2">
            <span>✓</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* System Executive Metrics */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Helper Metrics */}
          <div
            onClick={() => setActiveTab("helpers")}
            className={`rounded-3xl border p-4 sm:p-5 cursor-pointer transition ${
              activeTab === "helpers"
                ? "border-blue-500 bg-blue-950/30 shadow-md shadow-blue-900/20"
                : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">🛠️ 등록 헬퍼 현황</span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{stats.totalHelpers}</span>
              <span className="text-xs text-slate-400">명</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold">
              <span className="text-emerald-400">출동 가능: {stats.activeHelpers}명</span>
              <span className="text-slate-600">|</span>
              <span className="text-amber-400">일시 중단: {stats.pausedHelpers}명</span>
            </div>
          </div>

          {/* Counselor Metrics */}
          <div
            onClick={() => setActiveTab("counselors")}
            className={`rounded-3xl border p-4 sm:p-5 cursor-pointer transition ${
              activeTab === "counselors"
                ? "border-indigo-500 bg-indigo-950/30 shadow-md shadow-indigo-900/20"
                : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">🎧 등록 상담원 현황</span>
              <span className="flex h-2 w-2 rounded-full bg-indigo-400"></span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{stats.totalCounselors}</span>
              <span className="text-xs text-slate-400">명</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold">
              <span className="text-emerald-400">근무 중: {stats.dutyCounselors}명</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">휴식: {stats.breakCounselors}명</span>
            </div>
          </div>

          {/* Security Keys Status */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">🛡️ 3개월 보안 코드</span>
              <span
                className={`flex h-2 w-2 rounded-full ${
                  stats.expiringKeys > 0 ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
                }`}
              ></span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {stats.totalHelpers + stats.totalCounselors}
              </span>
              <span className="text-xs text-slate-400">건 발급</span>
            </div>
            <div className="mt-2 text-[11px] font-semibold">
              {stats.expiringKeys > 0 ? (
                <span className="text-amber-400">⚠️ 14일 이내 갱신 대상: {stats.expiringKeys}건</span>
              ) : (
                <span className="text-emerald-400">✓ 전원 유효 기간 정상</span>
              )}
            </div>
          </div>

          {/* Online Messaging Metric */}
          <div
            onClick={() => setActiveTab("messages")}
            className={`rounded-3xl border p-4 sm:p-5 cursor-pointer transition ${
              activeTab === "messages"
                ? "border-emerald-500 bg-emerald-950/30 shadow-md shadow-emerald-900/20"
                : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">💬 실시간 온라인 메시지</span>
              {stats.unreadMessages > 0 ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white animate-pulse">
                  {stats.unreadMessages}
                </span>
              ) : (
                <span className="flex h-2 w-2 rounded-full bg-slate-500"></span>
              )}
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{messages.length}</span>
              <span className="text-xs text-slate-400">건 교환</span>
            </div>
            <div className="mt-2 text-[11px] font-semibold">
              {stats.unreadMessages > 0 ? (
                <span className="text-rose-400 font-bold">파트너 답장 미확인: {stats.unreadMessages}건</span>
              ) : (
                <span className="text-slate-400">모든 메시지 확인 완료</span>
              )}
            </div>
          </div>
        </section>

        {/* Tab Navigation Menu */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab("helpers")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${
                activeTab === "helpers"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🛠️ 헬퍼 관리 콘솔</span>
              <span className="rounded-md bg-slate-950 px-1.5 py-0.5 text-[10px] font-bold">
                {helpers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("counselors")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${
                activeTab === "counselors"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🎧 상담원 관리 콘솔</span>
              <span className="rounded-md bg-slate-950 px-1.5 py-0.5 text-[10px] font-bold">
                {counselors.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("messages")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${
                activeTab === "messages"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>💬 온라인 연락 센터</span>
              {stats.unreadMessages > 0 && (
                <span className="rounded-full bg-rose-600 px-1.5 py-0.2 text-[10px] font-black text-white">
                  {stats.unreadMessages}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("reviews")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${
                activeTab === "reviews"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>⭐ 고객 리뷰</span>
              <span className="rounded-md bg-slate-950 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                {reviews.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-mono hidden md:block">
            시스템 주소: <strong className="text-blue-400">sys.life.help</strong>
          </div>
        </div>

        {/* TAB 1: 🛠️ 헬퍼 관리 콘솔 */}
        {activeTab === "helpers" && (
          <section className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={helperSearch}
                  onChange={(e) => setHelperSearch(e.target.value)}
                  placeholder="헬퍼 이름, 전화번호, 지역, 서비스 검색..."
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 w-64"
                />
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setHelperFilter("all")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                      helperFilter === "all" ? "bg-slate-800 text-white" : "text-slate-400"
                    }`}
                  >
                    전체
                  </button>
                  <button
                    type="button"
                    onClick={() => setHelperFilter("active")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                      helperFilter === "active" ? "bg-emerald-950 text-emerald-300" : "text-slate-400"
                    }`}
                  >
                    출동 가능
                  </button>
                  <button
                    type="button"
                    onClick={() => setHelperFilter("paused")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                      helperFilter === "paused" ? "bg-amber-950 text-amber-300" : "text-slate-400"
                    }`}
                  >
                    일시 중단
                  </button>
                  <button
                    type="button"
                    onClick={() => setHelperFilter("expiring")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                      helperFilter === "expiring" ? "bg-rose-950 text-rose-300" : "text-slate-400"
                    }`}
                  >
                    만료 임박
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-400">
                조회된 헬퍼: <strong className="text-white">{filteredHelpers.length}</strong>명
              </div>
            </div>

            {/* Helpers List Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredHelpers.map((h) => {
                const contract = h.contract;
                const daysLeft = h.accessKeyExpiresAt ? getRemainingDays(h.accessKeyExpiresAt) : 0;
                const isExpiring = daysLeft <= 14;
                const unreadCount = getAdminMessages({ targetId: h.phone, targetType: "helper" }).filter(
                  (m) => !m.isRead && m.sender === "partner",
                ).length;

                return (
                  <div
                    key={h.phone}
                    className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm space-y-4 hover:border-slate-700 transition"
                  >
                    {/* Header: Name, Status, Phone */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-lg font-black text-white shadow-md">
                          {contract?.name ? contract.name.charAt(0) : "H"}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-extrabold text-white">
                              {contract?.name || `헬퍼 (${h.phone.slice(-4)})`}
                            </h3>
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-black border ${
                                h.isActive
                                  ? "bg-emerald-950/80 text-emerald-400 border-emerald-800/60"
                                  : "bg-amber-950/80 text-amber-400 border-amber-800/60"
                              }`}
                            >
                              {h.isActive ? "● 출동 가능" : "○ 일시 중단"}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-slate-400 mt-0.5">📱 {h.phone}</p>
                        </div>
                      </div>

                      {/* Online Contact Action Button */}
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenPartnerChat({
                            type: "helper",
                            id: h.phone,
                            name: contract?.name || `헬퍼 (${h.phone.slice(-4)})`,
                          })
                        }
                        className="relative flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-blue-500 shadow-sm transition"
                      >
                        <span>💬 온라인 연락</span>
                        {unreadCount > 0 && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white animate-pulse">
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* 3-Month Security Key Bar */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300 flex items-center gap-1.5">
                          <span>🛡️ 3개월 보안 접속 코드</span>
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-black ${
                            isExpiring
                              ? "bg-rose-950 text-rose-300 border border-rose-800/60 animate-pulse"
                              : "bg-blue-950 text-blue-300 border border-blue-800/60"
                          }`}
                        >
                          {isExpiring ? `D-${daysLeft} (갱신 필요)` : `D-${daysLeft}일 남음`}
                        </span>
                      </div>
                      <p className="font-mono text-xs font-bold text-slate-400 tracking-wider truncate">
                        {h.accessKey || "LH-AUTH-LOCAL-SECURED"}
                      </p>
                      {h.accessKeyExpiresAt && (
                        <p className="text-[10px] text-slate-500">
                          만료일시: {new Date(h.accessKeyExpiresAt).toLocaleDateString()}까지 유효
                        </p>
                      )}
                    </div>

                    {/* Regions & Services */}
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium">활동 지역:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {contract?.regions && contract.regions.length > 0 ? (
                            contract.regions.map((reg) => (
                              <span
                                key={`${reg.sido}-${reg.gungu}`}
                                className="rounded-lg bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-blue-300 border border-slate-700"
                              >
                                📍 {reg.sido} {reg.gungu}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 text-[11px]">지역 미지정</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium">서비스 분야:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {contract?.services && contract.services.length > 0 ? (
                            contract.services.map((slug) => {
                              const srvObj = services.find((s) => s.slug === slug);
                              return (
                                <span
                                  key={slug}
                                  className="rounded-lg bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300"
                                >
                                  {srvObj ? srvObj.icon : "🔧"} {srvObj ? t(`service.${srvObj.key}`) : slug}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-slate-500 text-[11px]">서비스 미선택</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Schedule & Calendar Exclusions */}
                    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-300 flex items-center gap-1.5">
                          <span>⏰ 주간 활동 요일:</span>
                        </span>
                        <div className="flex items-center gap-1">
                          {["월", "화", "수", "목", "금", "토", "일"].map((d) => {
                            const isWorking = contract?.availableDays.includes(d);
                            return (
                              <span
                                key={d}
                                className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-black ${
                                  isWorking
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-800 text-slate-600"
                                }`}
                              >
                                {d}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Hours Summary */}
                      <div className="text-[11px] text-slate-400">
                        기본 시간:{" "}
                        <strong className="text-white">
                          {contract?.availableHours || "24시간 즉시 출동 가능"}
                        </strong>
                      </div>

                      {/* Excluded Day-Off Dates (Unchecked Days) */}
                      {contract?.excludedDates && contract.excludedDates.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/60">
                          <span className="text-rose-400 font-bold flex items-center gap-1 text-[11px]">
                            <span>🚫</span>
                            <span>당월/익월 지정 개별 휴무일 ({contract.excludedDates.length}일):</span>
                          </span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {contract.excludedDates.map((dateStr) => (
                              <span
                                key={dateStr}
                                className="rounded bg-rose-950/60 px-1.5 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-800/50"
                              >
                                {dateStr}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB 2: 🎧 상담원 관리 콘솔 */}
        {activeTab === "counselors" && (
          <section className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={counselorSearch}
                  onChange={(e) => setCounselorSearch(e.target.value)}
                  placeholder="상담원 이름, 전화번호, 지역, 언어 검색..."
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 w-64"
                />
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCounselorFilter("all")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                      counselorFilter === "all" ? "bg-slate-800 text-white" : "text-slate-400"
                    }`}
                  >
                    전체
                  </button>
                  <button
                    type="button"
                    onClick={() => setCounselorFilter("duty")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                      counselorFilter === "duty" ? "bg-emerald-950 text-emerald-300" : "text-slate-400"
                    }`}
                  >
                    근무 중
                  </button>
                  <button
                    type="button"
                    onClick={() => setCounselorFilter("break")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                      counselorFilter === "break" ? "bg-amber-950 text-amber-300" : "text-slate-400"
                    }`}
                  >
                    휴식 중
                  </button>
                  <button
                    type="button"
                    onClick={() => setCounselorFilter("expiring")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                      counselorFilter === "expiring" ? "bg-rose-950 text-rose-300" : "text-slate-400"
                    }`}
                  >
                    만료 임박
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-400">
                조회된 상담원: <strong className="text-white">{filteredCounselors.length}</strong>명
              </div>
            </div>

            {/* Counselors Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredCounselors.map((c) => {
                const daysLeft = c.accessKeyExpiresAt ? getRemainingDays(c.accessKeyExpiresAt) : 0;
                const isExpiring = daysLeft <= 14;
                const unreadCount = getAdminMessages({ targetId: c.phone, targetType: "counselor" }).filter(
                  (m) => !m.isRead && m.sender === "partner",
                ).length;

                return (
                  <div
                    key={c.phone}
                    className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm space-y-4 hover:border-slate-700 transition"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-black text-white shadow-md">
                          {c.name.charAt(0)}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-extrabold text-white">{c.name}</h3>
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-black border ${
                                c.status === "duty"
                                  ? "bg-emerald-950/80 text-emerald-400 border-emerald-800/60"
                                  : "bg-amber-950/80 text-amber-400 border-amber-800/60"
                              }`}
                            >
                              {c.status === "duty" ? "● 실시간 근무 중" : "○ 일시 휴식"}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-slate-400 mt-0.5">📱 {c.phone}</p>
                        </div>
                      </div>

                      {/* Online Contact Action Button */}
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenPartnerChat({
                            type: "counselor",
                            id: c.phone,
                            name: c.name,
                          })
                        }
                        className="relative flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-indigo-500 shadow-sm transition"
                      >
                        <span>💬 온라인 연락</span>
                        {unreadCount > 0 && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white animate-pulse">
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Region & Specialty */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">활동 권역:</span>
                        <strong className="text-indigo-300">{c.region || "전국 배정 가능"}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">담당 전문 분야:</span>
                        <strong className="text-white">{c.specialty || "다문화 긴급 상담"}</strong>
                      </div>
                    </div>

                    {/* 3-Month Security Key Bar */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-300">🛡️ 3개월 보안 접속 코드</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-black ${
                            isExpiring
                              ? "bg-rose-950 text-rose-300 border border-rose-800/60 animate-pulse"
                              : "bg-indigo-950 text-indigo-300 border border-indigo-800/60"
                          }`}
                        >
                          {isExpiring ? `D-${daysLeft} (갱신 필요)` : `D-${daysLeft}일 남음`}
                        </span>
                      </div>
                      <p className="font-mono text-xs font-bold text-slate-400 tracking-wider truncate">
                        {c.accessKey || "LH-COUNSELOR-AUTH-KEY"}
                      </p>
                    </div>

                    {/* Supported Languages */}
                    <div>
                      <span className="text-xs text-slate-400 font-medium">지원 가능 언어 목록:</span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {c.languages.map((lang) => (
                          <span
                            key={lang}
                            className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-200"
                          >
                            🌐 {lang.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB 3: 💬 온라인 연락 센터 (Dedicated View) */}
        {activeTab === "messages" && (
          <section className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[640px] rounded-3xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-2xl">
            {/* Left Column: Partners List (4 cols) */}
            <div className="md:col-span-4 border-r border-slate-800 flex flex-col bg-slate-950/60">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>👥 파트너 목록</span>
                  <span className="text-xs text-slate-400 font-normal">
                    (헬퍼 {helpers.length}명 / 상담원 {counselors.length}명)
                  </span>
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {/* Helpers Subheader */}
                <div className="px-3 py-1.5 text-[11px] font-black text-blue-400 uppercase tracking-wider">
                  🛠️ 헬퍼 파트너
                </div>
                {helpers.map((h) => {
                  const partnerName = h.contract?.name || `헬퍼 (${h.phone.slice(-4)})`;
                  const isSelected = selectedPartner?.id === h.phone;
                  const unread = getAdminMessages({ targetId: h.phone, targetType: "helper" }).filter(
                    (m) => !m.isRead && m.sender === "partner",
                  ).length;

                  return (
                    <button
                      key={h.phone}
                      type="button"
                      onClick={() => {
                        setSelectedPartner({
                          type: "helper",
                          id: h.phone,
                          name: partnerName,
                        });
                        markAllAdminMessagesAsRead(h.phone, "admin");
                        setMessages(getAdminMessages());
                      }}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${
                        isSelected
                          ? "bg-blue-600 text-white font-bold"
                          : "text-slate-300 hover:bg-slate-800/70"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{partnerName}</p>
                        <p className="text-[11px] text-slate-400 truncate font-mono">{h.phone}</p>
                      </div>
                      {unread > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Counselors Subheader */}
                <div className="px-3 pt-3 pb-1.5 text-[11px] font-black text-indigo-400 uppercase tracking-wider">
                  🎧 상담원 파트너
                </div>
                {counselors.map((c) => {
                  const isSelected = selectedPartner?.id === c.phone;
                  const unread = getAdminMessages({ targetId: c.phone, targetType: "counselor" }).filter(
                    (m) => !m.isRead && m.sender === "partner",
                  ).length;

                  return (
                    <button
                      key={c.phone}
                      type="button"
                      onClick={() => {
                        setSelectedPartner({
                          type: "counselor",
                          id: c.phone,
                          name: c.name,
                        });
                        markAllAdminMessagesAsRead(c.phone, "admin");
                        setMessages(getAdminMessages());
                      }}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${
                        isSelected
                          ? "bg-indigo-600 text-white font-bold"
                          : "text-slate-300 hover:bg-slate-800/70"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{c.name}</p>
                        <p className="text-[11px] text-slate-400 truncate font-mono">{c.phone}</p>
                      </div>
                      {unread > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Conversation Stream & Input (8 cols) */}
            <div className="md:col-span-8 flex flex-col bg-slate-900/60">
              {selectedPartner ? (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-3.5">
                    <div>
                      <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                        <span>{selectedPartner.name}</span>
                        <span className="rounded bg-blue-950 px-1.5 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-800">
                          {selectedPartner.type === "helper" ? "🛠️ 헬퍼" : "🎧 상담원"}
                        </span>
                      </h4>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">📱 {selectedPartner.id}</p>
                    </div>
                  </div>

                  {/* Message History */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {partnerMessages.length === 0 ? (
                      <div className="grid h-full place-content-center text-center text-xs text-slate-500">
                        <p className="text-3xl mb-2">💬</p>
                        <p>{selectedPartner.name}님과 주고받은 메시지 이력이 없습니다.</p>
                        <p className="text-slate-600 mt-1">
                          아래 퀵 템플릿 버튼을 누르거나 직접 메시지를 입력하여 전송하세요.
                        </p>
                      </div>
                    ) : (
                      partnerMessages.map((m) => {
                        const isAdmin = m.sender === "admin";
                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                          >
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                              <span className="font-bold text-slate-300">{m.senderName}</span>
                              <span>·</span>
                              <span>
                                {new Date(m.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                                isAdmin
                                  ? "bg-blue-600 text-white rounded-tr-xs shadow-xs"
                                  : "bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-xs shadow-xs"
                              }`}
                            >
                              <p>{m.text}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Quick Action Templates Bar */}
                  <div className="border-t border-slate-800 bg-slate-950/80 p-2.5 flex flex-wrap gap-1.5">
                    {QUICK_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.label}
                        type="button"
                        onClick={() => handleSendMessage(tmpl.text)}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-blue-600 hover:text-white transition"
                        title={tmpl.text}
                      >
                        {tmpl.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Message Input */}
                  <div className="border-t border-slate-800 bg-slate-950 p-3">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="전달할 메시지를 입력하세요 (예: 긴급 출동 요청, 지원 안내 등)..."
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={!messageInput.trim()}
                        className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-blue-500 disabled:opacity-50 transition"
                      >
                        전송
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="grid h-full place-content-center text-center text-slate-500 p-8">
                  <span className="text-4xl mb-3">💬</span>
                  <p className="text-sm font-bold text-slate-300">
                    좌측 파트너 목록에서 대화할 헬퍼 또는 상담원을 선택해 주세요.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    선택한 파트너와 1:1 온라인 실시간 메시지를 주고받을 수 있습니다.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 4: ⭐ 익명 고객 리뷰 관리 콘솔 (contact@life.help) */}
        {activeTab === "reviews" && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>⭐</span>
                  <span>익명 고객 리뷰 수신함 (수신처: contact@life.help)</span>
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  고객들이 개인정보 입력 없이 자유롭게 작성하여 관리자 이메일(contact@life.help)로 전달된 실시간 이용 후기 목록입니다.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-xl border border-amber-500/40 bg-amber-950/40 px-3 py-1.5 text-xs font-bold text-amber-300">
                  총 {reviews.length}건 수신됨
                </span>
                <span className="rounded-xl border border-blue-500/40 bg-blue-950/40 px-3 py-1.5 text-xs font-bold text-blue-300 font-mono">
                  contact@life.help
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm space-y-3 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 text-base font-black">
                        {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                      </span>
                      <span className="text-xs font-bold text-white">({rev.rating}점)</span>
                      <span className="rounded-md bg-blue-950 px-2 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-800">
                        {rev.serviceCategory || "일반"}
                      </span>
                    </div>

                    <span className="rounded-md bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                      <span>✓</span>
                      <span>이메일 전달완료</span>
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-200 leading-relaxed">
                    <p className="whitespace-pre-wrap">&ldquo;{rev.content}&rdquo;</p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>수신처: contact@life.help</span>
                    <span>{new Date(rev.createdAt).toLocaleString()} · 익명 작성</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FLOATING DIRECT CHAT MODAL (When opened via [💬 온라인 연락] from any card) */}
        {showDirectChatModal && selectedPartner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="relative flex flex-col h-[600px] max-h-[90vh] w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl text-white overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">
                    sys
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      <span>{selectedPartner.name} 파트너 1:1 온라인 연락</span>
                      <span className="rounded bg-emerald-950 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-800">
                        ONLINE
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      수신처: {selectedPartner.type === "helper" ? "🛠️ 헬퍼" : "🎧 상담원"} (
                      {selectedPartner.id})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDirectChatModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Message History Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {partnerMessages.length === 0 ? (
                  <div className="grid h-full place-content-center text-center text-xs text-slate-500">
                    <p className="text-2xl mb-2">💬</p>
                    <p>주고받은 메시지가 없습니다.</p>
                    <p className="text-slate-600 mt-1">아래 템플릿 또는 직접 입력하여 메시지를 전송하세요.</p>
                  </div>
                ) : (
                  partnerMessages.map((m) => {
                    const isAdmin = m.sender === "admin";
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                          <span className="font-bold text-slate-300">{m.senderName}</span>
                          <span>·</span>
                          <span>
                            {new Date(m.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                            isAdmin
                              ? "bg-blue-600 text-white rounded-tr-xs shadow-xs"
                              : "bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-xs shadow-xs"
                          }`}
                        >
                          <p>{m.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick Template Buttons */}
              <div className="border-t border-slate-800 bg-slate-950/80 p-2.5 flex flex-wrap gap-1.5">
                {QUICK_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.label}
                    type="button"
                    onClick={() => handleSendMessage(tmpl.text)}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-blue-600 hover:text-white transition"
                    title={tmpl.text}
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <div className="border-t border-slate-800 bg-slate-950 p-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="파트너에게 전달할 메시지 입력..."
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-blue-500 disabled:opacity-50 transition"
                  >
                    전송
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
