"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useHelper, type HelperRegionItem } from "@/lib/helper/HelperContext";
import { services } from "@/lib/services";
import { koreanRegions } from "@/lib/region/regions";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { navigateToMainHome } from "@/lib/navigation";
import { WorkHoursPicker } from "@/components/tech/WorkHoursPicker";

const DAYS_OF_WEEK = ["월", "화", "수", "목", "금", "토", "일"];
const TIME_PRESETS = [
  "24시간 즉시 출동 가능",
  "주간 근무 (09:00 - 18:00)",
  "야간/심야 (18:00 - 09:00)",
  "주말/공휴일 집중 근무",
];

export default function TechContractPage() {
  const router = useRouter();
  const { locale, t, isBilingual } = useLocale();
  const isKorean = locale === "ko";
  const { helper, isLoggedIn, saveContract } = useHelper();

  // Form State
  const [name, setName] = useState(helper?.contract?.name || "");

  // Selected Services
  const [selectedServices, setSelectedServices] = useState<string[]>(
    helper?.contract?.services || [
      "toilet-clog",
      "sink-drain",
      "floor-drain",
    ],
  );

  // Selected Regions
  const [selectedRegions, setSelectedRegions] = useState<HelperRegionItem[]>(
    helper?.contract?.regions || [
      { sido: "전북특별자치도", gungu: "익산시" },
      { sido: "전북특별자치도", gungu: "전주시 덕진구" },
    ],
  );
  const [addSido, setAddSido] = useState("전북특별자치도");
  const [addGungu, setAddGungu] = useState("익산시");

  // Schedule
  const [availableDays, setAvailableDays] = useState<string[]>(
    helper?.contract?.availableDays || ["월", "화", "수", "목", "금", "토"],
  );
  const [availableHours, setAvailableHours] = useState(
    helper?.contract?.availableHours || "24시간 즉시 출동 가능",
  );
  const [showHoursPicker, setShowHoursPicker] = useState(false);

  // Agreement
  const [agreed, setAgreed] = useState(true);
  const [signatureText, setSignatureText] = useState(name || "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If not logged in with phone, redirect to login
  useEffect(() => {
    if (!isLoggedIn || !helper) {
      router.replace("/tech/login");
    }
  }, [isLoggedIn, helper, router]);

  if (!isLoggedIn || !helper) {
    return null;
  }

  const currentSidoObj = koreanRegions.find((s) => s.name === addSido) || koreanRegions[0];

  const handleToggleService = (slug: string) => {
    setSelectedServices((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const handleAddRegion = () => {
    if (!selectedRegions.some((r) => r.sido === addSido && r.gungu === addGungu)) {
      setSelectedRegions((prev) => [...prev, { sido: addSido, gungu: addGungu }]);
    }
  };

  const handleRemoveRegion = (index: number) => {
    setSelectedRegions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleDay = (day: string) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError(isKorean ? "성명을 입력해 주세요." : "Please enter your name.");
      return;
    }
    if (selectedServices.length === 0) {
      setError(
        isKorean
          ? "최소 하나 이상의 서비스 가능 분야를 선택해 주세요."
          : "Please select at least one service category.",
      );
      return;
    }
    if (selectedRegions.length === 0) {
      setError(
        isKorean
          ? "최소 하나 이상의 활동 가능 지역을 선택해 주세요."
          : "Please select at least one available region.",
      );
      return;
    }
    if (availableDays.length === 0) {
      setError(
        isKorean
          ? "최소 하나 이상의 활동 가능 요일을 선택해 주세요."
          : "Please select at least one working day.",
      );
      return;
    }
    if (!agreed) {
      setError(
        isKorean
          ? "계약서 약관 및 변동 상황 고지 의무에 동의해야 합니다."
          : "You must agree to the contract terms.",
      );
      return;
    }
    if (!signatureText.trim()) {
      setError(
        isKorean ? "전자 서명을 입력해 주세요." : "Please provide your electronic signature.",
      );
      return;
    }

    setSubmitting(true);

    saveContract({
      name: name.trim(),
      residentNumber: "AUTH-VERIFIED",
      email: helper.email || "",
      phone: helper.phone,
      services: selectedServices,
      regions: selectedRegions,
      availableDays,
      availableHours,
      agreedToTerms: true,
      signatureDataUrl: signatureText.trim(),
    });

    setSubmitting(false);
    router.push("/tech/workspace");
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <Link
            href="/"
            onClick={navigateToMainHome}
            className="inline-flex items-center gap-2 text-xl font-extrabold text-blue-400 hover:text-blue-300 transition cursor-pointer"
            title="LIFE.HELP 메인 홈으로 이동"
          >
            <BrandLogo size="md" priority />
            <span className="text-white text-sm sm:text-base font-bold">{isKorean ? "헬퍼 전자계약" : "HELPER CONTRACT"}</span>
          </Link>
          <LanguageSwitcher />
        </div>

        {/* Title */}
        <div className="mt-8 text-center sm:text-left">
          <span className="rounded-lg bg-blue-900/40 px-3 py-1 text-xs font-bold text-blue-300 border border-blue-700/50">
            {isKorean ? "공식 위탁 계약 체결" : "Official Helper Contract · 헬퍼 공식 계약"}
          </span>
          <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-white">
            {isKorean
              ? "LIFE.HELP 헬퍼(Helper) 업무 위탁 전자계약서"
              : "LIFE.HELP Helper Electronic Commission Agreement · 헬퍼 전자계약서"}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
            {isKorean
              ? "본 계약서는 헬퍼님의 신원 정보와 서비스 가능 분야, 출동 지역 및 일정을 등록하고 회사와의 상호 협력 의무를 확약하는 전자계약서입니다."
              : "This agreement records your identity, capable service categories, regions, and schedule to establish partnership with LIFE.HELP."}
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-900/30 border border-red-700/60 p-4 text-sm text-red-200">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          {/* Section 1: Helper Identity */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-7 backdrop-blur-md">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-extrabold">
                1
              </span>
              {isKorean ? "헬퍼 인적 사항 (신원 확인)" : "Helper Identity · 헬퍼 인적 사항"}
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300">
                  {isKorean ? "성명 (실명)" : "Full Name · 성명"}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!signatureText) setSignatureText(e.target.value);
                  }}
                  placeholder={isKorean ? "예: 홍길동" : "e.g. Hong Gil-dong"}
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-sm font-bold text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300">
                  {isKorean ? "인증된 이메일 계정" : "Verified Email · 이메일"}
                </label>
                <input
                  type="text"
                  readOnly
                  value={helper.email || helper.phone}
                  className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-800/50 p-3 text-sm font-bold text-blue-300 cursor-not-allowed"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="rounded-2xl border border-blue-800/40 bg-blue-950/30 p-4 text-xs text-blue-200">
                  <div className="flex items-center gap-2 font-bold text-blue-300">
                    <span>🛡️</span>
                    <span>3개월 보안 접속 시스템 적용 (주민등록번호 수집 배제)</span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-blue-300/80 leading-relaxed">
                    LIFE.HELP는 헬퍼님의 개인정보 보호를 위해 불필요한 주민등록번호 수집을 하지 않으며, 인증된 이메일 계정과 3개월(90일) 보안 코드로 본인 확인 및 파트너 자격을 안전하게 관리합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Capable Service Fields */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-7 backdrop-blur-md">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-extrabold">
                2
              </span>
              {isKorean ? "서비스 가능 분야 선택" : "Capable Service Categories · 서비스 분야"}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {isKorean
                ? "현재 헬퍼님이 직접 출동하여 해결 가능한 서비스 분야를 모두 선택해 주세요. (추후 언제든지 추가 또는 제외 가능)"
                : "Select all categories you can handle. You can add or remove categories anytime."}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {services.map((srv) => {
                const isSelected = selectedServices.includes(srv.slug);
                return (
                  <button
                    key={srv.slug}
                    type="button"
                    onClick={() => handleToggleService(srv.slug)}
                    className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-900/40 text-white shadow-xs"
                        : "border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    <span className="text-xl">{srv.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">
                        {isKorean ? srv.ko : `${t(`services.${srv.key}`)} · ${srv.ko}`}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-blue-400">
                      {isSelected ? "✓" : "+"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Available Regions */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-7 backdrop-blur-md">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-extrabold">
                3
              </span>
              {isKorean ? "출동 가능 지역 선택" : "Operating Service Regions · 출동 가능 지역"}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {isKorean
                ? "출동 가능한 시·도 및 시·군·구를 추가해 주세요. 선택된 지역에 배차 및 고객 연결이 이루어집니다."
                : "Add provinces and cities where you can take service calls."}
            </p>

            {/* Add Region Bar */}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <select
                value={addSido}
                onChange={(e) => {
                  setAddSido(e.target.value);
                  const s = koreanRegions.find((r) => r.name === e.target.value);
                  if (s && s.gunguList[0]) setAddGungu(s.gunguList[0].name);
                }}
                className="rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-xs font-bold text-white outline-none focus:border-blue-500"
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
                className="rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-xs font-bold text-white outline-none focus:border-blue-500"
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
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-blue-500"
              >
                + {isKorean ? "지역 추가" : "Add Region"}
              </button>
            </div>

            {/* Region Badges */}
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedRegions.map((reg, idx) => (
                <span
                  key={`${reg.sido}-${reg.gungu}`}
                  className="flex items-center gap-1.5 rounded-xl border border-blue-700/60 bg-blue-950/60 px-3 py-1.5 text-xs font-bold text-blue-200"
                >
                  <span>📍 {reg.sido} {reg.gungu}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRegion(idx)}
                    className="ml-1 text-slate-400 hover:text-red-400"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Section 4: Available Schedule */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-7 backdrop-blur-md">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-extrabold">
                4
              </span>
              {isKorean ? "활동 가능 요일 및 시간" : "Working Schedule · 활동 요일 및 시간"}
            </h2>

            {/* Days */}
            <div className="mt-4">
              <label className="block text-xs font-bold uppercase text-slate-300">
                {isKorean ? "출동 가능 요일 (다중 선택)" : "Available Days"}
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((d) => {
                  const isChecked = availableDays.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleToggleDay(d)}
                      className={`h-10 w-10 rounded-xl font-bold text-sm transition ${
                        isChecked
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hours */}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase text-slate-300">
                  {isKorean ? "출동 가능 시간대" : "Available Hours"}
                </label>
                <button
                  type="button"
                  onClick={() => setShowHoursPicker(true)}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 transition"
                >
                  ⚙️ {isKorean ? "30분 단위 자유 설정 (휴게 포함)" : "Custom 30-min Setup"}
                </button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {TIME_PRESETS.map((preset) => (
                  <label
                    key={preset}
                    className={`flex items-center gap-2.5 rounded-xl border p-3 cursor-pointer transition text-xs font-bold ${
                      availableHours === preset
                        ? "border-blue-500 bg-blue-900/30 text-white"
                        : "border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="hoursPreset"
                      checked={availableHours === preset}
                      onChange={() => setAvailableHours(preset)}
                      className="accent-blue-500"
                    />
                    <span>{preset}</span>
                  </label>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={availableHours}
                  onChange={(e) => setAvailableHours(e.target.value)}
                  placeholder="직접 입력 (예: 09:00 - 12:00, 13:00 - 18:00)"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-xs font-bold text-white outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowHoursPicker(true)}
                  className="rounded-xl border border-blue-500 bg-blue-900/40 px-3 py-2 text-xs font-bold text-blue-300 hover:bg-blue-800 transition shrink-0"
                >
                  ⏱️ {isKorean ? "상세 설정" : "Picker"}
                </button>
              </div>

              {/* Hours Picker Modal */}
              {showHoursPicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
                  <div className="w-full max-w-xl">
                    <WorkHoursPicker
                      initialValue={availableHours}
                      onSave={(newHours) => {
                        setAvailableHours(newHours);
                        setShowHoursPicker(false);
                      }}
                      onCancel={() => setShowHoursPicker(false)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Terms & Duty of Immediate Notification */}
          <div className="rounded-3xl border border-blue-900/60 bg-blue-950/40 p-6 sm:p-7 backdrop-blur-md">
            <h2 className="text-lg font-bold text-blue-300 flex items-center gap-2">
              📜 {isKorean ? "계약 규정 및 변동 상황 즉시 고지 의무" : "Duty of Immediate Notification · 변동 상황 고지 의무"}
            </h2>

            <div className="mt-3 rounded-2xl bg-slate-900/80 border border-slate-800 p-4 text-xs leading-relaxed text-slate-300 space-y-3 font-medium">
              <p>
                <strong>제1조 (변동 상황의 즉시 통보 의무)</strong>
                <br />
                헬퍼는 언제든지 개인 사정, 휴식, 질병 또는 기타 사유로 <strong>일시적으로 일을 할 수 없는 경우</strong>, 즉시 본 LIFE.HELP 앱에 접속하여 가용 상태를 &lsquo;일시 업무 중단&rsquo;으로 변경하거나, 회사의 주 서비스 시스템 이동전화번호(<strong>010-5757-5757</strong> 또는 <strong>010-5959-5959</strong>)로 변동 상황을 유선 또는 문자로 즉시 알려야 합니다.
              </p>
              <p>
                <strong>제2조 (서비스 분야 및 지역 변경 통보)</strong>
                <br />
                이전에 서비스할 수 있다고 선택했던 분야를 서비스할 수 없게 된 경우나, 갈 수 있다고 선택했던 지역에 갈 수 없게 된 경우에도 즉시 회사에 알리거나 앱에서 제외해야 합니다. 반대로 새로운 기술을 습득하여 서비스할 수 없던 분야를 서비스할 수 있게 된 경우에는 본인이 앱에서 해당 분야를 즉시 추가 선택할 수 있습니다.
              </p>
              <p>
                <strong>제3조 (실시간 가용성 반영)</strong>
                <br />
                헬퍼가 앱 또는 주 시스템 전화번호로 알린 변동 상황은 시스템에 즉시 반영되며, 고객 배차 및 연결 알고리즘에 즉각 적용됩니다.
              </p>
            </div>

            <label className="mt-4 flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="h-5 w-5 rounded-md accent-blue-600"
              />
              <span className="text-xs sm:text-sm font-extrabold text-white">
                {isKorean
                  ? "위 계약 규정 및 변동 상황 즉시 고지 의무를 명확히 이해하였으며 이에 동의합니다. (필수)"
                  : "I understand and agree to the contract terms and the duty of immediate notification. (Required)"}
              </span>
            </label>

            {/* Signature */}
            <div className="mt-6 border-t border-blue-900/40 pt-4">
              <label className="block text-xs font-bold uppercase text-blue-300">
                {isKorean ? "전자 서명 (성명 서명)" : isBilingual ? "Electronic Signature · 전자 서명" : "Electronic Signature"}
              </label>
              <input
                type="text"
                required
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
                placeholder={isKorean ? "서명자 성명 입력" : "Enter signature name"}
                className="mt-1.5 w-full rounded-xl border border-blue-700 bg-slate-900 p-3 text-base font-extrabold text-white outline-none focus:border-blue-400 tracking-wider"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                {isKorean ? "계약 체결일: " : "Date: "}{new Date().toLocaleDateString(locale === "ko" ? "ko-KR" : undefined)}
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Link
              href="/tech"
              className="rounded-xl border border-slate-700 bg-slate-800/90 px-6 py-3.5 text-center text-sm font-bold text-slate-300 hover:bg-slate-700 hover:text-white shadow-2xs active:scale-[0.98] transition cursor-pointer"
            >
              {isKorean ? "취소" : "Cancel"}
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-3.5 text-center text-sm font-black text-white shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 hover:brightness-105 active:scale-[0.98] disabled:opacity-50 transition cursor-pointer border border-blue-500/30"
            >
              {submitting
                ? isKorean
                  ? "계약서 체결 중..."
                  : "Signing..."
                : isKorean
                ? "전자계약 체결 및 헬퍼 등록 완료"
                : isBilingual
                ? "Sign Agreement & Complete Helper Registration · 계약 체결 완료"
                : "Sign Agreement & Complete Helper Registration"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
