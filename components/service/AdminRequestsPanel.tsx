"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { ApiError, adminApi } from "@/lib/service/client";
import type { RequestStatus, SvcHelper, SvcRequest } from "@/lib/service/clientTypes";
import { getService } from "@/lib/services";
import { ServiceChat } from "./ServiceChat";
import { StatusBadge } from "./RequestStatus";

const FILTERS: Array<"ALL" | RequestStatus> = ["ALL", "WAITING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

/** Every customer request as the server holds it, with manual assignment, cancellation and the request's chat. */
export function AdminRequestsPanel({ requests, helpers, onChanged }: { requests: SvcRequest[]; helpers: SvcHelper[]; onChanged: () => void }) {
  const { t } = useLocale();
  const [filter, setFilter] = useState<"ALL" | RequestStatus>("ALL");
  const [search, setSearch] = useState("");
  const [assigning, setAssigning] = useState<{ id: string; eligible: string[] } | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => (filter === "ALL" || r.status === filter) && (!q || `${r.serviceSlug} ${r.sido} ${r.gungu} ${r.address} ${r.description} ${r.helper?.displayName ?? ""}`.toLowerCase().includes(q)));
  }, [requests, filter, search]);

  const guard = async (id: string, fn: () => Promise<unknown>) => {
    setBusy(id);
    setProblem(null);
    try {
      await fn();
      onChanged();
    } catch (e) {
      setProblem(e instanceof ApiError && e.status === 401 ? t("svc.admin.sessionExpired") : e instanceof ApiError && e.code === "INVALID_STATE" ? t("svc.admin.stateChanged") : t("svc.auth.errGeneric"));
      onChanged();
    } finally {
      setBusy(null);
    }
  };

  const openAssign = async (r: SvcRequest) => {
    try {
      const detail = await adminApi.request(r.id);
      setAssigning({ id: r.id, eligible: detail.eligibleHelpers });
    } catch {
      setProblem(t("svc.auth.errGeneric"));
    }
  };

  const approved = helpers.filter((h) => h.status === "APPROVED");

  return (
    <section className="space-y-4" data-testid="admin-requests">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button key={f} type="button" data-testid={`request-filter-${f}`} onClick={() => setFilter(f)} className={`droplet-btn px-3 py-1.5 text-xs font-black cursor-pointer ${filter === f ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"}`}>
            {f === "ALL" ? t("svc.admin.all") : t(`svc.status.${f}`)}
            <span className="ml-1 opacity-70">{f === "ALL" ? requests.length : requests.filter((r) => r.status === f).length}</span>
          </button>
        ))}
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("svc.admin.search")} aria-label={t("svc.admin.search")} className="ml-auto min-w-40 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white outline-none" />
      </div>
      {problem && <p role="alert" data-testid="admin-problem" className="rounded-lg bg-red-950/60 p-2 text-xs font-bold text-red-200">{problem}</p>}
      {shown.length === 0 && <p className="rounded-xl border border-slate-800 p-6 text-center text-sm text-slate-400" data-testid="admin-no-requests">{t("svc.admin.noRequests")}</p>}
      <ul className="space-y-3">
        {shown.map((r) => {
          const s = getService(r.serviceSlug);
          const final = r.status === "COMPLETED" || r.status === "CANCELLED";
          return (
            <li key={r.id} data-testid="admin-request" data-request-id={r.id} data-status={r.status} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-white">{s ? t(`service.${s.key}`) : r.serviceSlug}</p>
                <div className="flex items-center gap-2">
                  {r.status === "WAITING" && r.unmatched && <span data-testid="admin-unmatched" className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white">{t("svc.admin.unmatched")}</span>}
                  <StatusBadge status={r.status} />
                </div>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">📍 {r.sido} {r.gungu} · {r.address} · {new Date(r.createdAt).toLocaleString()}</p>
              <p dir="auto" className="mt-2 whitespace-pre-wrap text-sm text-slate-100">{r.description}</p>
              {r.descriptionTranslation?.status === "OK" && <p dir="auto" className="mt-1 whitespace-pre-wrap text-[11px] text-emerald-300">{r.descriptionTranslation.text}</p>}
              {r.helper && <p className="mt-2 text-xs font-bold text-blue-300" data-testid="admin-assigned">🛠️ {r.helper.displayName}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {(r.status === "WAITING" || r.status === "ASSIGNED") && <button type="button" data-testid="admin-assign" onClick={() => void openAssign(r)} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white cursor-pointer">{r.status === "WAITING" ? t("svc.admin.assign") : t("svc.admin.reassign")}</button>}
                {!final && <button type="button" data-testid="admin-cancel" disabled={busy === r.id} onClick={() => window.confirm(t("svc.req.cancelConfirm")) && void guard(r.id, () => adminApi.cancel(r.id))} className="rounded-xl border border-slate-600 px-4 py-2 text-xs font-black text-slate-200 disabled:opacity-50 cursor-pointer">{t("svc.admin.cancelRequest")}</button>}
                <button type="button" data-testid="admin-open-chat" onClick={() => setChatId(chatId === r.id ? null : r.id)} className="rounded-xl border border-slate-600 px-4 py-2 text-xs font-black text-slate-200 cursor-pointer">{chatId === r.id ? t("svc.helper.closeChat") : t("svc.helper.openChat")}</button>
              </div>
              {assigning?.id === r.id && (
                <div className="mt-3 rounded-xl border border-blue-800/60 bg-slate-950/70 p-3" data-testid="admin-assign-box">
                  <p className="text-xs font-black text-white">{t("svc.admin.pickHelper")}</p>
                  {approved.length === 0 && <p className="mt-2 text-[11px] text-slate-400">{t("svc.admin.noApproved")}</p>}
                  <ul className="mt-2 space-y-1.5">
                    {[...approved].sort((a, b) => Number(assigning.eligible.includes(b.id)) - Number(assigning.eligible.includes(a.id))).map((h) => (
                      <li key={h.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-900 p-2">
                        <span className="min-w-0 text-xs text-slate-100"><span className="font-bold">{h.displayName}</span>{assigning.eligible.includes(h.id) ? <span className="ml-2 rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] font-black">{t("svc.admin.eligible")}</span> : <span className="ml-2 text-[10px] text-amber-400">{t("svc.admin.override")}</span>}{h.id === r.helper?.id ? " ✓" : ""}</span>
                        <button type="button" data-testid={`assign-to-${h.id}`} disabled={busy === r.id || h.id === r.helper?.id} onClick={() => void guard(r.id, async () => { await adminApi.assign(r.id, h.id); setAssigning(null); })} className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-black text-white disabled:opacity-40 cursor-pointer">{t("svc.admin.assignHere")}</button>
                      </li>
                    ))}
                  </ul>
                  <button type="button" onClick={() => setAssigning(null)} className="mt-2 text-[11px] font-bold text-slate-400 cursor-pointer">{t("svc.admin.close")}</button>
                </div>
              )}
              {chatId === r.id && <div className="mt-3"><ServiceChat requestId={r.id} kind="ADMIN" canSend={!final} tone="dark" /></div>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
