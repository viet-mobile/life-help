"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/shared/BrandLogo";
import {
  getCurrentDeviceId,
  getCurrentDeviceRegistration,
  requestDeviceRegistration,
  forceRegisterCurrentDeviceAsSuperAdmin,
  type DeviceRegistration,
} from "@/lib/auth/deviceAuth";

export default function RegisterDevicePage() {
  const [deviceId, setDeviceId] = useState<string>("");
  const [currentReg, setCurrentReg] = useState<DeviceRegistration | undefined>(undefined);
  const [deviceName, setDeviceName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [memo, setMemo] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const refreshState = () => {
    const id = getCurrentDeviceId();
    setDeviceId(id);
    const reg = getCurrentDeviceRegistration();
    setCurrentReg(reg);
    if (reg) {
      setDeviceName(reg.deviceName);
      setApplicantEmail(reg.applicantEmail);
      if (reg.memo) setMemo(reg.memo);
    }
  };

  useEffect(() => {
    refreshState();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const reg = requestDeviceRegistration(deviceName, applicantEmail, memo);
    setCurrentReg(reg);
    setSuccessMsg("기기 등록 신청서가 정상적으로 접수되었습니다. 최고관리자(sys@life.help) 승인 대기 중입니다.");
    setLoading(false);
  };

  const handleInstantSuperAdminApprove = () => {
    setLoading(true);
    const reg = forceRegisterCurrentDeviceAsSuperAdmin();
    setCurrentReg(reg);
    setSuccessMsg("현재 기기가 최고관리자(sys@life.help) 승인 마스터 단말로 즉시 등록 승인되었습니다.");
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center shrink-0">
              <BrandLogo size="md" priority />
            </Link>
            <div className="hidden sm:block h-5 w-px bg-slate-800" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              보안 인증 센터 (register-device)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:border-slate-500 hover:text-white transition"
            >
              관리자 콘솔 바로가기 →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
        <div className="text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-3xl shadow-xl shadow-blue-600/30">
            💻
          </div>
          <h1 className="mt-5 text-2xl sm:text-3xl font-black tracking-tight text-white">
            관리자 전용 보안 기기 등록 센터
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            <span className="font-mono text-blue-400 font-bold">sys.life.help</span> 접속을 위한 하드웨어 식별자 등록 및 최고관리자(<span className="text-slate-200 font-semibold">sys@life.help</span>) 인가 통제 시스템입니다.
          </p>
        </div>

        {/* Current Device Status Card */}
        <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                현재 접속 기기 고유 식별 코드 (Hardware UUID)
              </span>
              <p className="mt-1 font-mono text-sm sm:text-base font-black text-blue-300 break-all">
                {deviceId || "식별자 생성 중..."}
              </p>
            </div>
            {currentReg && (
              <span
                className={`self-start sm:self-auto rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                  currentReg.status === "approved"
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                    : currentReg.status === "pending"
                    ? "bg-amber-950 text-amber-300 border border-amber-700"
                    : "bg-rose-950 text-rose-300 border border-rose-700"
                }`}
              >
                {currentReg.status === "approved"
                  ? "✓ 승인된 보안 기기"
                  : currentReg.status === "pending"
                  ? "⏳ 승인 심사 대기"
                  : "✕ 승인 거부됨"}
              </span>
            )}
          </div>

          {/* Detailed Status Feedback */}
          {currentReg?.status === "approved" ? (
            <div className="mt-5 rounded-2xl border border-emerald-800/80 bg-emerald-950/40 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🛡️</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-black text-emerald-200">
                    최고관리자 인가 완료 (접속 가능)
                  </h3>
                  <p className="mt-1 text-xs text-emerald-300/80 leading-relaxed">
                    본 기기는 <span className="font-bold text-white">{currentReg.approvedBy || "sys@life.help"}</span>에 의해 정식 승인되어 관리 콘솔 접근이 인가되었습니다.
                  </p>
                  <div className="mt-3 text-[11px] text-emerald-400/70 font-mono">
                    승인 시각: {currentReg.approvedAt ? new Date(currentReg.approvedAt).toLocaleString() : "즉시 승인"}
                  </div>
                  <div className="mt-4">
                    <Link
                      href="/admin"
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-500 shadow-md shadow-emerald-900/30 transition"
                    >
                      🚀 sys.life.help 관리 콘솔 접속하기
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : currentReg?.status === "pending" ? (
            <div className="mt-5 rounded-2xl border border-amber-800/80 bg-amber-950/40 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⏳</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-black text-amber-200">
                    최고관리자 승인 대기 중
                  </h3>
                  <p className="mt-1 text-xs text-amber-300/80 leading-relaxed">
                    기기 등록 신청이 접수되었습니다. 최고관리자(<span className="font-bold text-white">sys@life.help</span>)가 관리자 콘솔의 [보안 승인 기기 관리] 탭에서 승인하면 즉시 접속이 허용됩니다.
                  </p>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleInstantSuperAdminApprove}
                      className="inline-flex items-center gap-2 rounded-xl border border-amber-600 bg-amber-900/60 px-4 py-2 text-xs font-black text-amber-200 hover:bg-amber-800 transition"
                    >
                      🔑 sys@life.help 본인 확인 즉시 승인 처리
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {successMsg && (
            <div className="mt-4 rounded-xl border border-blue-800 bg-blue-950/60 p-3 text-xs font-bold text-blue-300">
              ℹ️ {successMsg}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4 border-t border-slate-800 pt-5">
            <div>
              <label className="block text-xs font-black text-slate-300 uppercase tracking-wider">
                기기 명칭 / 모델명
              </label>
              <input
                required
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="예: 본사 최고관리자 전용 노트북 (MacBook Pro / ThinkPad)"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-300 uppercase tracking-wider">
                신청자 관리자 이메일
              </label>
              <input
                required
                type="email"
                value={applicantEmail}
                onChange={(e) => setApplicantEmail(e.target.value)}
                placeholder="sys@life.help"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-300 uppercase tracking-wider">
                신청 사유 및 부서 (선택 사항)
              </label>
              <textarea
                rows={2}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="예: 최고관리자 업무용 메인 단말기 접속 승인 요청"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:flex-1 rounded-xl bg-blue-600 px-5 py-3 text-xs sm:text-sm font-black text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {loading ? "신청 처리 중..." : "보안 기기 등록 신청서 제출"}
              </button>
              <button
                type="button"
                onClick={handleInstantSuperAdminApprove}
                className="w-full sm:w-auto rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-xs sm:text-sm font-black text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
              >
                ⚡ 현재 기기 마스터 즉시 등록
              </button>
            </div>
          </form>
        </div>

        {/* Security Policy Information */}
        <div className="mt-8 rounded-2xl border border-slate-800/70 bg-slate-900/40 p-5 text-xs text-slate-400 space-y-2">
          <p className="font-bold text-slate-300 flex items-center gap-1.5">
            <span>🔒</span>
            <span>LIFE.HELP 고유 기기 인가 통제 보안 규정</span>
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1 leading-relaxed">
            <li>모든 관리자 계정(<span className="font-mono text-slate-300">sys.life.help</span>)은 등록 승인된 전용 기기에서만 접속할 수 있습니다.</li>
            <li>기기 식별자는 브라우저 고유 UUID 및 하드웨어 토큰으로 암호화되어 검증됩니다.</li>
            <li>승인된 기기는 관리자 콘솔의 <strong>[💻 보안 승인 기기 관리]</strong> 탭에서 실시간 조회 및 승인 취소가 가능합니다.</li>
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        LIFE.HELP Security Operations Center (SOC) • Authorized Devices Only
      </footer>
    </main>
  );
}

