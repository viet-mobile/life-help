"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { BrandLogo } from "@/components/shared/BrandLogo";
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
import { services, getLocalizedServiceName, getLocalizedLanguageName } from "@/lib/services";
import {
  getStoredReviews,
  type CustomerReview,
  REVIEW_EVENT,
} from "@/lib/review/reviewStore";
import {
  isAdminLoggedIn,
  getAdminSession,
  adminLogout,
  type AdminSession,
} from "@/lib/auth/adminAuth";
import {
  getStoredRequests,
  updateRequestStatus,
  deleteServiceRequest,
  type ServiceRequest,
  REQUEST_EVENT,
} from "@/lib/request/requestStore";
import {
  getStoredSupportPartners,
  getStoredSupportRequests,
  updateSupportPartnerStatus,
  updateSupportRequestStatus,
  type SupportPartner,
  type SupportRequest,
  SUPPORT_CATEGORIES,
} from "@/lib/support/supportStore";

export default function AdminPage() {
  const router = useRouter();
  const { locale, t } = useLocale();

  // Auth session check
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      router.replace("/admin/login");
      return;
    }
    setAdminSession(getAdminSession());
    setIsAuthChecked(true);
  }, [router]);

  const handleLogout = () => {
    adminLogout();
    router.push("/admin/login");
  };

  // Active Tab: "helpers" | "counselors" | "requests" | "messages" | "reviews" | "support"
  const [activeTab, setActiveTab] = useState<
    "helpers" | "counselors" | "requests" | "messages" | "reviews" | "support"
  >("helpers");

  // Search & Filter
  const [helperSearch, setHelperSearch] = useState("");
  const [helperFilter, setHelperFilter] = useState<"all" | "active" | "paused" | "expiring">("all");

  const [counselorSearch, setCounselorSearch] = useState("");
  const [counselorFilter, setCounselorFilter] = useState<"all" | "duty" | "break" | "expiring">("all");

  const [requestSearch, setRequestSearch] = useState("");
  const [requestFilter, setRequestFilter] = useState<"all" | "pending" | "dispatched" | "completed">("all");
  const [assigningRequest, setAssigningRequest] = useState<ServiceRequest | null>(null);
  const [assignHelperSearch, setAssignHelperSearch] = useState("");

  // Support State (5 Life Assistance Services & 050 Safe Virtual Phone System)
  const [supportPartners, setSupportPartners] = useState<SupportPartner[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [supportSubTab, setSupportSubTab] = useState<"partners" | "requests">("partners");
  const [supportPartnerFilter, setSupportPartnerFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [supportPartnerSearch, setSupportPartnerSearch] = useState("");
  const [supportRequestFilter, setSupportRequestFilter] = useState<"all" | "pending" | "matched" | "completed">("all");
  const [supportRequestSearch, setSupportRequestSearch] = useState("");
  const [matchingSupportReq, setMatchingSupportReq] = useState<SupportRequest | null>(null);

  // Data state
  const [helpers, setHelpers] = useState<HelperProfile[]>([]);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);

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
    setRequests(getStoredRequests());
    setSupportPartners(getStoredSupportPartners());
    setSupportRequests(getStoredSupportRequests());
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

    const handleRequestUpdate = () => {
      setRequests(getStoredRequests());
    };

    const handleSupportUpdate = () => {
      setSupportPartners(getStoredSupportPartners());
      setSupportRequests(getStoredSupportRequests());
    };

    window.addEventListener(ADMIN_MESSAGE_EVENT, handleMessageUpdate);
    window.addEventListener("storage", handleHelperUpdate);
    window.addEventListener(REVIEW_EVENT, handleReviewUpdate);
    window.addEventListener(REQUEST_EVENT, handleRequestUpdate);
    window.addEventListener("support_partners_changed", handleSupportUpdate);
    window.addEventListener("support_requests_changed", handleSupportUpdate);

    return () => {
      window.removeEventListener(ADMIN_MESSAGE_EVENT, handleMessageUpdate);
      window.removeEventListener("storage", handleHelperUpdate);
      window.removeEventListener(REVIEW_EVENT, handleReviewUpdate);
      window.removeEventListener(REQUEST_EVENT, handleRequestUpdate);
      window.removeEventListener("support_partners_changed", handleSupportUpdate);
      window.removeEventListener("support_requests_changed", handleSupportUpdate);
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
      const servicesStr = (h.contract?.services.map((s) => getLocalizedServiceName(s, locale)).join(" ") || "") + " " + (h.contract?.services.join(" ") || "");
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
  }, [helpers, helperSearch, helperFilter, locale]);

  // Filtered Counselors
  const filteredCounselors = useMemo(() => {
    return counselors.filter((c) => {
      const name = c.name;
      const phone = c.phone;
      const region = c.region || "";
      const specialty = c.specialty || "";
      const langs = c.languages.join(" ");
      const localizedLangs = c.languages.map((l) => getLocalizedLanguageName(l, locale)).join(" ");
      const searchTarget = `${name} ${phone} ${region} ${specialty} ${langs} ${localizedLangs}`.toLowerCase();

      if (counselorSearch && !searchTarget.includes(counselorSearch.toLowerCase())) {
        return false;
      }

      const daysLeft = c.accessKeyExpiresAt ? getRemainingDays(c.accessKeyExpiresAt) : 0;
      if (counselorFilter === "duty" && c.status !== "duty") return false;
      if (counselorFilter === "break" && c.status !== "break") return false;
      if (counselorFilter === "expiring" && daysLeft > 14) return false;

      return true;
    });
  }, [counselors, counselorSearch, counselorFilter, locale]);

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const localizedService = getLocalizedServiceName(r.serviceSlug || r.serviceName, locale);
      const searchTarget = `${r.serviceName} ${localizedService} ${r.sido} ${r.gungu} ${r.address} ${r.phone} ${r.description} ${r.assignedHelper?.name || ""}`.toLowerCase();
      if (requestSearch && !searchTarget.includes(requestSearch.toLowerCase())) {
        return false;
      }
      if (requestFilter === "pending" && r.status !== "pending") return false;
      if (requestFilter === "dispatched" && r.status !== "dispatched") return false;
      if (requestFilter === "completed" && r.status !== "completed") return false;
      return true;
    });
  }, [requests, requestSearch, requestFilter, locale]);

  // Key System Statistics
  const stats = useMemo(() => {
    const activeHelpersCount = helpers.filter((h) => h.isActive).length;
    const pausedHelpersCount = helpers.length - activeHelpersCount;

    const dutyCounselorsCount = counselors.filter((c) => c.status === "duty").length;
    const breakCounselorsCount = counselors.length - dutyCounselorsCount;

    const pendingRequestsCount = requests.filter((r) => r.status === "pending").length;
    const dispatchedRequestsCount = requests.filter((r) => r.status === "dispatched").length;
    const completedRequestsCount = requests.filter((r) => r.status === "completed").length;

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
    const pendingSupportPartnersCount = supportPartners.filter((p) => p.status === "pending").length;

    return {
      totalHelpers: helpers.length,
      activeHelpers: activeHelpersCount,
      pausedHelpers: pausedHelpersCount,
      totalCounselors: counselors.length,
      dutyCounselors: dutyCounselorsCount,
      breakCounselors: breakCounselorsCount,
      totalRequests: requests.length,
      pendingRequests: pendingRequestsCount,
      dispatchedRequests: dispatchedRequestsCount,
      completedRequests: completedRequestsCount,
      expiringKeys: expiringKeysCount,
      unreadMessages: unreadMessagesCount,
      totalSupportPartners: supportPartners.length,
      pendingSupportPartners: pendingSupportPartnersCount,
      totalSupportRequests: supportRequests.length,
    };
  }, [helpers, counselors, messages, requests, supportPartners, supportRequests]);

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
      senderName: "LIFE.HELP HQ",
      text: textToSend.trim(),
    });

    setMessageInput("");
    setMessages(getAdminMessages());
    showToast(`${selectedPartner.name} - ${t("admin.messageSentSuccess")}`);
  };

  // Quick message templates
  const QUICK_TEMPLATES = [
    {
      label: t("admin.templateDispatch"),
      text: t("admin.templateDispatchText"),
    },
    {
      label: t("admin.templateKeyRenewal"),
      text: t("admin.templateKeyRenewalText"),
    },
    {
      label: t("admin.templateStatusCheck"),
      text: t("admin.templateStatusCheckText"),
    },
    {
      label: t("admin.templateScheduleCheck"),
      text: t("admin.templateScheduleCheckText"),
    },
  ];

  // Active messages thread for selected partner
  const partnerMessages = useMemo(() => {
    if (!selectedPartner) return [];
    return getAdminMessages({ targetId: selectedPartner.id, targetType: selectedPartner.type });
  }, [selectedPartner, messages]);

  const DAY_NAMES: Record<string, string> = {
    "월": t("workspace.dayMon") || "월",
    "화": t("workspace.dayTue") || "화",
    "수": t("workspace.dayWed") || "수",
    "목": t("workspace.dayThu") || "목",
    "금": t("workspace.dayFri") || "금",
    "토": t("workspace.daySat") || "토",
    "일": t("workspace.daySun") || "일",
  };

  if (!isAuthChecked) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-xs text-slate-400 font-bold">{t("admin.sessionVerifying")}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top System Admin Brand Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 sticky top-0 z-30 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6 sm:py-3 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-base sm:text-lg font-black tracking-tight text-white hover:text-blue-400 transition shrink-0"
              title={t("admin.brandTitle")}
            >
              <BrandLogo size="md" priority />
              <span className="font-black text-white text-base sm:text-lg">HQ</span>
            </Link>
            <span className="rounded-md bg-blue-950/80 px-2 py-0.5 text-[11px] font-extrabold text-blue-300 border border-blue-800/60 hidden sm:inline-block">
              {t("admin.brandTitle")}
            </span>
            {adminSession && (
              <span className="rounded-md bg-indigo-950/80 px-2 py-0.5 text-[11px] font-bold text-indigo-300 border border-indigo-800/60 hidden lg:inline-block">
                👑 [{adminSession.role}] {adminSession.email}
              </span>
            )}
          </div>

          {/* Quick Nav */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <Link
              href="/"
              className="rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200 active:scale-[0.98] cursor-pointer shrink-0"
              title={t("admin.mainHome")}
            >
              <span>🏠</span>
              <span className="hidden sm:inline"> {t("admin.mainHome")}</span>
            </Link>
            <Link
              href="/tech/workspace"
              className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200 active:scale-[0.98] cursor-pointer hidden sm:inline-block"
              title={t("admin.helperWs")}
            >
              🛠️ {t("admin.helperWs")}
            </Link>
            <Link
              href="/chat/counselor"
              className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200 active:scale-[0.98] cursor-pointer hidden sm:inline-block"
              title={t("admin.counselorWs")}
            >
              🎧 {t("admin.counselorWs")}
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-rose-800/70 bg-rose-950/50 px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-900 hover:text-white transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center gap-1 shrink-0"
              title={t("admin.logout")}
            >
              <span>🚪</span>
              <span className="hidden sm:inline">{t("admin.logout")}</span>
            </button>

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
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
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
              <span className="text-xs font-bold text-slate-400">🛠️ {t("admin.statHelpers")}</span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{stats.totalHelpers}</span>
              <span className="text-xs text-slate-400">{t("admin.unitPersons")}</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold flex-wrap">
              <span className="text-emerald-400">{t("admin.statusActive")}: {stats.activeHelpers}</span>
              <span className="text-slate-600">|</span>
              <span className="text-amber-400">{t("admin.statusPaused")}: {stats.pausedHelpers}</span>
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
              <span className="text-xs font-bold text-slate-400">🎧 {t("admin.statCounselors")}</span>
              <span className="flex h-2 w-2 rounded-full bg-indigo-400"></span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{stats.totalCounselors}</span>
              <span className="text-xs text-slate-400">{t("admin.unitPersons")}</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold flex-wrap">
              <span className="text-emerald-400">{t("admin.statusDuty")}: {stats.dutyCounselors}</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">{t("admin.statusBreak")}: {stats.breakCounselors}</span>
            </div>
          </div>

          {/* Emergency Service Request Metric */}
          <div
            onClick={() => setActiveTab("requests")}
            className={`rounded-3xl border p-4 sm:p-5 cursor-pointer transition ${
              activeTab === "requests"
                ? "border-amber-500 bg-amber-950/30 shadow-md shadow-amber-900/20"
                : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">📋 {t("admin.statRequests")}</span>
              {stats.pendingRequests > 0 ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white animate-pulse">
                  {stats.pendingRequests}
                </span>
              ) : (
                <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
              )}
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{stats.totalRequests}</span>
              <span className="text-xs text-slate-400">{t("admin.unitCases")}</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold flex-wrap">
              <span className="text-rose-400 font-bold">{t("admin.statusPending")}: {stats.pendingRequests}</span>
              <span className="text-slate-600">|</span>
              <span className="text-blue-400">{t("admin.statusDispatched")}: {stats.dispatchedRequests}</span>
            </div>
          </div>

          {/* Key Security Session Metric */}
          <div
            className={`rounded-3xl border p-4 sm:p-5 transition border-slate-800 bg-slate-900/70`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">🔐 {t("admin.statSecurityKeys")}</span>
              <span className="flex h-2 w-2 rounded-full bg-blue-400"></span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">90{t("admin.unitDays")}</span>
              <span className="text-xs text-slate-400">{t("admin.autoCycle")}</span>
            </div>
            <div className="mt-2 text-[11px] font-semibold truncate">
              {stats.expiringKeys > 0 ? (
                <span className="text-amber-400">⚠️ {t("admin.statusWithin14Days")}: {stats.expiringKeys}{t("admin.unitCases")}</span>
              ) : (
                <span className="text-emerald-400">✓ {t("admin.statusAllNormal")}</span>
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
              <span className="text-xs font-bold text-slate-400">💬 {t("admin.statMessages")}</span>
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
              <span className="text-xs text-slate-400">{t("admin.unitCases")}</span>
            </div>
            <div className="mt-2 text-[11px] font-semibold truncate">
              {stats.unreadMessages > 0 ? (
                <span className="text-rose-400 font-bold">{t("admin.statusUnread")}: {stats.unreadMessages}{t("admin.unitCases")}</span>
              ) : (
                <span className="text-slate-400">{t("admin.statusAllRead")}</span>
              )}
            </div>
          </div>

          {/* Support Partners & 050 Matching Metric */}
          <div
            onClick={() => setActiveTab("support")}
            className={`rounded-3xl border p-4 sm:p-5 cursor-pointer transition ${
              activeTab === "support"
                ? "border-purple-500 bg-purple-950/30 shadow-md shadow-purple-900/20"
                : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">🤝 5대 생활도움 & 050</span>
              {stats.pendingSupportPartners > 0 ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-slate-950 animate-pulse">
                  {stats.pendingSupportPartners}
                </span>
              ) : (
                <span className="flex h-2 w-2 rounded-full bg-purple-400"></span>
              )}
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{supportPartners.length}</span>
              <span className="text-xs text-slate-400">명 파트너</span>
            </div>
            <div className="mt-2 text-[11px] font-semibold truncate">
              {stats.pendingSupportPartners > 0 ? (
                <span className="text-amber-400 font-bold">승인대기: {stats.pendingSupportPartners}명 | 050: {supportRequests.length}건</span>
              ) : (
                <span className="text-slate-400">050 안심요청: {supportRequests.length}건</span>
              )}
            </div>
          </div>
        </section>

        {/* Tab Navigation Menu */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab("helpers")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all duration-200 cursor-pointer active:scale-[0.98] whitespace-nowrap ${
                activeTab === "helpers"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <span>🛠️ {t("admin.tabHelpers")}</span>
              <span className="rounded-md bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-bold">
                {helpers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("counselors")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all duration-200 cursor-pointer active:scale-[0.98] whitespace-nowrap ${
                activeTab === "counselors"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <span>🎧 {t("admin.tabCounselors")}</span>
              <span className="rounded-md bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-bold">
                {counselors.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("requests")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all duration-200 cursor-pointer active:scale-[0.98] whitespace-nowrap ${
                activeTab === "requests"
                  ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <span>📋 {t("admin.tabRequests")}</span>
              <span className="rounded-md bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                {requests.length}
              </span>
              {stats.pendingRequests > 0 && (
                <span className="rounded-full bg-rose-600 px-1.5 py-0.2 text-[9px] font-black text-white animate-pulse">
                  {stats.pendingRequests} {t("admin.statusPending")}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("support")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all duration-200 cursor-pointer active:scale-[0.98] whitespace-nowrap ${
                activeTab === "support"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <span>🤝 생활도움 파트너 & 050 매칭</span>
              <span className="rounded-md bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-bold text-purple-300">
                {supportPartners.length}명
              </span>
              {stats.pendingSupportPartners > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[9px] font-black text-slate-950 animate-pulse">
                  {stats.pendingSupportPartners}건 승인대기
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("messages")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all duration-200 cursor-pointer active:scale-[0.98] whitespace-nowrap ${
                activeTab === "messages"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <span>💬 {t("admin.tabMessages")}</span>
              {stats.unreadMessages > 0 && (
                <span className="rounded-full bg-rose-600 px-1.5 py-0.2 text-[10px] font-black text-white">
                  {stats.unreadMessages}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("reviews")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all duration-200 cursor-pointer active:scale-[0.98] whitespace-nowrap ${
                activeTab === "reviews"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <span>⭐ {t("admin.tabReviews")}</span>
              <span className="rounded-md bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                {reviews.length}
              </span>
            </button>
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
                  placeholder={t("admin.searchHelperPlaceholder")}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 w-64"
                />
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setHelperFilter("all")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                      helperFilter === "all" ? "bg-slate-800 text-white shadow-xs" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {t("admin.filterAll")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHelperFilter("active")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                      helperFilter === "active" ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60 shadow-xs" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {t("admin.filterActive")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHelperFilter("paused")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                      helperFilter === "paused" ? "bg-amber-950 text-amber-300 border border-amber-800/60 shadow-xs" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {t("admin.filterPaused")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHelperFilter("expiring")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                      helperFilter === "expiring" ? "bg-rose-950 text-rose-300 border border-rose-800/60 shadow-xs" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {t("admin.filterExpiring")}
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-400">
                {t("admin.statHelpers")}: <strong className="text-white">{filteredHelpers.length}</strong>{t("admin.unitPersons")}
              </div>
            </div>

            {/* Helpers List Grid */}
            {filteredHelpers.length === 0 ? (
              <div className="grid h-64 place-content-center rounded-3xl border border-slate-800 bg-slate-900/40 text-center text-xs text-slate-500">
                <p className="text-3xl mb-2">🛠️</p>
                <p>{t("admin.noHelpers")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredHelpers.map((h) => {
                  const contract = h.contract;
                  const daysLeft = h.accessKeyExpiresAt ? getRemainingDays(h.accessKeyExpiresAt) : 0;
                  const isExpiring = daysLeft <= 14;
                  const unreadCount = getAdminMessages({ targetId: h.phone, targetType: "helper" }).filter(
                    (m) => !m.isRead && m.sender === "partner",
                  ).length;
                  const helperDisplayName = contract?.name || `Helper (${h.phone.slice(-4)})`;

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
                                {helperDisplayName}
                              </h3>
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-black border ${
                                  h.isActive
                                    ? "bg-emerald-950/80 text-emerald-400 border-emerald-800/60"
                                    : "bg-amber-950/80 text-amber-400 border-amber-800/60"
                                }`}
                              >
                                {h.isActive ? `● ${t("admin.statusActive")}` : `○ ${t("admin.statusPaused")}`}
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
                              name: helperDisplayName,
                            })
                          }
                          className="relative flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-extrabold text-white hover:brightness-105 shadow-md shadow-blue-600/20 active:scale-[0.98] cursor-pointer transition-all duration-200"
                        >
                          <span>💬 {t("admin.partnerChat")}</span>
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
                            <span>🛡️ {t("admin.securityKeyLabel")}</span>
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-black ${
                              isExpiring
                                ? "bg-rose-950 text-rose-300 border border-rose-800/60 animate-pulse"
                                : "bg-blue-950 text-blue-300 border border-blue-800/60"
                            }`}
                          >
                            {isExpiring ? `D-${daysLeft} (${t("admin.renewalRequired")})` : `D-${daysLeft} ${t("admin.daysLeft")}`}
                          </span>
                        </div>
                        <p className="font-mono text-xs font-bold text-slate-400 tracking-wider truncate">
                          {h.accessKey || "LH-AUTH-LOCAL-SECURED"}
                        </p>
                        {h.accessKeyExpiresAt && (
                          <p className="text-[10px] text-slate-500">
                            {t("admin.expiresAtLabel")}: {new Date(h.accessKeyExpiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {/* Regions & Services */}
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-400 font-medium">{t("admin.activeRegionLabel")}:</span>
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
                              <span className="text-slate-500 text-[11px]">{t("admin.unspecifiedRegion")}</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-400 font-medium">{t("admin.serviceCategoryLabel")}:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {contract?.services && contract.services.length > 0 ? (
                              contract.services.map((slug) => {
                                const srvName = getLocalizedServiceName(slug, locale);
                                const srvObj = services.find((s) => s.slug === slug || s.key === slug);
                                return (
                                  <span
                                    key={slug}
                                    className="rounded-lg bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300"
                                  >
                                    {srvObj ? srvObj.icon : "🔧"} {srvName}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-slate-500 text-[11px]">{t("admin.unselectedService")}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Schedule & Calendar Exclusions */}
                      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-3 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-300 flex items-center gap-1.5">
                            <span>⏰ {t("admin.weeklyScheduleLabel")}:</span>
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
                                  {DAY_NAMES[d] || d}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Hours Summary */}
                        <div className="text-[11px] text-slate-400">
                          {t("admin.standardHoursLabel")}:{" "}
                          <strong className="text-white">
                            {contract?.availableHours || t("admin.hours24")}
                          </strong>
                        </div>

                        {/* Excluded Day-Off Dates (Unchecked Days) */}
                        {contract?.excludedDates && contract.excludedDates.length > 0 && (
                          <div className="pt-2 border-t border-slate-800/60">
                            <span className="text-rose-400 font-bold flex items-center gap-1 text-[11px]">
                              <span>🚫</span>
                              <span>{t("admin.individualDayOffLabel")} ({contract.excludedDates.length}):</span>
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
            )}
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
                  placeholder={t("admin.searchCounselorPlaceholder")}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 w-64"
                />
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCounselorFilter("all")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                      counselorFilter === "all" ? "bg-slate-800 text-white shadow-xs" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {t("admin.filterAll")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCounselorFilter("duty")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                      counselorFilter === "duty" ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60 shadow-xs" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {t("admin.filterDuty")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCounselorFilter("break")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                      counselorFilter === "break" ? "bg-amber-950 text-amber-300 border border-amber-800/60 shadow-xs" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {t("admin.filterBreak")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCounselorFilter("expiring")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                      counselorFilter === "expiring" ? "bg-rose-950 text-rose-300 border border-rose-800/60 shadow-xs" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {t("admin.filterExpiring")}
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-400">
                {t("admin.statCounselors")}: <strong className="text-white">{filteredCounselors.length}</strong>{t("admin.unitPersons")}
              </div>
            </div>

            {/* Counselors Grid */}
            {filteredCounselors.length === 0 ? (
              <div className="grid h-64 place-content-center rounded-3xl border border-slate-800 bg-slate-900/40 text-center text-xs text-slate-500">
                <p className="text-3xl mb-2">🎧</p>
                <p>{t("admin.noCounselors")}</p>
              </div>
            ) : (
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
                                {c.status === "duty" ? `● ${t("admin.statusDuty")}` : `○ ${t("admin.statusBreak")}`}
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
                          className="relative flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3.5 py-2 text-xs font-extrabold text-white hover:brightness-105 shadow-md shadow-indigo-600/20 active:scale-[0.98] cursor-pointer transition-all duration-200"
                        >
                          <span>💬 {t("admin.partnerChat")}</span>
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
                          <span className="text-slate-400">{t("admin.counselorRegionLabel")}:</span>
                          <strong className="text-indigo-300">{c.region || t("admin.counselorNationwide")}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">{t("admin.counselorSpecialtyLabel")}:</span>
                          <strong className="text-white">{c.specialty || t("admin.counselorSpecialtyDefault")}</strong>
                        </div>
                      </div>

                      {/* 3-Month Security Key Bar */}
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-300">🛡️ {t("admin.securityKeyLabel")}</span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-black ${
                              isExpiring
                                ? "bg-rose-950 text-rose-300 border border-rose-800/60 animate-pulse"
                                : "bg-indigo-950 text-indigo-300 border border-indigo-800/60"
                            }`}
                          >
                            {isExpiring ? `D-${daysLeft} (${t("admin.renewalRequired")})` : `D-${daysLeft} ${t("admin.daysLeft")}`}
                          </span>
                        </div>
                        <p className="font-mono text-xs font-bold text-slate-400 tracking-wider truncate">
                          {c.accessKey || "LH-COUNSELOR-AUTH-KEY"}
                        </p>
                      </div>

                      {/* Supported Languages */}
                      <div>
                        <span className="text-xs text-slate-400 font-medium">{t("admin.counselorLangsLabel")}:</span>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {c.languages.map((lang) => (
                            <span
                              key={lang}
                              className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-200"
                            >
                              🌐 {getLocalizedLanguageName(lang, locale)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: 📋 고객 의뢰 접수 현황 */}
        {activeTab === "requests" && (
          <section className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={requestSearch}
                  onChange={(e) => setRequestSearch(e.target.value)}
                  placeholder={t("admin.searchRequestPlaceholder")}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500 w-72"
                />
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setRequestFilter("all")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                      requestFilter === "all" ? "bg-slate-800 text-white shadow-xs" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {t("admin.filterAll")} ({requests.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestFilter("pending")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                      requestFilter === "pending"
                        ? "bg-amber-950 text-amber-300 border border-amber-800/60 shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {t("admin.filterPending")} ({stats.pendingRequests})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestFilter("dispatched")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                      requestFilter === "dispatched"
                        ? "bg-blue-950 text-blue-300 border border-blue-800/60 shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {t("admin.filterDispatched")} ({stats.dispatchedRequests})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestFilter("completed")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                      requestFilter === "completed"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60 shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {t("admin.filterCompleted")} ({stats.completedRequests})
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-400">
                {t("admin.statRequests")}: <strong className="text-white">{filteredRequests.length}</strong>{t("admin.unitCases")}
              </div>
            </div>

            {/* Requests Cards Grid */}
            {filteredRequests.length === 0 ? (
              <div className="grid h-64 place-content-center rounded-3xl border border-slate-800 bg-slate-900/40 text-center text-xs text-slate-500">
                <p className="text-3xl mb-2">📋</p>
                <p>{t("admin.noRequests")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredRequests.map((req) => {
                  const isPending = req.status === "pending";
                  const isDispatched = req.status === "dispatched";
                  const isCompleted = req.status === "completed";
                  const localizedServiceName = getLocalizedServiceName(req.serviceSlug || req.serviceName, locale);

                  return (
                    <div
                      key={req.id}
                      className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm space-y-4 hover:border-slate-700 transition"
                    >
                      {/* Top Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-600/20 border border-amber-500/30 text-2xl shadow-md">
                            {req.serviceIcon || "🛠️"}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-extrabold text-white">
                                {localizedServiceName}
                              </h3>
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-black border ${
                                  isPending
                                    ? "bg-amber-950/80 text-amber-400 border-amber-800/60 animate-pulse"
                                    : isDispatched
                                    ? "bg-blue-950/80 text-blue-400 border-blue-800/60"
                                    : isCompleted
                                    ? "bg-emerald-950/80 text-emerald-400 border-emerald-800/60"
                                    : "bg-slate-800 text-slate-400 border-slate-700"
                                }`}
                              >
                                {isPending
                                  ? `⏳ ${t("admin.statusPending")}`
                                  : isDispatched
                                  ? `🚚 ${t("admin.statusDispatched")}`
                                  : isCompleted
                                  ? `✓ ${t("admin.statusCompleted")}`
                                  : "✕"}
                              </span>
                            </div>
                            <p className="text-xs font-mono text-slate-400 mt-0.5">
                              {new Date(req.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Top Action / Delete */}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(t("admin.deleteConfirm"))) {
                              deleteServiceRequest(req.id);
                              refreshData();
                              showToast(t("admin.toastDeleted"));
                            }
                          }}
                          className="rounded-lg p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-all duration-200 active:scale-[0.98] cursor-pointer text-xs"
                          title={t("admin.btnDelete")}
                        >
                          🗑️
                        </button>
                      </div>

                      {/* Customer Info & Location */}
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-semibold">📍 {t("admin.dispatchLocationLabel")}:</span>
                          <span className="text-slate-200 font-bold text-right">
                            {req.sido} {req.gungu}
                          </span>
                        </div>
                        <div className="text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                          {req.address}
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                          <span className="text-slate-400 font-semibold">📞 {t("admin.customerPhoneLabel")}:</span>
                          <a
                            href={`tel:${req.phone}`}
                            className="text-amber-300 font-mono font-black hover:underline"
                          >
                            {req.phone}
                          </a>
                        </div>
                      </div>

                      {/* Problem Description */}
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-1.5 text-xs">
                        <div className="text-slate-400 font-semibold">📝 {t("admin.requestDescLabel")}:</div>
                        <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                          &ldquo;{req.description}&rdquo;
                        </p>
                        {req.fileNames && req.fileNames.length > 0 && (
                          <div className="pt-1 text-[11px] text-slate-400 flex items-center gap-1">
                            <span>📷 {t("admin.attachedPhotosLabel")}:</span>
                            <span className="text-blue-400 font-mono">
                              {req.fileNames.join(", ")}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Assigned Helper Info (If dispatched or completed) */}
                      {req.assignedHelper && (
                        <div className="rounded-2xl border border-blue-800/40 bg-blue-950/30 p-3.5 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-blue-300 flex items-center gap-1.5">
                              <span>🛠️ {t("admin.assignedHelperLabel")}:</span>
                              <span className="text-white">{req.assignedHelper.name}</span>
                              <span className="text-slate-400 font-mono">({req.assignedHelper.phone})</span>
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenPartnerChat({
                                  type: "helper",
                                  id: req.assignedHelper!.phone,
                                  name: req.assignedHelper!.name,
                                })
                              }
                              className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1 text-[11px] font-extrabold text-white hover:brightness-105 transition-all duration-200 shadow-xs active:scale-[0.98] cursor-pointer"
                            >
                              💬 {t("admin.directChat1to1")}
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center justify-between">
                            <span>{t("admin.dispatchTimeLabel")}: {new Date(req.assignedHelper.dispatchedAt).toLocaleString()}</span>
                            <span className="text-emerald-400 font-bold">✓ {t("admin.emergencyNotified")}</span>
                          </div>
                        </div>
                      )}

                      {/* Bottom Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => {
                              setAssigningRequest(req);
                              setAssignHelperSearch("");
                            }}
                            className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 px-4 py-2.5 text-xs font-black text-white hover:brightness-105 active:scale-[0.98] shadow-md shadow-amber-950/40 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                          >
                            <span>⚡</span>
                            <span>{t("admin.btnAssignHelper")}</span>
                          </button>
                        )}

                        {isDispatched && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                updateRequestStatus(req.id, "completed");
                                refreshData();
                                showToast(t("admin.toastCompleted"));
                              }}
                              className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-black text-white hover:brightness-105 active:scale-[0.98] transition-all duration-200 shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <span>✓</span>
                              <span>{t("admin.btnComplete")}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAssigningRequest(req);
                                setAssignHelperSearch("");
                              }}
                              className="rounded-xl border border-blue-700/80 bg-blue-950/60 px-3.5 py-2.5 text-xs font-bold text-blue-300 hover:bg-blue-900 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                            >
                              🔄 {t("admin.btnReassignHelper")}
                            </button>
                          </>
                        )}

                        {isCompleted && (
                          <button
                            type="button"
                            onClick={() => {
                              updateRequestStatus(req.id, "pending");
                              refreshData();
                              showToast(t("admin.toastReverted"));
                            }}
                            className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                          >
                            {t("admin.btnRevertPending")}
                          </button>
                        )}

                        {isPending && (
                          <button
                            type="button"
                            onClick={() => {
                              updateRequestStatus(req.id, "cancelled");
                              refreshData();
                              showToast(t("admin.toastCancelled"));
                            }}
                            className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition-all duration-200 active:scale-[0.98] cursor-pointer"
                          >
                            {t("admin.btnCancelDispatch")}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 4: 💬 온라인 연락 센터 (Dedicated View) */}
        {activeTab === "messages" && (
          <section className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[640px] rounded-3xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-2xl">
            {/* Left Column: Partners List (4 cols) */}
            <div className="md:col-span-4 border-r border-slate-800 flex flex-col bg-slate-950/60">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>👥 {t("admin.chatPartnerList")}</span>
                  <span className="text-xs text-slate-400 font-normal">
                    ({t("admin.helpersSubheader")} {helpers.length}{t("admin.unitPersons")} / {t("admin.counselorsSubheader")} {counselors.length}{t("admin.unitPersons")})
                  </span>
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {/* Helpers Subheader */}
                <div className="px-3 py-1.5 text-[11px] font-black text-blue-400 uppercase tracking-wider">
                  🛠️ {t("admin.helpersSubheader")}
                </div>
                {helpers.map((h) => {
                  const partnerName = h.contract?.name || `Helper (${h.phone.slice(-4)})`;
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
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                        isSelected
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-sm"
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
                  🎧 {t("admin.counselorsSubheader")}
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
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                        isSelected
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-sm"
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
                          {selectedPartner.type === "helper" ? `🛠️ ${t("admin.helpersSubheader")}` : `🎧 ${t("admin.counselorsSubheader")}`}
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
                        <p>{t("admin.noMessages")}</p>
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
                        className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-blue-600 hover:text-white transition-all duration-200 active:scale-[0.98] cursor-pointer"
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
                        placeholder={t("admin.chatPlaceholder")}
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={!messageInput.trim()}
                        className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-extrabold text-white hover:brightness-105 disabled:opacity-50 transition-all duration-200 shadow-md shadow-blue-600/20 active:scale-[0.98] cursor-pointer"
                      >
                        {t("admin.btnSendMessage")}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="grid h-full place-content-center text-center text-slate-500 p-8">
                  <span className="text-4xl mb-3">💬</span>
                  <p className="text-sm font-bold text-slate-300">
                    {t("admin.selectPartnerToChat")}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 5: ⭐ 익명 고객 리뷰 관리 콘솔 (contact@life.help) */}
        {activeTab === "reviews" && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>⭐</span>
                  <span>{t("admin.reviewCenter")}</span>
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {t("admin.reviewDesc")}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-xl border border-amber-500/40 bg-amber-950/40 px-3 py-1.5 text-xs font-bold text-amber-300">
                  {t("admin.reviewCount")}: {reviews.length}{t("admin.unitCases")}
                </span>
                <span className="rounded-xl border border-blue-500/40 bg-blue-950/40 px-3 py-1.5 text-xs font-bold text-blue-300 font-mono">
                  contact@life.help
                </span>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="grid h-64 place-content-center rounded-3xl border border-slate-800 bg-slate-900/40 text-center text-xs text-slate-500">
                <p className="text-3xl mb-2">⭐</p>
                <p>{t("admin.reviewEmpty")}</p>
              </div>
            ) : (
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
                        <span className="text-xs font-bold text-white">({rev.rating})</span>
                        <span className="rounded-md bg-blue-950 px-2 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-800">
                          {getLocalizedServiceName(rev.serviceCategory, locale)}
                        </span>
                      </div>

                      <span className="rounded-md bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                        <span>✓</span>
                        <span>{t("admin.reviewEmailSent")}</span>
                      </span>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-200 leading-relaxed">
                      <p className="whitespace-pre-wrap">&ldquo;{rev.content}&rdquo;</p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>{t("admin.reviewRecipient")}: contact@life.help</span>
                      <span>{new Date(rev.createdAt).toLocaleString()} · {t("admin.reviewAnonymous")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 6: 🤝 5대 생활지원 헬퍼 파트너 승인 & 050 가상 안심번호 매칭 관리 콘솔 */}
        {activeTab === "support" && (
          <section className="space-y-4">
            {/* Header & Sub-Tab Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-purple-950 px-3 py-0.5 text-xs font-bold text-purple-300 border border-purple-800 mb-1.5">
                  <span>🔒 개인정보 보호 050 안심번호 시스템</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>🤝 5대 생활지원 헬퍼 파트너 승인 & 050 안심번호 매칭 콘솔</span>
                </h3>
                <p className="mt-1 text-xs text-slate-400 max-w-2xl leading-relaxed">
                  은행 계좌 개설, 보험 가입, 구인/구직, 병원 동행 통역, 이동전화 개통 등 5개 생활 지원 분야의 헬퍼 파트너 신청 승인과 050 가상 안심번호 매칭 내역을 통합 관리합니다.
                </p>
              </div>

              {/* Sub-tab switcher */}
              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setSupportSubTab("partners")}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    supportSubTab === "partners"
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>🎖️ 헬퍼 파트너 승인</span>
                  <span className="rounded-md bg-purple-950 px-1.5 py-0.2 text-[10px] font-extrabold text-purple-200">
                    {supportPartners.length}명
                  </span>
                  {stats.pendingSupportPartners > 0 && (
                    <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[9px] font-black text-slate-950 animate-pulse">
                      {stats.pendingSupportPartners}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSupportSubTab("requests")}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    supportSubTab === "requests"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>🔒 050 안심번호 매칭 로그</span>
                  <span className="rounded-md bg-indigo-950 px-1.5 py-0.2 text-[10px] font-extrabold text-indigo-200">
                    {supportRequests.length}건
                  </span>
                </button>
              </div>
            </div>

            {/* SUB-TAB 1: 헬퍼 파트너 신청 및 승인 관리 */}
            {supportSubTab === "partners" && (
              <div className="space-y-4">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={supportPartnerSearch}
                      onChange={(e) => setSupportPartnerSearch(e.target.value)}
                      placeholder="파트너 이름, 연락처, 지역 검색..."
                      className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500 w-64"
                    />

                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                      {(["all", "pending", "approved", "rejected"] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setSupportPartnerFilter(f)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                            supportPartnerFilter === f
                              ? "bg-purple-700 text-white shadow-xs"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {f === "all"
                            ? "전체"
                            : f === "pending"
                            ? `승인대기 (${stats.pendingSupportPartners})`
                            : f === "approved"
                            ? "승인완료"
                            : "반려"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <span className="text-xs text-slate-400">
                    총 {supportPartners.length}개 헬퍼 파트너 등록됨
                  </span>
                </div>

                {/* Partners List */}
                {supportPartners
                  .filter((p) => {
                    if (supportPartnerFilter !== "all" && p.status !== supportPartnerFilter) return false;
                    if (supportPartnerSearch.trim()) {
                      const q = supportPartnerSearch.toLowerCase();
                      const matchName = p.name.toLowerCase().includes(q);
                      const matchPhone = p.phone.includes(q);
                      const matchRegion = p.regions.some((r) => r.toLowerCase().includes(q));
                      return matchName || matchPhone || matchRegion;
                    }
                    return true;
                  })
                  .map((p) => (
                    <div
                      key={p.id}
                      className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm space-y-4 hover:border-slate-700 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-950 text-xl text-purple-300 border border-purple-800">
                            🎖️
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-extrabold text-white">{p.name}</h4>
                              <span className="text-xs text-slate-400 font-mono">({p.phone})</span>

                              {/* Status Badge */}
                              {p.status === "approved" ? (
                                <span className="rounded-full bg-emerald-950 px-2.5 py-0.5 text-[10px] font-black text-emerald-400 border border-emerald-800">
                                  ✓ 승인 완료 (활동중)
                                </span>
                              ) : p.status === "pending" ? (
                                <span className="rounded-full bg-amber-950 px-2.5 py-0.5 text-[10px] font-black text-amber-300 border border-amber-800 animate-pulse">
                                  ⏳ 관리자 승인 대기
                                </span>
                              ) : (
                                <span className="rounded-full bg-rose-950 px-2.5 py-0.5 text-[10px] font-black text-rose-400 border border-rose-800">
                                  ✕ 신청 반려
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-400 mt-0.5">
                              신청일: {new Date(p.createdAt).toLocaleDateString()} · 활동지역: {p.regions.join(", ") || "전국"}
                            </p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {p.status === "pending" && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  updateSupportPartnerStatus(p.id, "approved");
                                  showToast(`${p.name} 파트너 승인이 완료되었습니다.`);
                                  refreshData();
                                }}
                                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-black text-white transition cursor-pointer shadow-sm"
                              >
                                ✓ 승인 완료
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  updateSupportPartnerStatus(p.id, "rejected");
                                  showToast(`${p.name} 파트너 신청이 반려되었습니다.`);
                                  refreshData();
                                }}
                                className="rounded-xl bg-rose-900/60 hover:bg-rose-900 border border-rose-700 px-3 py-1.5 text-xs font-bold text-rose-300 transition cursor-pointer"
                              >
                                ✕ 반려
                              </button>
                            </>
                          )}

                          {p.status === "approved" && (
                            <button
                              type="button"
                              onClick={() => {
                                updateSupportPartnerStatus(p.id, "pending");
                                showToast(`${p.name} 파트너 상태를 대기 상태로 변경했습니다.`);
                                refreshData();
                              }}
                              className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition cursor-pointer"
                            >
                              승인 대기로 전환
                            </button>
                          )}

                          {p.status === "rejected" && (
                            <button
                              type="button"
                              onClick={() => {
                                updateSupportPartnerStatus(p.id, "approved");
                                showToast(`${p.name} 파트너를 재승인했습니다.`);
                                refreshData();
                              }}
                              className="rounded-xl bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 text-xs font-black text-white transition cursor-pointer"
                            >
                              재승인 처리
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              handleOpenPartnerChat({
                                type: "helper",
                                id: p.phone,
                                name: p.name,
                              });
                            }}
                            className="rounded-xl border border-blue-500/40 bg-blue-950/40 hover:bg-blue-900/60 px-3 py-1.5 text-xs font-bold text-blue-300 transition cursor-pointer flex items-center gap-1"
                          >
                            <span>💬</span>
                            <span>연락하기</span>
                          </button>
                        </div>
                      </div>

                      {/* Categories & Fee Tag */}
                      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-800/80">
                        <span className="text-[11px] text-slate-400">지원 카테고리:</span>
                        {p.categories.map((cSlug) => {
                          const meta = SUPPORT_CATEGORIES[cSlug];
                          return (
                            <span
                              key={cSlug}
                              className="rounded-md bg-slate-950 px-2 py-0.5 text-[10px] font-bold text-purple-300 border border-slate-800 flex items-center gap-1"
                            >
                              <span>{meta ? meta.icon : "💼"}</span>
                              <span>{meta ? meta.nameKo : cSlug}</span>
                            </span>
                          );
                        })}

                        <span className="ml-auto rounded-md bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                          {p.agreedToFee ? "✅ 플랫폼 광고 및 10% 알선수수료 동의완료" : "⚠️ 수수료 약관 미동의"}
                        </span>
                      </div>

                      {p.bio && (
                        <p className="text-xs text-slate-300 italic bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                          &ldquo;{p.bio}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {/* SUB-TAB 2: 050 가상 안심번호 매칭 및 알선 로그 */}
            {supportSubTab === "requests" && (
              <div className="space-y-4">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={supportRequestSearch}
                      onChange={(e) => setSupportRequestSearch(e.target.value)}
                      placeholder="050 안심번호, 고객번호, 지역 검색..."
                      className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 w-64"
                    />

                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                      {(["all", "pending", "matched", "completed"] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setSupportRequestFilter(f)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                            supportRequestFilter === f
                              ? "bg-indigo-700 text-white shadow-xs"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {f === "all"
                            ? "전체"
                            : f === "pending"
                            ? "접수대기"
                            : f === "matched"
                            ? "알선 매칭완료"
                            : "서비스 완료"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <span className="text-xs text-slate-400">
                    총 {supportRequests.length}건 안심번호 발급 및 매칭
                  </span>
                </div>

                {/* Request list */}
                {supportRequests
                  .filter((req) => {
                    if (supportRequestFilter !== "all" && req.status !== supportRequestFilter) return false;
                    if (supportRequestSearch.trim()) {
                      const q = supportRequestSearch.toLowerCase();
                      const matchSafe = req.customerSafePhone.includes(q);
                      const matchReal = req.customerRealPhone.includes(q);
                      const matchArea = `${req.sido} ${req.gungu} ${req.dong}`.toLowerCase().includes(q);
                      return matchSafe || matchReal || matchArea;
                    }
                    return true;
                  })
                  .map((req) => {
                    const catMeta = SUPPORT_CATEGORIES[req.category];
                    return (
                      <div
                        key={req.id}
                        className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm space-y-4 hover:border-slate-700 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-950 text-xl text-indigo-300 border border-indigo-800">
                              {catMeta ? catMeta.icon : "📞"}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-black text-white">
                                  {catMeta ? catMeta.nameKo : req.category}
                                </h4>
                                <span className="rounded-md bg-slate-950 px-2 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-800">
                                  #{req.id}
                                </span>

                                {/* Status */}
                                {req.status === "matched" ? (
                                  <span className="rounded-full bg-emerald-950 px-2.5 py-0.5 text-[10px] font-black text-emerald-400 border border-emerald-800">
                                    ✓ 파트너 알선 매칭완료
                                  </span>
                                ) : req.status === "pending" ? (
                                  <span className="rounded-full bg-amber-950 px-2.5 py-0.5 text-[10px] font-black text-amber-300 border border-amber-800 animate-pulse">
                                    ⏳ 파트너 매칭 대기
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-blue-950 px-2.5 py-0.5 text-[10px] font-black text-blue-300 border border-blue-800">
                                    서비스 완료
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-400 mt-0.5">
                                접수시간: {new Date(req.createdAt).toLocaleString()} · 지역: {req.country} {req.sido} {req.gungu} {req.dong}
                              </p>
                            </div>
                          </div>

                          {/* Matching action */}
                          <div className="flex items-center gap-2">
                            {req.status === "pending" ? (
                              <button
                                type="button"
                                onClick={() => setMatchingSupportReq(req)}
                                className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 px-3.5 py-2 text-xs font-black text-white transition shadow-sm cursor-pointer"
                              >
                                ⚡ 파트너 알선 연결
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  updateSupportRequestStatus(req.id, "completed");
                                  showToast(`요청(#${req.id})이 완료 처리되었습니다.`);
                                  refreshData();
                                }}
                                className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 transition cursor-pointer"
                              >
                                완료 상태로 변경
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Dual Phone Numbers (050 Safe vs Real Customer Phone) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                          <div>
                            <span className="text-[11px] font-bold text-slate-400 block uppercase">
                              🔒 고객 발급 050 임시 안심번호 (Virtual Safe Phone)
                            </span>
                            <span className="text-base font-black text-emerald-400 font-mono">
                              {req.customerSafePhone}
                            </span>
                            <span className="block text-[10px] text-slate-500">
                              (헬퍼 파트너에게 노출되는 연결 번호)
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] font-bold text-slate-400 block uppercase">
                              🛡️ 고객 실제 휴대폰 번호 (Private)
                            </span>
                            <span className="text-base font-black text-slate-300 font-mono">
                              {req.customerRealPhone}
                            </span>
                            <span className="block text-[10px] text-slate-500">
                              (관리자만 확인 가능한 실제 번호)
                            </span>
                          </div>
                        </div>

                        {/* Selected checklist options */}
                        <div className="space-y-1 text-xs">
                          <span className="text-slate-400 font-semibold block">고객 신청 도움 항목:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {req.selectedNeeds.map((item, idx) => (
                              <span
                                key={idx}
                                className="rounded-lg bg-indigo-950/50 px-2.5 py-1 text-[11px] font-semibold text-indigo-200 border border-indigo-900/60"
                              >
                                ✓ {item}
                              </span>
                            ))}
                          </div>
                        </div>

                        {req.memo && (
                          <div className="text-xs text-slate-300 italic bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
                            요청 메모: {req.memo}
                          </div>
                        )}

                        {/* Matched Partner Information */}
                        {req.matchedPartnerName && (
                          <div className="flex items-center justify-between text-xs bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-800/40 text-emerald-300">
                            <span>
                              🤝 매칭 파트너: <strong>{req.matchedPartnerName}</strong> ({req.matchedPartnerPhone})
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-400">
                              050 가상연결 활성화됨
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </section>
        )}

        {/* FLOATING SUPPORT PARTNER MATCHING MODAL */}
        {matchingSupportReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="relative flex flex-col h-[550px] max-h-[90vh] w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl text-white overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>⚡</span>
                    <span>050 헬퍼 파트너 알선 매칭</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    요청번호 #{matchingSupportReq.id} (안심번호: {matchingSupportReq.customerSafePhone})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMatchingSupportReq(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                <p className="text-xs text-slate-400 font-medium">
                  승인된 헬퍼 파트너 중 고객에게 알선 연결할 파트너를 선택하세요:
                </p>

                {supportPartners
                  .filter((p) => p.status === "approved")
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 p-4 hover:border-indigo-600 transition"
                    >
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">{p.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          연락처: {p.phone} · 지역: {p.regions.join(", ")}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          updateSupportRequestStatus(matchingSupportReq.id, "matched", p.name, p.phone);
                          showToast(`${p.name} 파트너에게 050 안심연결 알선 매칭되었습니다.`);
                          setMatchingSupportReq(null);
                          refreshData();
                        }}
                        className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-black text-white transition cursor-pointer"
                      >
                        매칭 연결
                      </button>
                    </div>
                  ))}

                {supportPartners.filter((p) => p.status === "approved").length === 0 && (
                  <p className="text-xs text-amber-400 text-center py-8">
                    현재 승인 완료된 헬퍼 파트너가 없습니다. 먼저 헬퍼 파트너를 승인해 주세요.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* FLOATING DIRECT CHAT MODAL (When opened via [💬 온라인 연락] from any card) */}
        {showDirectChatModal && selectedPartner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="relative flex flex-col h-[600px] max-h-[90vh] w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl text-white overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">
                    HQ
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      <span>{selectedPartner.name} {t("admin.partnerChat")}</span>
                      <span className="rounded bg-emerald-950 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-800">
                        ONLINE
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {t("admin.reviewRecipient")}: {selectedPartner.type === "helper" ? `🛠️ ${t("admin.helpersSubheader")}` : `🎧 ${t("admin.counselorsSubheader")}`} ({selectedPartner.id})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDirectChatModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200 active:scale-[0.98] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Message History Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {partnerMessages.length === 0 ? (
                  <div className="grid h-full place-content-center text-center text-xs text-slate-500">
                    <p className="text-2xl mb-2">💬</p>
                    <p>{t("admin.noMessages")}</p>
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
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-blue-600 hover:text-white transition-all duration-200 active:scale-[0.98] cursor-pointer"
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
                    placeholder={t("admin.chatPlaceholder")}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-extrabold text-white hover:brightness-105 disabled:opacity-50 transition-all duration-200 shadow-md shadow-blue-600/20 active:scale-[0.98] cursor-pointer"
                  >
                    {t("admin.btnSendMessage")}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* FLOATING HELPER ASSIGNMENT MODAL (1-Click Emergency Dispatch) */}
        {assigningRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="relative flex flex-col h-[650px] max-h-[90vh] w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl text-white overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-600 text-xl font-black text-white shadow-md">
                    {assigningRequest.serviceIcon || "⚡"}
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <span>[{getLocalizedServiceName(assigningRequest.serviceSlug || assigningRequest.serviceName, locale)}] {t("admin.assignModalTitle")}</span>
                      <span className="rounded-md bg-amber-950 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-800">
                        {assigningRequest.status === "pending" ? t("admin.statusPending") : t("admin.btnReassignHelper")}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      📍 {assigningRequest.sido} {assigningRequest.gungu} · {assigningRequest.address}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAssigningRequest(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200 active:scale-[0.98] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Request Summary Banner */}
              <div className="bg-slate-950/60 border-b border-slate-800 p-4 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{t("admin.customerPhoneLabel")}:</span>
                  <span className="font-mono font-bold text-amber-300">📞 {assigningRequest.phone}</span>
                </div>
                <div className="text-slate-300">
                  <span className="text-slate-400 font-semibold">{t("admin.requestDescLabel")}:</span>{" "}
                  <span className="text-slate-200">&ldquo;{assigningRequest.description}&rdquo;</span>
                </div>
              </div>

              {/* Search Helper in Modal */}
              <div className="p-4 border-b border-slate-800 bg-slate-900">
                <input
                  type="text"
                  value={assignHelperSearch}
                  onChange={(e) => setAssignHelperSearch(e.target.value)}
                  placeholder={t("admin.searchHelperAssignPlaceholder")}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                />
              </div>

              {/* Helpers List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {helpers
                  .filter((h) => {
                    if (!assignHelperSearch) return true;
                    const target = `${h.contract?.name || ""} ${h.phone} ${h.contract?.regions.map((r) => `${r.sido} ${r.gungu}`).join(" ") || ""}`.toLowerCase();
                    return target.includes(assignHelperSearch.toLowerCase());
                  })
                  .map((h) => {
                    const isRegionMatched = h.contract?.regions.some(
                      (r) =>
                        r.sido === assigningRequest.sido &&
                        (r.gungu === assigningRequest.gungu || r.gungu === "전체"),
                    );
                    const name = h.contract?.name || `Helper (${h.phone.slice(-4)})`;

                    return (
                      <div
                        key={h.phone}
                        className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                          isRegionMatched
                            ? "border-emerald-500/60 bg-emerald-950/20 hover:border-emerald-400"
                            : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-white text-sm">{name}</span>
                            <span className="text-xs font-mono text-slate-400">📱 {h.phone}</span>
                            {h.isActive ? (
                              <span className="rounded bg-emerald-950 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-800">
                                {t("admin.statusActive")}
                              </span>
                            ) : (
                              <span className="rounded bg-amber-950 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-800">
                                {t("admin.statusPaused")}
                              </span>
                            )}
                            {isRegionMatched && (
                              <span className="rounded bg-blue-950 px-1.5 py-0.5 text-[10px] font-black text-blue-300 border border-blue-800 animate-pulse">
                                📍 {t("admin.matchedRegionBadge")}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">
                            {t("admin.activeRegionLabel")}:{" "}
                            <span className="text-slate-300">
                              {h.contract?.regions.map((r) => `${r.sido} ${r.gungu}`).join(", ") || t("admin.unspecifiedRegion")}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {t("admin.registeredServicesLabel")}:{" "}
                            {h.contract?.services && h.contract.services.length > 0
                              ? h.contract.services.map((s) => getLocalizedServiceName(s, locale)).join(", ")
                              : t("admin.allServices")}
                          </div>
                        </div>

                          <button
                            type="button"
                            onClick={() => {
                              updateRequestStatus(assigningRequest.id, "dispatched", {
                                name,
                                phone: h.phone,
                              });
                              sendAdminMessage({
                                targetType: "helper",
                                targetId: h.phone,
                                targetName: name,
                                sender: "admin",
                                senderName: "LIFE.HELP HQ",
                                text: `[🚨 ${t("admin.templateDispatch")}]\n${getLocalizedServiceName(assigningRequest.serviceSlug || assigningRequest.serviceName, locale)} (${assigningRequest.sido} ${assigningRequest.gungu})\n- ${t("admin.dispatchLocationLabel")}: ${assigningRequest.address}\n- ${t("admin.customerPhoneLabel")}: ${assigningRequest.phone}\n- ${t("admin.requestDescLabel")}: ${assigningRequest.description}`,
                              });
                              showToast(`${name} - ${t("admin.toastAssigned")}`);
                              setAssigningRequest(null);
                              refreshData();
                            }}
                            className="shrink-0 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-4 py-2.5 text-xs font-black text-white hover:brightness-105 active:scale-[0.98] transition-all duration-200 shadow-md shadow-blue-600/25 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <span>⚡</span>
                            <span>{t("admin.btnConfirmAssign")}</span>
                          </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
