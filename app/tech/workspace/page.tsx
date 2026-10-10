"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useHelper, type HelperContract } from "@/lib/helper/HelperContext";
import { services } from "@/lib/services";
import { koreanRegions } from "@/lib/region/regions";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { navigateToMainHome } from "@/lib/navigation";
import { HelperCalendar } from "@/components/tech/HelperCalendar";
import { WorkHoursPicker } from "@/components/tech/WorkHoursPicker";
import { HelperServicePanel } from "@/components/service/HelperServicePanel";
import { formatHelperDisplayName } from "@/lib/helper/helperFormat";
const DAYS_CONFIG = [
  { key: "월", labelKey: "workspace.dayMon" },
  { key: "화", labelKey: "workspace.dayTue" },
  { key: "수", labelKey: "workspace.dayWed" },
  { key: "목", labelKey: "workspace.dayThu" },
  { key: "금", labelKey: "workspace.dayFri" },
  { key: "토", labelKey: "workspace.daySat" },
  { key: "일", labelKey: "workspace.daySun" },
] as const;

const HOUR_PRESETS = [
  "24시간 즉시 출동 가능",
  "주간 · 09:00 ~ 18:00",
  "야간 및 긴급 · 18:00 ~ 익일 09:00",
  "오전 · 09:00 ~ 13:00",
  "오후 · 13:00 ~ 18:00",
];

