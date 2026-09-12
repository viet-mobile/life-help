"use client";

import { useState } from "react";
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
  const { locale, t } = useLocale();
  const isKorean = locale === "ko";

  const { requestAccessKey, verifyAccessKey, registerHelper } = useHelper();

  const [activeTab, setActiveTab] = useState<"register" | "login">(defaultTab);
  const [phone, setPhone] = useState("");
  const [helperName, setHelperName] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([
    "toilet-clog",
    "sink-clog",
    "drain-clog",
  ]);
  const [regionText, setRegionText] = useState("전북특별자치도 익산시");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showPhoneReissue, setShowPhoneReissue] = useState(false);

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

  // Request 3-Month Security Access Key
  const handleSendAccessKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg(
        isKorean
          ? "올바른 이동전화번호를 입력해 주세요. (예: 010-1234-5678)"
          : `${t("tech.invalidPhoneError")} · 올바른 이동전화번호를 입력해 주세요.`,
      );
      return;
    }

    setErrorMsg("");
    setLoading(true);
    const res = await requestAccessKey(phone);
    setLoading(false);

    if (res.success) {
      setCodeSent(true);
      setAccessKeyNotice(res.notice);
      setAuthCode(res.accessKey); // Auto-fill for seamless mobile verification
    } else {
      setErrorMsg(isKorean ? "보안 코드 발송에 실패했습니다." : "Failed to issue security code.");
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
      setErrorMsg(isKorean ? "보안 접속 코드를 입력해 주세요." : "Please enter the security access key.");
      return;
    }
    if (!helperName.trim()) {
      setErrorMsg(isKorean ? "헬퍼 성함(활동명)을 입력해 주세요." : "Please enter your name.");
      return;
    }
    if (selectedServices.length === 0) {
      setErrorMsg(isKorean ? "최소 하나 이상의 서비스 가능 분야를 선택해 주세요." : "Please select at least one service category.");
      return;
    }
    if (!agreeTerms) {
      setErrorMsg(isKorean ? "헬퍼 활동 규정 및 안전 수칙에 동의해 주세요." : "Please agree to the regulations.");
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
      phone: phone.trim(),
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
      setErrorMsg(isKorean ? "3개월 전용 보안 코드를 입력해 주세요." : "Please enter the security access key.");
      return;
    }

    setLoading(true);
    const result = phone.trim()
      ? await verifyAccessKey(phone, authCode.trim())
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
          (isKorean
            ? "보안 접속 코드가 올바르지 않거나 유효기간이 만료되었습니다."
            : "Security access key is invalid or expired."),
      );
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
      {/* 2-Tab Bar */}
      <div className="mb-6 grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-950 p-1.5 border border-slate-800">
        <button
          type="button"
          onClick={() => {
            setActiveTab("register");
            setErrorMsg("");
          }}
          className={`rounded-xl py-3 text-xs sm:text-sm font-black transition ${
            activeTab === "register"
              ? "bg-blue-600 text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          }`}
        >
          {isKorean ? "📝 신규 헬퍼 등록 및 활동 신청" : "Register Helper · 신규 헬퍼 등록"}
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("login");
            setErrorMsg("");
          }}
          className={`rounded-xl py-3 text-xs sm:text-sm font-black transition ${
            activeTab === "login"
              ? "bg-blue-600 text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          }`}
        >
          {isKorean ? "🔑 기존 헬퍼 로그인" : "Helper Sign In · 기존 헬퍼 로그인"}
        </button>
      </div>

      {/* Header Info */}
      <div className="mb-5">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <span>{activeTab === "register" ? "🚀" : "🛡️"}</span>
          <span>
            {activeTab === "register"
              ? isKorean
                ? "신규 헬퍼 등록 (3개월 보안 접속)"
                : "New Helper Registration · 신규 헬퍼 등록"
              : isKorean
              ? "기존 헬퍼 로그인"
              : "Helper Sign In · 기존 헬퍼 로그인"}
          </span>
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          {activeTab === "register"
            ? isKorean
              ? "주민등록번호 입력 없이, 이동전화번호 하나로 3개월간 자유롭게 활동하세요."
              : "No ID numbers required. Register easily with mobile number & 3-month access key."
            : isKorean
            ? "발급받으신 3개월 전용 보안 코드를 입력하시면 별도의 인증 없이 바로 로그인됩니다."
            : "Enter your 3-month dedicated access key to access your workspace directly."}
        </p>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="mb-5 rounded-2xl bg-red-950/50 border border-red-800/80 p-3.5 text-xs font-bold text-red-200">
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
              {isKorean
                ? "3개월 전용 보안 코드 (Access Key)"
                : "3-Month Dedicated Access Key · 3개월 전용 보안 코드"}
            </label>
            <input
              type="text"
              required
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              placeholder="LH-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
              className="mt-1.5 w-full tracking-wider rounded-xl border border-slate-700 bg-slate-800 p-4 text-center text-lg sm:text-xl font-black text-white outline-none focus:border-blue-500 uppercase font-mono shadow-inner"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-lg transition hover:bg-emerald-500 active:scale-98 disabled:opacity-50 flex flex-col items-center justify-center"
          >
            {loading ? (
              <span>{isKorean ? "로그인 검증 중..." : "Verifying..."}</span>
            ) : isKorean ? (
              "3개월 보안 코드로 로그인 (90일 유지) 🟢"
            ) : (
              <>
                <span>Sign In with 90-Day Access Key 🟢</span>
                <span className="text-xs font-normal text-emerald-200 mt-0.5">3개월 보안 코드로 로그인 (90일 유지)</span>
              </>
            )}
          </button>

          {/* Explanatory Info Card */}
          <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-3.5">
            <p className="text-[11px] leading-relaxed text-blue-300 font-medium">
              💡 카카오톡 또는 문자로 발급받으신 <strong>3개월 전용 보안 코드</strong>를 입력하시면 별도의 본인인증 없이 즉시 헬퍼 워크스페이스에 접속하실 수 있습니다.
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
              className="text-blue-400 hover:text-blue-300 font-bold"
            >
              {isKorean ? "← 신규 헬퍼 등록 및 코드 발급" : "Register as New Helper"}
            </button>
            <button
              type="button"
              onClick={() => setShowPhoneReissue((prev) => !prev)}
              className="text-slate-400 hover:text-white underline font-medium"
            >
              {isKorean ? "코드를 분실하셨나요?" : "Lost your code?"}
            </button>
          </div>

          {/* Re-issue Drawer */}
          {showPhoneReissue && (
            <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4 mt-2 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 block">
                {isKorean ? "이동전화번호로 3개월 코드 재발급" : "Re-issue Access Key via Phone"}
              </span>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold font-mono text-white outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleSendAccessKey}
                  disabled={loading}
                  className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500 shrink-0"
                >
                  {loading ? "발송 중..." : "코드 받기"}
                </button>
              </div>
              {accessKeyNotice && (
                <div className="rounded-xl bg-emerald-950/80 border border-emerald-700 p-2.5 text-xs text-emerald-200 flex items-center justify-between">
                  <span className="font-mono font-bold">{accessKeyNotice.accessKey}</span>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="text-[11px] bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-bold"
                  >
                    {copiedToast ? "복사됨!" : "복사"}
                  </button>
                </div>
              )}
            </div>
          )}
        </form>
      ) : (
        /* New Helper Registration Form */
        <form
          onSubmit={!codeSent ? handleSendAccessKey : handleRegisterSubmit}
          className="space-y-5"
        >
          {/* Phone Input */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-300">
              {isKorean ? "이동전화번호 (휴대폰 번호)" : "Mobile Phone · 이동전화번호"}
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                type="tel"
                required
                disabled={codeSent}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 p-3.5 text-base font-bold text-white outline-none placeholder:text-slate-500 focus:border-blue-500 disabled:opacity-60 disabled:bg-slate-850 font-mono"
              />
              {!codeSent ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="shrink-0 rounded-xl bg-blue-600 px-4 sm:px-5 py-3.5 text-xs sm:text-sm font-extrabold text-white shadow-md transition hover:bg-blue-500 active:scale-98 disabled:opacity-50"
                >
                  {loading
                    ? isKorean
                      ? "발송 중..."
                      : "Sending..."
                    : isKorean
                    ? "3개월 보안 접속 코드 받기"
                    : "Get 3-Month Key"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCodeSent(false)}
                  className="shrink-0 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-3.5 text-xs font-bold text-slate-300 hover:bg-slate-750 hover:text-white transition"
                >
                  {isKorean ? "번호 변경" : "Change"}
                </button>
              )}
            </div>
            {!codeSent && (
              <div className="mt-2 rounded-xl border border-blue-900/40 bg-blue-950/20 p-3">
                <p className="text-[11px] leading-relaxed text-blue-300 font-medium">
                  💡 번호 입력 후 코드를 받으시면 <strong>3개월(90일) 동안</strong> 매번 번거로운 인증 없이 즉시 워크스페이스에 접속하실 수 있습니다.
                </p>
              </div>
            )}
          </div>

          {/* Once Key is Sent */}
          {codeSent && (
            <>
              {/* Visual KakaoTalk / SMS Notice Card */}
              <div className="rounded-2xl border border-emerald-700/60 bg-emerald-950/40 p-4 text-xs text-emerald-200 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400">
                    <span>💬</span>
                    <span>카카오톡 알림톡 / SMS 발송 완료</span>
                  </span>
                  <span className="font-mono text-slate-300">{phone}</span>
                </div>

                <div className="mt-3 rounded-xl border border-emerald-600/50 bg-slate-900/95 p-3.5">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    발급된 3개월 보안 접속 코드 (Access Key)
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-base sm:text-lg font-black tracking-wider text-white select-all">
                      {accessKeyNotice?.accessKey}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="shrink-0 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-black text-white hover:bg-emerald-500 active:scale-95 transition shadow-sm"
                    >
                      {copiedToast ? "✓ 복사됨!" : "📋 복사"}
                    </button>
                  </div>
                </div>

                <p className="mt-2 text-[11px] text-emerald-300 flex items-center gap-1">
                  <span>📅</span>
                  <span>
                    유효기간: <strong>{accessKeyNotice?.expiryFormatted}</strong>까지 (90일간 자동 로그인 유지)
                  </span>
                </p>
              </div>

              {/* Access Key Input */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300">
                  {isKorean
                    ? "3개월 보안 접속 코드 (Access Key)"
                    : "Security Access Key · 3개월 보안 접속 코드"}
                </label>
                <input
                  type="text"
                  required
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  placeholder="LH-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                  className="mt-1.5 w-full tracking-wider rounded-xl border border-slate-700 bg-slate-800 p-3.5 text-center text-lg font-black text-white outline-none focus:border-blue-500 uppercase font-mono"
                />
              </div>

              {/* Helper Name */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300">
                  {isKorean ? "헬퍼 성함 (활동명 또는 실명)" : "Helper Name · 성함"}
                </label>
                <input
                  type="text"
                  required
                  value={helperName}
                  onChange={(e) => setHelperName(e.target.value)}
                  placeholder={isKorean ? "예: 홍길동 (익산 마스터)" : "e.g. Master Kim"}
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 p-3.5 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>

              {/* Preferred Region */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300">
                  {isKorean ? "주요 활동 지역" : "Primary Operating Region · 활동 지역"}
                </label>
                <input
                  type="text"
                  value={regionText}
                  onChange={(e) => setRegionText(e.target.value)}
                  placeholder="예: 전북특별자치도 익산시"
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 p-3.5 text-sm font-bold text-white outline-none focus:border-blue-500"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["전북 익산시", "전북 전주시", "서울 강남구", "경기 수원시", "인근 전지역"].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setRegionText(chip)}
                      className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:border-blue-500 hover:text-white transition"
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
                    {isKorean ? "서비스 가능 분야 선택" : "Capable Services · 서비스 분야"}
                  </label>
                  <span className="text-[11px] font-bold text-blue-400">
                    {selectedServices.length}개 선택됨
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {isKorean
                    ? "출동 및 해결 가능한 분야를 모두 눌러 선택해 주세요. (추후 워크스페이스에서 변경 가능)"
                    : "Select all categories you can service. Can be updated later."}
                </p>

                <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {services.map((srv) => {
                    const isSelected = selectedServices.includes(srv.slug);
                    return (
                      <button
                        key={srv.slug}
                        type="button"
                        onClick={() => handleToggleService(srv.slug)}
                        className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition ${
                          isSelected
                            ? "border-blue-500 bg-blue-900/40 text-white shadow-xs"
                            : "border-slate-800 bg-slate-850 text-slate-400 hover:border-slate-700 hover:text-white"
                        }`}
                      >
                        <span className="text-lg">{srv.icon}</span>
                        <span className="truncate text-xs font-bold">
                          {isKorean ? srv.ko : `${srv.ko} (${srv.slug})`}
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
              <label className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-850 p-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-0"
                />
                <span className="text-xs text-slate-300 leading-relaxed">
                  {isKorean ? (
                    <>
                      <strong>LIFE.HELP 헬퍼 활동 규정 및 안전 수칙</strong>을 확인하였으며, 신속하고 친절한 고객 지원에 성실히 임할 것을 확약합니다. (주민등록번호 미수집)
                    </>
                  ) : (
                    "I agree to the LIFE.HELP regulations and safety terms."
                  )}
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-blue-600 py-4 text-sm font-black text-white shadow-lg transition hover:bg-blue-500 active:scale-98 disabled:opacity-50 flex flex-col items-center justify-center"
              >
                {loading ? (
                  <span>{isKorean ? "처리 중..." : "Processing..."}</span>
                ) : isKorean ? (
                  "3개월 보안 코드로 등록 및 활동 시작 🟢"
                ) : (
                  <>
                    <span>Register & Start Service 🟢</span>
                    <span className="text-xs font-normal text-blue-200 mt-0.5">3개월 보안 코드로 등록 및 활동 시작</span>
                  </>
                )}
              </button>
            </>
          )}
        </form>
      )}
    </div>
  );
}
