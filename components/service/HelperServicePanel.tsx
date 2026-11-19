"use client";

import { useRef, useState, useEffect } from "react";
import { useHelper } from "@/lib/helper/HelperContext";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { ApiError, helperApi, paymentApi } from "@/lib/service/client";
import type { SvcRequest } from "@/lib/service/clientTypes";
import type { HelperEarningsSummary } from "@/lib/service/paymentSettlement";
import { usePoll } from "@/lib/service/usePoll";
import { getService } from "@/lib/services";
import { ServiceChat } from "./ServiceChat";
import { StatusBadge } from "./RequestStatus";

const PANEL = "droplet-card border border-slate-800 bg-slate-900/70 p-5 sm:p-6 backdrop-blur-md";

/**
 * The helper's work area, all from the server: their approval status, availability, the requests they are eligible for (service,
 * region and availability decided by the database), their own jobs, and the chat of the job they open. Nothing here is seeded.
 */
export function HelperServicePanel() {
  const { t } = useLocale();
  const { serverHelper, toggleActiveStatus, refresh } = useHelper();
  const [data, setData] = useState<{ available: SvcRequest[]; mine: SvcRequest[] } | null>(null);
  const [earnings, setEarnings] = useState<HelperEarningsSummary | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const cursor = useRef(0);
  const approved = serverHelper?.status === "APPROVED";

  const load = async () => {
    setData(await helperApi.requests());
    paymentApi.helperEarnings().then(setEarnings).catch(() => undefined);
    const fresh = await helperApi.notifications(cursor.current);
    if (fresh.length) {
      cursor.current = Math.max(...fresh.map((n) => n.id));
      setNotice(t(`svc.event.${fresh[fresh.length - 1].event}`));
    }
  };
  usePoll(load, 3000, approved, (e) => {
    if (e instanceof ApiError && e.code === "NOT_APPROVED") void refresh();
  });

  const act = async (id: string, action: "accept" | "start" | "complete") => {
    setBusy(id);
    setProblem(null);
    try {
      await helperApi.act(id, action);
      if (action === "accept") setOpenId(id);
      await load();
    } catch (e) {
      const code = e instanceof ApiError ? e.code : "NETWORK";
      setProblem(t(code === "INVALID_STATE" ? "svc.helper.alreadyTaken" : code === "NOT_AVAILABLE" ? "svc.helper.mustBeAvailable" : "svc.auth.errGeneric"));
      await load().catch(() => undefined);
    } finally {
      setBusy(null);
    }
  };

  if (!serverHelper) return null;
  const status = serverHelper.status;

  return (
    <div className="space-y-4" data-testid="helper-service-panel" data-status={status}>
      <section className={PANEL}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-black text-white">{t("svc.helper.statusTitle")}</h2>
          <span data-testid="helper-status" className={`rounded-full px-3 py-1 text-xs font-black ${approved ? "bg-emerald-600 text-white" : "bg-amber-500 text-slate-950"}`}>{t(`svc.helper.status.${status}`)}</span>
        </div>
        <p className="mt-2 text-xs text-slate-300" data-testid="helper-status-note">{t(`svc.helper.statusNote.${status}`)}</p>

        {approved && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-800/70 p-3">
            <p className="text-xs font-bold text-slate-200" data-testid="helper-availability">{serverHelper.isAvailable ? t("svc.helper.available") : t("svc.helper.unavailable")}</p>
            <button type="button" data-testid="helper-available-toggle" onClick={() => void toggleActiveStatus()} className={`rounded-xl px-4 py-2 text-xs font-black cursor-pointer ${serverHelper.isAvailable ? "bg-slate-700 text-white" : "bg-emerald-600 text-white"}`}>
              {serverHelper.isAvailable ? t("svc.helper.goOffline") : t("svc.helper.goOnline")}
            </button>
          </div>
        )}
        {notice && <p data-testid="helper-notice" className="mt-3 rounded-lg bg-blue-950/60 p-2 text-[11px] font-bold text-blue-200">🔔 {notice}</p>}
        {problem && <p role="alert" data-testid="helper-problem" className="mt-3 rounded-lg bg-red-950/60 p-2 text-[11px] font-bold text-red-200">{problem}</p>}
      </section>

      {approved && (
        <>
          <section className={PANEL}>
            <h2 className="text-lg font-black text-white">{t("svc.helper.openRequests")}</h2>
            {!serverHelper.isAvailable && <p className="mt-2 text-xs text-slate-400">{t("svc.helper.goOnlineHint")}</p>}
            {data && data.available.length === 0 && serverHelper.isAvailable && <p className="mt-3 text-xs text-slate-400" data-testid="helper-no-requests">{t("svc.helper.noRequests")}</p>}
            <ul className="mt-3 space-y-3">
              {data?.available.map((r) => {
                const s = getService(r.serviceSlug);
                return (
                  <li key={r.id} data-testid="helper-open-request" data-request-id={r.id} className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-black text-white">{s ? t(`service.${s.key}`) : r.serviceSlug}</p>
                      <span className="text-[11px] text-slate-400">{r.sido} {r.gungu}</span>
                    </div>
                    <p dir="auto" className="mt-2 whitespace-pre-wrap text-sm text-slate-100" data-testid="request-text">{r.descriptionTranslation?.status === "OK" && r.descriptionTranslation.text ? r.descriptionTranslation.text : r.description}</p>
                    {r.descriptionTranslation?.status === "OK" && (
                      <p dir="auto" className="mt-1 whitespace-pre-wrap text-[11px] text-slate-400" data-testid="request-original"><span className="font-bold">{t("svc.chat.original")}: </span>{r.description}</p>
                    )}
                    {r.descriptionTranslation?.status === "FAILED" && <p className="mt-1 text-[11px] font-bold text-amber-400">{t("svc.chat.translationFailed")}</p>}
                    {r.payment && (
                      <div className="mt-2.5 rounded-lg bg-slate-900/80 p-2.5 border border-slate-700/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400">서비스 요금: ₩{r.payment.totalAmountKrw.toLocaleString()} (수수료 10% 제외)</span>
                        <span className="font-black text-emerald-400">내 실수령액 (90%): ₩{r.payment.helperPayoutKrw.toLocaleString()}</span>
                      </div>
                    )}
                    <p className="mt-2 text-[11px] text-slate-400">{t("svc.helper.addressAfterAccept")}</p>
                    <button type="button" data-testid="accept-request" disabled={busy === r.id} onClick={() => void act(r.id, "accept")} className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50 cursor-pointer">{t("svc.helper.accept")}</button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className={PANEL}>
            <h2 className="text-lg font-black text-white">{t("svc.helper.myJobs")}</h2>
            {data && data.mine.length === 0 && <p className="mt-3 text-xs text-slate-400">{t("svc.helper.noJobs")}</p>}
            <ul className="mt-3 space-y-3">
              {data?.mine.map((r) => {
                const s = getService(r.serviceSlug);
                const live = r.status === "ASSIGNED" || r.status === "IN_PROGRESS";
                return (
                  <li key={r.id} data-testid="helper-job" data-request-id={r.id} data-status={r.status} className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-black text-white">{s ? t(`service.${s.key}`) : r.serviceSlug}</p>
                      <StatusBadge status={r.status} />
                    </div>
                    <p dir="auto" className="mt-2 text-xs text-slate-200" data-testid="job-address">📍 {r.address}</p>
                    {r.payment && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
                          r.payment.paymentStatus === 'SETTLED' ? 'bg-purple-900 text-purple-200 border border-purple-700' :
                          r.payment.paymentStatus === 'PAID' ? 'bg-emerald-900 text-emerald-200 border border-emerald-700' :
                          'bg-amber-900 text-amber-200 border border-amber-700'
                        }`}>
                          {r.payment.paymentStatus === 'SETTLED' ? '✓ 정산 완료 (90% 입금)' :
                           r.payment.paymentStatus === 'PAID' ? '🛡️ 고객 결제 완료 (에스크로 보관)' :
                           '⏳ 고객 결제 대기 중'}
                        </span>
                        <span className="text-[11px] text-slate-300">정산 실수령액 (90%): ₩{r.payment.helperPayoutKrw.toLocaleString()}</span>
                      </div>
                    )}
                    <p dir="auto" className="mt-1 whitespace-pre-wrap text-sm text-slate-100">{r.descriptionTranslation?.status === "OK" && r.descriptionTranslation.text ? r.descriptionTranslation.text : r.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {r.status === "ASSIGNED" && <button type="button" data-testid="start-job" disabled={busy === r.id} onClick={() => void act(r.id, "start")} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50 cursor-pointer">{t("svc.helper.start")}</button>}
                      {r.status === "IN_PROGRESS" && <button type="button" data-testid="complete-job" disabled={busy === r.id} onClick={() => void act(r.id, "complete")} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50 cursor-pointer">{t("svc.helper.complete")}</button>}
                      {r.status !== "CANCELLED" && <button type="button" data-testid="open-chat" onClick={() => setOpenId(openId === r.id ? null : r.id)} className="rounded-xl border border-slate-600 px-4 py-2 text-xs font-black text-slate-100 cursor-pointer">{openId === r.id ? t("svc.helper.closeChat") : t("svc.helper.openChat")}</button>}
                    </div>
                    {openId === r.id && <div className="mt-3"><ServiceChat requestId={r.id} kind="HELPER" canSend={live} tone="dark" /></div>}
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Helper Earnings & Settlements Dashboard */}
          <section className={PANEL}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>💰</span>
                <span>내 수익 및 정산 관리</span>
              </h2>
              <span className="rounded-full bg-emerald-950 px-2.5 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-800">
                수수료 10% 자동 차감 후 90% 정산
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-slate-800/80 p-3 border border-slate-700">
                <span className="text-[11px] font-bold text-slate-400 block">완료 작업</span>
                <span className="text-lg font-black text-white">{earnings?.totalCompletedJobs ?? 0}건</span>
              </div>
              <div className="rounded-xl bg-slate-800/80 p-3 border border-slate-700">
                <span className="text-[11px] font-bold text-slate-400 block">총 매출 (Gross)</span>
                <span className="text-lg font-black text-slate-200">₩{(earnings?.totalGrossVolumeKrw ?? 0).toLocaleString()}</span>
              </div>
              <div className="rounded-xl bg-slate-800/80 p-3 border border-slate-700">
                <span className="text-[11px] font-bold text-slate-400 block">플랫폼 수수료 (10%)</span>
                <span className="text-lg font-black text-rose-400">-₩{(earnings?.totalPlatformFeesKrw ?? 0).toLocaleString()}</span>
              </div>
              <div className="rounded-xl bg-emerald-950/60 p-3 border border-emerald-700/80">
                <span className="text-[11px] font-bold text-emerald-300 block">내 실수령 정산액 (90%)</span>
                <span className="text-lg font-black text-emerald-400">₩{(earnings?.totalNetEarningsKrw ?? 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-slate-800/50 p-3.5 border border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <p className="font-bold text-slate-200">정산 입금 계좌: 수협 1010-2345-6789 (예금주: 등록 헬퍼)</p>
                <p className="text-[11px] text-slate-400">고객 구매 확정 완료 즉시 등록된 계좌로 90% 정산금이 자동 송금됩니다.</p>
              </div>
              <button
                type="button"
                onClick={() => alert("정산 계좌가 정상 등록되어 있습니다. 고객 구매 확정 즉시 자동 입금됩니다.")}
                className="rounded-xl bg-slate-700 hover:bg-slate-600 px-3.5 py-2 text-xs font-bold text-slate-200 cursor-pointer shrink-0"
              >
                계좌 변경
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
