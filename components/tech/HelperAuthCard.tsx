"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useHelper, type HelperRegionItem } from "@/lib/helper/HelperContext";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { services } from "@/lib/services";

interface HelperAuthCardProps {
  defaultTab?: "register" | "login";
  onSuccess?: () => void;
}

export function HelperAuthCard({
  defaultTab = "register",
  onSuccess,
}: HelperAuthCardProps) {
  const router = useRouter();
  const { locale, t, formatBilingual, isBilingual } = useLocale();
  const isKorean = locale === "ko";

  const { requestAccessKey, verifyAccessKey, registerHelper } = useHelper();

  const [activeTab, setActiveTab] = useState<"register" | "login">(defaultTab);
  const [email, setEmail] = useState("");
  const [helperName, setHelperName] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([
    "toilet-clog",
    "sink-clog",
    "drain-clog",
  ]);
  const [regionText, setRegionText] = useState("전북특별자치도 익산시");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showEmailReissue, setShowEmailReissue] = useState(false);

  // Security Access Key State
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
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Request 90-Day Security Access Key via Email
  const handleSendAccessKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setErrorMsg(
        formatBilingual(
          "Please enter a valid email address. (e.g. helper@example.com)",
          "올바른 이메일 주소를 입력해 주세요. 예: helper@example.com",
        ),
      );
      return;
    }

    setErrorMsg("");
    setLoading(true);
    const res = await requestAccessKey(cleanEmail);
    setLoading(false);

    if (res.success) {
      setCodeSent(true);
      setAccessKeyNotice(res.notice);
      setAuthCode(res.accessKey); // Auto-fill for seamless mobile verification
    } else {
      setErrorMsg(
        formatBilingual(
          "Failed to issue security code.",
          "보안 코드 발송에 실패했습니다.",
        ),
      );
    }
  };

  const handleCopyKey = () => {
    if (!accessKeyNotice?.accessKey) return;
    navigator.clipboard.writeText(accessKeyNotice.accessKey);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const handleToggleService = (slug: string) => {
    setSelectedServices((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!authCode || authCode.trim().length < 6) {
      setErrorMsg(
        formatBilingual(
          t("tech.enterAccessKeyError"),
          "3개월 전용 보안 코드를 입력해 주세요.",
        ),
      );
      return;
    }
    if (!helperName.trim()) {
      setErrorMsg(
        formatBilingual(
          t("tech.enterNameError"),
          "헬퍼 성함(활동명)을 입력해 주세요.",
        ),
      );
      return;
    }
    if (selectedServices.length === 0) {
      setErrorMsg(
        formatBilingual(
          t("tech.selectServiceError"),
          "최소 하나 이상의 서비스 가능 분야를 선택해 주세요.",
        ),
      );
      return;
    }
    if (!agreeTerms) {
      setErrorMsg(
        formatBilingual(
          t("tech.agreeTermsError"),
          "헬퍼 활동 규정 및 안전 수칙에 동의해 주세요.",
        ),
      );
      return;
    }

    setLoading(true);
    const regions: HelperRegionItem[] = [
      {
        sido: regionText.includes(" ") ? regionText.split(" ")[0] : "전북특별자치도",
        gungu: regionText.includes(" ") ? regionText.split(" ").slice(1).join(" ") : regionText,
      },
    ];

    registerHelper({
      name: helperName.trim(),
      email: email.trim().toLowerCase(),
      regions,
      services: selectedServices,
      accessKey: authCode.trim(),
      accessKeyExpiresAt: accessKeyNotice?.expiresAt,
    });

    setLoading(false);
    if (onSuccess) {
      onSuccess();
    } else {
      router.push("/tech/workspace");
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!authCode || authCode.trim().length < 6) {
      setErrorMsg(
        formatBilingual(
          t("tech.enterAccessKeyError"),
          "3개월 전용 보안 코드를 입력해 주세요.",
        ),
      );
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const result = cleanEmail
      ? await verifyAccessKey(cleanEmail, authCode.trim())
      : await verifyAccessKey(authCode.trim());
    setLoading(false);

    if (result.success) {
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/tech/workspace");
      }
    } else {
      setErrorMsg(
        result.error ||
          formatBilingual(
            "Security access key is invalid or expired.",
            "보안 접속 코드가 올바르지 않거나 유효기간이 만료되었습니다.",
          ),
      );
    }
  };

  return (
    <div className="droplet-card border border-slate-800 bg-slate-900/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
      {/* 2-Tab Bar */}
      <div className="mb-6 grid grid-cols-2 gap-1.5 droplet-card bg-slate-950 p-1.5 border border-slate-800">
        <button
          type="button"
          onClick={() => {
            setActiveTab("register");
            setErrorMsg("");
          }}
          className={`droplet-btn py-3 text-xs sm:text-sm font-black transition ${
            activeTab === "register"
              ? "bg-blue-600 text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span>📝 {formatBilingual(t("tech.registerTab"), "신규 헬퍼 등록 및 활동 신청")}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("login");
            setErrorMsg("");
          }}
          className={`droplet-btn py-3 text-xs sm:text-sm font-black transition ${
            activeTab === "login"
              ? "bg-blue-600 text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span>🔑 {formatBilingual(t("tech.loginTab"), "기존 헬퍼 로그인")}</span>
        </button>
      </div>

      {/* Header Info */}
      <div className="mb-5">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <span>{activeTab === "register" ? "🚀" : "🛡️"}</span>
          <span>
            {activeTab === "register"
              ? formatBilingual(
                  t("tech.newHelperRegTitle"),
                  "신규 헬퍼 등록 · 3개월 보안 접속",
                )
              : formatBilingual(
                  t("tech.existingHelperLoginTitle"),
                  "기존 헬퍼 로그인",
                )}
          </span>
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          {activeTab === "register"
            ? formatBilingual(
                t("tech.newHelperRegDesc"),
                "주민등록번호 입력 없이, 이동전화번호 하나로 3개월간 자유롭게 활동하세요.",
              )
            : formatBilingual(
                t("tech.existingHelperLoginDesc"),
                "발급받으신 3개월 전용 보안 코드를 입력하시면 별도의 인증 없이 바로 로그인됩니다.",
              )}
        </p>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="mb-5 droplet-card bg-red-950/50 border border-red-800/80 p-3.5 text-xs font-bold text-red-200">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Forms */}
      {activeTab === "login" ? (
        /* Existing Helper Login Form - Dedicated 3-Month Access Key Input */
        <form onSubmit={handleLoginSubmit} className="space-y-5">
          {/* 3-Month Dedicated Access Key Input */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-300">
              {formatBilingual(
                t("tech.accessKeyLabel"),
                "3개월 전용 보안 코드 · Access Key",
              )}
            </label>
            <input
              type="text"
              required
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              placeholder="LH-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
              className="mt-1.5 w-full tracking-wider droplet-input border border-slate-700 bg-slate-800 p-4 text-center text-lg sm:text-xl font-black text-white outline-none focus:border-blue-500 uppercase font-mono shadow-inner"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full droplet-btn-lg bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 py-4 text-sm font-black text-white shadow-md shadow-emerald-600/25 hover:shadow-lg hover:shadow-emerald-600/35 hover:brightness-105 active:scale-[0.98] disabled:opacity-50 transition flex flex-col items-center justify-center cursor-pointer border border-emerald-500/30"
          >
            {loading ? (
              <span>{formatBilingual(t("tech.verifying"), "로그인 검증 중...")}</span>
            ) : (
              <span>
                {formatBilingual(
                  t("tech.loginWithAccessKey"),
                  "3개월 보안 코드로 로그인 · 90일 유지",
                )}{" "}
                🟢
              </span>
            )}
          </button>

          {/* Explanatory Info Card */}
          <div className="droplet-card border border-blue-900/40 bg-blue-950/20 p-3.5">
            <p className="text-[11px] leading-relaxed text-blue-300 font-medium">
              💡{" "}
              {formatBilingual(
                "Enter the 90-day security access code received via email to instantly access the Helper Workspace.",
                "이메일로 발급받으신 90일 전용 보안 접속 코드를 입력하시면 별도의 본인인증 없이 즉시 헬퍼 워크스페이스에 접속하실 수 있습니다.",
              )}
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setErrorMsg("");
              }}
              className="text-blue-400 hover:text-blue-300 font-bold cursor-pointer"
            >
              {formatBilingual(
                t("tech.registerTab"),
                "← 신규 헬퍼 등록 및 활동 신청",
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowEmailReissue((prev) => !prev)}
              className="text-slate-400 hover:text-white underline font-medium cursor-pointer"
            >
              {formatBilingual(t("tech.lostCodeBtn"), "코드를 분실하셨나요?")}
            </button>
          </div>

          {/* Re-issue Drawer */}
          {showEmailReissue && (
            <div className="droplet-card border border-slate-700 bg-slate-950/70 p-4 mt-2 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 block">
                {formatBilingual(
                  "Reissue 90-day Code via Email",
                  "이메일로 90일 보안 코드 재발급",
                )}
              </span>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="helper@example.com"
                  className="flex-1 droplet-input border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold font-mono text-white outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleSendAccessKey}
                  disabled={loading}
                  className="droplet-btn bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-blue-600/20 hover:brightness-105 active:scale-[0.98] transition shrink-0 cursor-pointer"
                >
                  {loading
                    ? formatBilingual(t("tech.verifying"), "발송 중...")
                    : formatBilingual(t("tech.getCode"), "코드 받기")}
                </button>
              </div>
              {accessKeyNotice && (
                <div className="droplet-card bg-emerald-950/80 border border-emerald-700 p-2.5 text-xs text-emerald-200 flex items-center justify-between">
                  <span className="font-mono font-bold">{accessKeyNotice.accessKey}</span>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="text-[11px] bg-emerald-600 text-white px-2.5 py-1 droplet-btn font-bold hover:bg-emerald-700 active:scale-95 transition cursor-pointer shadow-2xs"
                  >
                    {copiedToast
                      ? formatBilingual(t("tech.copied"), "복사됨!")
                      : formatBilingual(t("tech.copy"), "복사")}
                  </button>
                </div>
              )}
            </div>
          )}
        </form>
      ) : (
        /* New Helper Registration Form */
        <div className="space-y-5">
          <div className="droplet-card border border-amber-500/50 bg-amber-500/10 p-4 rounded-xl flex items-center justify-between gap-3">
            <div className="text-xs">
              <span className="font-black text-amber-300 block">🎖️ {formatBilingual(t("support.providerTitle"), "공식 헬퍼 간편 등록")}</span>
              <span className="text-slate-300 text-[11px]">{formatBilingual(t("support.providerDesc"), "10대 서비스 분야 및 지역 선택 바로가기")}</span>
            </div>
            <Link
              href="/services/job-help?tab=provider"
              className="droplet-btn bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-3.5 py-2 shrink-0 transition"
            >
              {formatBilingual(t("customer.helperRegisterBtn"), "신청하기 →")}
            </Link>
          </div>

          <form
            onSubmit={!codeSent ? handleSendAccessKey : handleRegisterSubmit}
            className="space-y-5"
          >
          {/* Email Input */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-300">
              {formatBilingual("Email Address", "이메일 Email 주소")}
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                type="email"
                required
                disabled={codeSent}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="helper@example.com"
                className="flex-1 droplet-input border border-slate-700 bg-slate-800 p-3.5 text-base font-bold text-white outline-none placeholder:text-slate-500 focus:border-blue-500 disabled:opacity-60 disabled:bg-slate-850 font-mono"
              />
              {!codeSent ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="shrink-0 droplet-btn bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-4 sm:px-5 py-3.5 text-xs sm:text-sm font-black text-white shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 hover:brightness-105 active:scale-[0.98] transition disabled:opacity-50 cursor-pointer border border-blue-500/30"
                >
                  {loading
                    ? formatBilingual(t("tech.verifying"), "발송 중...")
                    : formatBilingual(
                        "90일 보안 접속 코드 받기",
                        "90일 보안 접속 코드 받기",
                      )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCodeSent(false)}
                  className="shrink-0 droplet-btn border border-slate-700 bg-slate-800 px-3.5 py-3.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white shadow-2xs active:scale-[0.98] transition cursor-pointer"
                >
                  {formatBilingual("이메일 변경", "이메일 변경")}
                </button>
              )}
            </div>
            {!codeSent && (
              <div className="mt-2 droplet-card border border-blue-900/40 bg-blue-950/20 p-3">
                <p className="text-[11px] leading-relaxed text-blue-300 font-medium">
                  💡{" "}
                  {formatBilingual(
                    "90-Day Security Session: Security access key issued via email verification",
                    "90일 보안 세션 시스템: 이메일 인증 기반 90일 유효 보안 접속 코드 발급",
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Once Key is Sent */}
          {codeSent && (
            <>
              {/* Visual Email Notice Card */}
              <div className="droplet-card border border-emerald-700/60 bg-emerald-950/40 p-4 text-xs text-emerald-200 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400">
                    <span>📧</span>
                    <span>
                      {formatBilingual(
                        "Email Sent Successfully",
                        "이메일 Email 발송 완료",
                      )}
                    </span>
                  </span>
                  <span className="font-mono text-slate-300">{email}</span>
                </div>

                <div className="mt-3 droplet-card border border-emerald-600/50 bg-slate-900/95 p-3.5">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    {formatBilingual(
                      t("tech.issuedAccessKey"),
                      "발급된 3개월 보안 접속 코드 · Access Key",
                    )}
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-base sm:text-lg font-black tracking-wider text-white select-all">
                      {accessKeyNotice?.accessKey}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="shrink-0 droplet-btn bg-emerald-600 px-3.5 py-1.5 text-xs font-black text-white hover:bg-emerald-500 active:scale-95 transition shadow-sm"
                    >
                      {copiedToast
                        ? formatBilingual(t("tech.copied"), "복사됨!")
                        : formatBilingual(t("tech.copy"), "복사")}
                    </button>
                  </div>
                </div>

                <p className="mt-2 text-[11px] text-emerald-300 flex items-center gap-1">
                  <span>📅</span>
                  <span>
                    {formatBilingual(t("tech.securitySessionExpiry"), "보안 세션 만료일")}:{" "}
                    <strong>{accessKeyNotice?.expiryFormatted}</strong> · {formatBilingual(t("tech.autoMaintainedDays"), "90일간 자동 로그인 유지")}
                  </span>
                </p>
              </div>

              {/* Access Key Input */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300">
                  {formatBilingual(
                    t("tech.accessKeyLabel"),
                    "3개월 보안 접속 코드 · Access Key",
                  )}
                </label>
                <input
                  type="text"
                  required
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  placeholder="LH-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                  className="mt-1.5 w-full tracking-wider droplet-input border border-slate-700 bg-slate-800 p-3.5 text-center text-lg font-black text-white outline-none focus:border-blue-500 uppercase font-mono"
                />
              </div>

              {/* Helper Name */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300">
                  {formatBilingual(
                    t("tech.helperNameLabel"),
                    "헬퍼 성함 · 활동명 또는 실명",
                  )}
                </label>
                <input
                  type="text"
                  required
                  value={helperName}
                  onChange={(e) => setHelperName(e.target.value)}
                  placeholder={
                    isKorean ? "예: 홍길동 · 익산 마스터" : "e.g. Master Kim"
                  }
                  className="mt-1.5 w-full droplet-input border border-slate-700 bg-slate-800 p-3.5 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>

              {/* Preferred Region */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300">
                  {formatBilingual(t("tech.operatingRegions"), "활동 가능 지역")}
                </label>
                <input
                  type="text"
                  value={regionText}
                  onChange={(e) => setRegionText(e.target.value)}
                  placeholder="예: 전북특별자치도 익산시"
                  className="mt-1.5 w-full droplet-input border border-slate-700 bg-slate-800 p-3.5 text-sm font-bold text-white outline-none focus:border-blue-500"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["전북 익산시", "전북 전주시", "서울 강남구", "경기 수원시", "인근 전지역"].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setRegionText(chip)}
                      className="droplet-pill border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:border-blue-500 hover:text-white transition"
                    >
                      +{chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Categories Multi-select */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase text-slate-300">
                    {formatBilingual(
                      t("tech.selectServices"),
                      "서비스 가능 분야 선택",
                    )}
                  </label>
                  <span className="text-[11px] font-bold text-blue-400">
                    {selectedServices.length}
                    {formatBilingual(t("tech.selectedCount"), "개 선택됨")}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {formatBilingual(
                    t("tech.selectServicesDesc"),
                    "출동 및 해결 가능한 분야를 모두 눌러 선택해 주세요. · 추후 워크스페이스에서 변경 가능",
                  )}
                </p>

                <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {services.map((srv) => {
                    const isSelected = selectedServices.includes(srv.slug);
                    const srvName = t(`services.${srv.slug}`) || srv.ko;
                    return (
                      <button
                        key={srv.slug}
                        type="button"
                        onClick={() => handleToggleService(srv.slug)}
                        className={`flex items-center gap-2 droplet-card border p-2.5 text-left transition ${
                          isSelected
                            ? "border-blue-500 bg-blue-900/40 text-white shadow-xs"
                            : "border-slate-800 bg-slate-850 text-slate-400 hover:border-slate-700 hover:text-white"
                        }`}
                      >
                        <span className="text-lg">{srv.icon}</span>
                        <span className="truncate text-xs font-bold">
                          {formatBilingual(srvName, srv.ko)}
                        </span>
                        <span className="ml-auto text-xs font-bold text-blue-400">
                          {isSelected ? "✓" : "+"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Terms Agreement */}
              <label className="flex items-start gap-2.5 droplet-card border border-slate-800 bg-slate-850 p-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-0"
                />
                <span className="text-xs text-slate-300 leading-relaxed">
                  {formatBilingual(
                    t("tech.agreeTerms"),
                    "LIFE.HELP 헬퍼 활동 규정 및 안전 수칙을 확인하였으며, 신속하고 친절한 고객 지원에 성실히 임할 것을 확약합니다. · 주민등록번호 미수집",
                  )}
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full droplet-btn-lg bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 py-4 text-sm font-black text-white shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 hover:brightness-105 active:scale-[0.98] disabled:opacity-50 transition flex flex-col items-center justify-center cursor-pointer border border-blue-500/30"
              >
                {loading ? (
                  <span>{formatBilingual(t("tech.verifying"), "처리 중...")}</span>
                ) : (
                  <span>
                    {formatBilingual(
                      t("tech.registerAndStart"),
                      "3개월 보안 코드로 등록 및 활동 시작",
                    )}{" "}
                    🟢
                  </span>
                )}
              </button>
            </>
          )}
          </form>
        </div>
      )}
    </div>
  );
}