export default function TechWorkspacePage() {
  const router = useRouter();
  const { locale, t, formatBilingual } = useLocale();
  const isKorean = locale === "ko";
  const {
    helper,
    isLoggedIn,
    sessionState,
    hasContract,
    remainingDays,
    toggleActiveStatus,
    updateServices,
    updateRegions,
    updateSchedule,
    logout,
  } = useHelper();

  // Region adding state
  const [addSido, setAddSido] = useState("전북특별자치도");
  const [addGungu, setAddGungu] = useState("익산시");
  const [showContractModal, setShowContractModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Work hours edit state
  const [editingDayHours, setEditingDayHours] = useState<string | null>(null);
  const [showGeneralHoursPicker, setShowGeneralHoursPicker] = useState(false);

  useEffect(() => {
    // The credential check is asynchronous; loading is not a confirmed anonymous session.
    if (sessionState === "loading") return;
    if (!isLoggedIn || !helper) {
      router.replace("/tech/login");
    }
  }, [sessionState, isLoggedIn, helper, router]);

  if (!isLoggedIn || !helper) {
    return null;
  }

  const helperDisplayName =
    helper.contract?.name ||
    (helper.email
      ? `헬퍼 · ${helper.email.split("@")[0]}`
      : helper.phone
        ? `헬퍼 · ${helper.phone.slice(-4)}`
        : "헬퍼");

  const contract: HelperContract = helper.contract || {
    name: helperDisplayName,
    residentNumber: "AUTH-VERIFIED",
    email: helper.email || "helper@life.help",
    phone: helper.phone,
    services: ["toilet-clog", "sink-drain", "floor-drain"],
    regions: [{ sido: "전북특별자치도", gungu: "익산시" }],
    availableDays: ["월", "화", "수", "목", "금", "토"],
    availableHours: "24시간 즉시 출동 가능",
    dayHours: {
      월: "24시간 즉시 출동 가능",
      화: "24시간 즉시 출동 가능",
      수: "24시간 즉시 출동 가능",
      목: "24시간 즉시 출동 가능",
      금: "24시간 즉시 출동 가능",
      토: "주간 · 09:00 ~ 18:00",
    },
    excludedDates: [],
    extraWorkDates: [],
    signedAt: new Date().toISOString(),
    signatureDataUrl: "",
    agreedToTerms: true,
  };
  const currentSidoObj = koreanRegions.find((s) => s.name === addSido) || koreanRegions[0];

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(""), 3000);
  };

  const handleToggleService = (slug: string) => {
    const currentList = contract.services;
    const isPresent = currentList.includes(slug);
    const updated = isPresent
      ? currentList.filter((s) => s !== slug)
      : [...currentList, slug];

    if (updated.length === 0) {
      alert(t("workspace.minServiceAlert"));
      return;
    }

    void updateServices(updated).then((res) => {
      if (!res.success) return showFeedback(res.error === "NOT_ALLOWED" ? t("svc.helper.changeByStaff") : t("svc.auth.errGeneric"));
      showFeedback(isPresent ? t("workspace.serviceRemoved") : t("workspace.serviceAdded"));
    });
  };

  const handleAddRegion = () => {
    if (!contract.regions.some((r) => r.sido === addSido && r.gungu === addGungu)) {
      void updateRegions([...contract.regions, { sido: addSido, gungu: addGungu }]).then((res) => {
        showFeedback(res.success ? `${addSido} ${addGungu}: ${t("workspace.regionAdded")}` : res.error === "NOT_ALLOWED" ? t("svc.helper.changeByStaff") : t("svc.auth.errGeneric"));
      });
    }
  };

  const handleRemoveRegion = (index: number) => {
    if (contract.regions.length <= 1) {
      alert(t("workspace.minRegionAlert"));
      return;
    }
    const removed = contract.regions[index];
    const updated = contract.regions.filter((_, i) => i !== index);
    void updateRegions(updated).then((res) => {
      showFeedback(res.success ? `${removed.sido} ${removed.gungu}: ${t("workspace.regionRemoved")}` : res.error === "NOT_ALLOWED" ? t("svc.helper.changeByStaff") : t("svc.auth.errGeneric"));
    });
  };

  const handleToggleDay = (day: string) => {
    const current = contract.availableDays;
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];

    if (updated.length === 0) {
      alert(t("workspace.minDayAlert"));
      return;
    }
    updateSchedule(
      updated,
      contract.availableHours,
      contract.dayHours,
      contract.excludedDates,
      contract.extraWorkDates,
    );
    showFeedback(t("workspace.daysUpdated"));
  };

  const handleSetGeneralHours = (hours: string) => {
    updateSchedule(
      contract.availableDays,
      hours,
      contract.dayHours,
      contract.excludedDates,
      contract.extraWorkDates,
    );
    showFeedback(isKorean ? `기본 근무 시간이 '${hours}'(으)로 변경되었습니다.` : "Default hours updated");
  };

  const handleSetDayHours = (day: string, hours: string) => {
    const nextDayHours = {
      ...(contract.dayHours || {}),
      [day]: hours,
    };
    updateSchedule(
      contract.availableDays,
      contract.availableHours,
      nextDayHours,
      contract.excludedDates,
      contract.extraWorkDates,
    );
    setEditingDayHours(null);
    showFeedback(
      isKorean
        ? `${day}요일 근무 시간이 '${hours}'(으)로 설정되었습니다.`
        : `${day} hours set to ${hours}`,
    );
  };

  const handleUpdateExclusions = (excludedDates: string[], extraWorkDates: string[]) => {
    updateSchedule(
      contract.availableDays,
      contract.availableHours,
      contract.dayHours,
      excludedDates,
      extraWorkDates,
    );
    showFeedback(
      t("svc.helper.scheduleSaved"),
    );
  };

  const handleLogout = () => {
    if (confirm(t("workspace.logoutConfirm"))) {
      void logout().then(() => router.push("/tech"));
    }
  };

  // Email/SMS template for quick hotline notification
  const smsBody = encodeURIComponent(
    `[LIFE.HELP 헬퍼 변동상황 통보]\n헬퍼: ${contract.name}\n계정: ${contract.email || helper.email}\n상태: ${
      helper.isActive ? "출동 가능 상태" : "일시 업무 중단/휴식 요청"
    }\n사유: 사정 변동으로 인한 반영 요청`,
  );

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Top Brand Navigation */}
        <div className="flex items-center justify-between pb-1 gap-2">
          <Link
            href="/"
            onClick={navigateToMainHome}
            className="inline-flex items-center gap-2 text-base sm:text-xl font-extrabold text-blue-400 hover:text-blue-300 transition cursor-pointer shrink-0"
            title="LIFE.HELP"
          >
            <BrandLogo portal="tech" size="md" priority />
            <span className="text-white text-xs sm:text-base font-bold">{t("workspace.title")}</span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link
              href="/"
              onClick={navigateToMainHome}
              className="text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer shrink-0"
            >
              {t("workspace.mainHome")}
            </Link>
          </div>
        </div>

        {/* Workspace Header */}
        <header className="flex flex-col gap-4 droplet-banner border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center droplet-card bg-blue-600 text-2xl font-black shadow-md">
              H
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white">
                  {formatHelperDisplayName(
                    contract.name,
                    t("tech.helper"),
                    t("workspace.helperHonorific"),
                    formatBilingual,
                    isKorean,
                  )}
                </h1>
                {helper.isVerified && (
                  <span className="droplet-pill bg-blue-900/60 px-2 py-0.5 text-[11px] font-bold text-blue-300 border border-blue-700/50" data-testid="verified-badge">
                    {t("workspace.verifiedHelper")}
                  </span>
                )}
                {remainingDays > 0 && (
                  <span className="droplet-pill bg-emerald-950/80 px-2 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-800/60 hidden sm:inline-flex items-center gap-1">
                    <span>🛡️ {t("workspace.securitySessionBadge")}</span>
                    <span className="text-emerald-300">· {remainingDays} {t("workspace.daysRemaining")}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                ✉️ {contract.email || helper.email || "미등록"}{contract.phone ? ` · 📱 ${contract.phone}` : ""} · {t("workspace.signedDate")}:{" "}
                {new Date(contract.signedAt).toLocaleDateString(locale === "ko" ? "ko-KR" : locale)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setShowContractModal(true)}
              className="droplet-btn border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white shadow-2xs transition active:scale-[0.98] cursor-pointer"
            >
              📄 {t("workspace.viewContract")}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="droplet-btn border border-rose-900/60 bg-rose-950/40 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900/60 shadow-2xs transition active:scale-[0.98] cursor-pointer"
            >
              🚪 {t("workspace.logout")}
            </button>
          </div>
        </header>

        {/* Feedback Alert Toast */}
        {feedbackMsg && (
          <div className="droplet-card border border-blue-500/50 bg-blue-950/90 px-4 py-3 text-xs font-bold text-blue-200 shadow-lg animate-fade-in">
            ✓ {feedbackMsg}
          </div>
        )}

        {/* Server-backed work area: approval status, availability, eligible requests, my jobs, chat */}
        <HelperServicePanel />

        {/* 2. Direct Emergency Hotline */}
        <section className="droplet-card border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-md">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            🚨 {t("workspace.hotlineTitle")}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            {t("workspace.hotlineDesc")}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between droplet-card border border-blue-800/60 bg-slate-900/80 p-4">
              <div>
                <p className="text-[11px] font-bold text-blue-400">
                  {t("workspace.team1")}
                </p>
                <p className="text-lg font-black text-white tracking-wider">
                  010-4494-0694
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href="tel:01044940694"
                  className="droplet-btn bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500"
                >
                  📞 {t("workspace.call")}
                </a>
                <a
                  href={`sms:01044940694?body=${smsBody}`}
                  className="droplet-btn border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700"
                >
                  ✉️ {t("workspace.sms")}
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between droplet-card border border-blue-800/60 bg-slate-900/80 p-4">
              <div>
                <p className="text-[11px] font-bold text-blue-400">
                  {t("workspace.team2")}
                </p>
                <p className="text-lg font-black text-white tracking-wider">
                  010-5959-5959
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href="tel:01059595959"
                  className="droplet-btn bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500"
                >
                  📞 {t("workspace.call")}
                </a>
                <a
                  href={`sms:01059595959?body=${smsBody}`}
                  className="droplet-btn border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700"
                >
                  ✉️ {t("workspace.sms")}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Service Categories Real-Time Manager */}
        <section className="droplet-card border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-md">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                🛠️ {t("workspace.servicesTitle")}
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">
                {t("workspace.servicesDesc")}
              </p>
            </div>
            <span className="text-xs font-bold text-blue-400 self-start sm:self-center">
              {contract.services.length} {t("workspace.categoriesActive")}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {services.map((srv) => {
              const isActive = contract.services.includes(srv.slug);
              return (
                <button
                  key={srv.slug}
                  type="button"
                  onClick={() => handleToggleService(srv.slug)}
                  className={`flex items-center justify-between droplet-card border p-3.5 text-left transition ${
                    isActive
                      ? "border-blue-500 bg-blue-900/30 text-white shadow-xs"
                      : "border-slate-800 bg-slate-800/30 text-slate-500 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">{srv.icon}</span>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${isActive ? "text-white" : "text-slate-400"}`}>
                        {t(`service.${srv.key}`)}
                      </p>
                      <span className={`text-[10px] font-semibold ${isActive ? "text-emerald-400" : "text-slate-500"}`}>
                        {isActive ? t("workspace.serviceActive") : t("workspace.serviceDisabled")}
                      </span>
                    </div>
                  </div>

                  <span className={`droplet-pill px-2 py-1 text-[11px] font-black ${
                    isActive ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
                  }`}>
                    {isActive ? "✓" : "+"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. Service Regions Real-Time Manager */}
        <section className="droplet-card border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-md">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                📍 {t("workspace.regionsTitle")}
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">
                {t("workspace.regionsDesc")}
              </p>
            </div>
            <span className="text-xs font-bold text-blue-400 self-start sm:self-center">
              {contract.regions.length} {t("workspace.regionsCount")}
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <select
              value={addSido}
              onChange={(e) => {
                setAddSido(e.target.value);
                const s = koreanRegions.find((r) => r.name === e.target.value);
                if (s && s.gunguList[0]) setAddGungu(s.gunguList[0].name);
              }}
              className="droplet-input border border-slate-700 bg-slate-800 p-2.5 text-xs font-bold text-white outline-none focus:border-blue-500"
            >
              {koreanRegions.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={addGungu}
              onChange={(e) => setAddGungu(e.target.value)}
              className="droplet-input border border-slate-700 bg-slate-800 p-2.5 text-xs font-bold text-white outline-none focus:border-blue-500"
            >
              {currentSidoObj?.gunguList.map((g) => (
                <option key={g.name} value={g.name}>
                  {g.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleAddRegion}
              className="droplet-btn bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-sm shadow-blue-600/20 hover:brightness-105 active:scale-[0.98] transition cursor-pointer"
            >
              + {t("workspace.addRegionBtn")}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {contract.regions.map((reg, idx) => (
              <span
                key={`${reg.sido}-${reg.gungu}`}
                className="flex items-center gap-2 droplet-pill border border-blue-700/60 bg-blue-950/70 px-3.5 py-2 text-xs font-bold text-blue-200"
              >
                <span>📍 {reg.sido} {reg.gungu}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveRegion(idx)}
                  className="rounded-md bg-blue-900/60 p-1 text-slate-300 hover:bg-red-600 hover:text-white transition cursor-pointer"
                  title={t("workspace.removeRegionTitle")}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* 5. Schedule & Calendar (Weekday Work Hours + Monthly Interactive Calendar) */}
        <section className="space-y-6">
          {/* Weekday Selection and Per-Day Work Hours */}
          <div className="droplet-card border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-md">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  ⏰ {t("workspace.scheduleTitle")} &{" "}
                  {formatBilingual(t("workspace.workingHoursDetailTitle"), "요일별 근무 시간")}
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  {formatBilingual(
                    t("workspace.workingHoursDesc"),
                    "활동 가능한 요일을 활성화하고, 요일별 개별 근무 시간대를 지정할 수 있습니다.",
                  )}
                </p>
              </div>

              {/* General Default Hours Preset Selector with WorkHoursPicker */}
              <p data-testid="schedule-note" className="mb-3 w-full text-[11px] font-bold text-amber-300">{t("svc.helper.scheduleNote")}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">
                  {isKorean ? "기본 시간대:" : `${t("workspace.defaultSchedule") || "Default"}:`}
                </span>
                <button
                  type="button"
                  onClick={() => setShowGeneralHoursPicker(true)}
                  className="droplet-btn border border-blue-500/80 bg-blue-950/60 px-3.5 py-1.5 text-xs font-bold text-blue-200 hover:bg-blue-900/80 hover:brightness-105 transition flex items-center gap-1.5 shadow-2xs active:scale-[0.98] cursor-pointer"
                >
                  <span>⏱️ {contract.availableHours}</span>
                  <span className="text-[10px] text-blue-300 font-normal">
                    · {formatBilingual(t("workspace.calendarEdit"), "변경")}
                  </span>
                </button>
              </div>
            </div>

            {/* Weekday Pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              {DAYS_CONFIG.map((d) => {
                const active = contract.availableDays.includes(d.key);
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => handleToggleDay(d.key)}
                    className={`h-10 px-3.5 droplet-btn text-xs font-black transition flex items-center gap-1.5 ${
                      active
                        ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                        : "bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
                    }`}
                    title={t(d.labelKey)}
                  >
                    <span>{t(d.labelKey)}</span>
                    <span className="text-[10px] opacity-80">{active ? "✓" : "off"}</span>
                  </button>
                );
              })}
            </div>

            {/* Per-Day Working Hours Detail Grid */}
            <div className="mt-5 pt-4 border-t border-slate-800/80">
              <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
                <span>⏱️</span>
                <span>
                  {formatBilingual(
                    t("workspace.workingHoursDetailTitle"),
                    "요일별 근무 시간 상세 설정",
                  )}
                </span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {DAYS_CONFIG.map((d) => {
                  const isActive = contract.availableDays.includes(d.key);
                  const currentHours = contract.dayHours?.[d.key] || contract.availableHours;

                  return (
                    <div
                      key={d.key}
                      className={`droplet-card border p-3 transition ${
                        isActive
                          ? "border-slate-700 bg-slate-800/60"
                          : "border-slate-800/60 bg-slate-900/30 opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black ${
                              isActive ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-500"
                            }`}
                          >
                            {isKorean ? d.key : (t(d.labelKey) || d.key)}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {isKorean ? `${t(d.labelKey)}요일` : t(d.labelKey)}
                          </span>
                        </div>
                        <span
                          className={`droplet-pill px-2 py-0.5 text-[10px] font-bold ${
                            isActive
                              ? "bg-blue-900/50 text-blue-300 border border-blue-700/50"
                              : "bg-slate-800 text-slate-500"
                          }`}
                        >
                          {isActive
                            ? formatBilingual(t("workspace.calendarDayActive"), "근무일")
                            : formatBilingual(t("workspace.calendarDayOff"), "휴무")}
                        </span>
                      </div>

                      <div className="mt-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-300 truncate pr-2">
                            {isActive
                              ? currentHours
                              : formatBilingual(t("workspace.calendarDayScheduledOff"), "정기 휴무")}
                          </span>
                          {isActive && (
                            <button
                              type="button"
                              onClick={() => setEditingDayHours(d.key)}
                              className="droplet-btn border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-blue-400 hover:bg-slate-700 hover:text-blue-300 transition active:scale-[0.98] shrink-0 cursor-pointer"
                            >
                              {formatBilingual(t("workspace.calendarEdit"), "변경")}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Modal for Setting Day Hours (30-min steps + break time) */}
          {editingDayHours && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
              <div className="w-full max-w-xl">
                <WorkHoursPicker
                  dayLabel={`${editingDayHours} · ${isKorean ? `${t(DAYS_CONFIG.find((x) => x.key === editingDayHours)?.labelKey || "")}요일` : t(DAYS_CONFIG.find((x) => x.key === editingDayHours)?.labelKey || "")}`}
                  initialValue={contract.dayHours?.[editingDayHours] || contract.availableHours}
                  onSave={(newHours) => handleSetDayHours(editingDayHours, newHours)}
                  onCancel={() => setEditingDayHours(null)}
                />
              </div>
            </div>
          )}

          {/* Modal for Setting General Default Hours */}
          {showGeneralHoursPicker && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
              <div className="w-full max-w-xl">
                <WorkHoursPicker
                  dayLabel={isKorean ? "기본 공통" : "Default"}
                  initialValue={contract.availableHours}
                  onSave={(newHours) => {
                    handleSetGeneralHours(newHours);
                    setShowGeneralHoursPicker(false);
                  }}
                  onCancel={() => setShowGeneralHoursPicker(false)}
                />
              </div>
            </div>
          )}

          {/* Interactive Monthly Calendar (This Month & Next Month with Individual Uncheck Day-Off) */}
          <HelperCalendar
            availableDays={contract.availableDays}
            excludedDates={contract.excludedDates}
            extraWorkDates={contract.extraWorkDates}
            dayHours={contract.dayHours}
            onUpdateExclusions={handleUpdateExclusions}
          />
        </section>

        {/* Contract Viewer Modal */}
        {showContractModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto droplet-card border border-slate-700 bg-slate-900/95 p-6 shadow-2xl text-white">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-lg font-bold">
                  📄 {t("workspace.contractTitle")}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowContractModal(false)}
                  className="droplet-btn p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="mt-5 space-y-4 text-xs leading-relaxed text-slate-300">
                <div className="droplet-card bg-slate-800/60 p-4 grid grid-cols-2 gap-3 border border-slate-700/60">
                  <div>
                    <span className="text-slate-400">{t("workspace.contractName")}:</span>{" "}
                    <strong className="text-white">
                      {formatHelperDisplayName(
                        contract.name,
                        t("tech.helper"),
                        "",
                        formatBilingual,
                        isKorean,
                      )}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">{isKorean ? "인증 이메일:" : "Verified Email:"}</span>{" "}
                    <strong className="text-white">{contract.email || helper.email}</strong>
                  </div>
                  {contract.phone && (
                    <div>
                      <span className="text-slate-400">{t("workspace.contractPhone")}:</span>{" "}
                      <strong className="text-white">{contract.phone}</strong>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-slate-400">{t("workspace.contractResidentId")}:</span>{" "}
                    <strong className="text-white">{contract.residentNumber}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">{t("workspace.contractSignedAt")}:</span>{" "}
                    <span className="text-white">
                      {new Date(contract.signedAt).toLocaleString(locale === "ko" ? "ko-KR" : undefined)}
                    </span>
                  </div>
                </div>

                <div className="droplet-card border border-slate-800 p-4 space-y-2 bg-slate-950/40">
                  <p className="font-bold text-white text-sm">
                    {t("workspace.contractClauseTitle")}
                  </p>
                  <p>
                    {t("workspace.contractClauseDesc")}
                  </p>
                </div>

                <div className="droplet-card bg-blue-950/40 border border-blue-900/50 p-4 text-center">
                  <span className="text-xs text-blue-300">{t("workspace.contractSignature")}:</span>
                  <p className="mt-1 text-base font-extrabold text-white tracking-widest">
                    {contract.signatureDataUrl}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowContractModal(false)}
                  className="droplet-btn bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-xs font-black text-white shadow-sm shadow-blue-600/20 hover:brightness-105 active:scale-[0.98] transition cursor-pointer"
                >
                  {t("workspace.close")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
