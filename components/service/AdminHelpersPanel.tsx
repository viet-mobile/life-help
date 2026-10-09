"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { ApiError, adminApi } from "@/lib/service/client";
import type { HelperStatus, SvcHelper } from "@/lib/service/clientTypes";
import { getService } from "@/lib/services";

const FILTERS: Array<"ALL" | HelperStatus> = ["ALL", "PENDING", "APPROVED", "SUSPENDED", "DISABLED"];
const TONE: Record<HelperStatus, string> = {
  PENDING: "bg-amber-500 text-slate-950",
  APPROVED: "bg-emerald-600 text-white",
  SUSPENDED: "bg-orange-600 text-white",
  DISABLED: "bg-slate-600 text-white",
};
/** The moves the database allows (PENDING -> APPROVED/DISABLED, APPROVED -> SUSPENDED/DISABLED, SUSPENDED -> APPROVED/DISABLED). */
const MOVES: Record<HelperStatus, Array<{ to: HelperStatus; label: string }>> = {
  PENDING: [{ to: "APPROVED", label: "svc.admin.approve" }, { to: "DISABLED", label: "svc.admin.reject" }],
  APPROVED: [{ to: "SUSPENDED", label: "svc.admin.suspend" }, { to: "DISABLED", label: "svc.admin.disable" }],
  SUSPENDED: [{ to: "APPROVED", label: "svc.admin.reinstate" }, { to: "DISABLED", label: "svc.admin.disable" }],
  DISABLED: [],
};

/** Helper applications and their approval, straight from the server. Only an APPROVED helper can take work. */
export function AdminHelpersPanel({ helpers, onChanged }: { helpers: SvcHelper[]; onChanged: () => void }) {
  const { t } = useLocale();
  const [filter, setFilter] = useState<"ALL" | HelperStatus>("ALL");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return helpers.filter((h) => (filter === "ALL" || h.status === filter) && (!q || `${h.displayName} ${h.contactEmail ?? ""} ${h.capabilities.join(" ")} ${h.regions.map((r) => `${r.sido} ${r.gungu}`).join(" ")}`.toLowerCase().includes(q)));
  }, [helpers, filter, search]);

  const move = async (h: SvcHelper, to: HelperStatus) => {
    setBusy(h.id);
    setProblem(null);
    try {
      await adminApi.setHelperStatus(h.id, to);
      onChanged();
    } catch (e) {
      setProblem(e instanceof ApiError && e.status === 401 ? t("svc.admin.sessionExpired") : t("svc.auth.errGeneric"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="space-y-4" data-testid="admin-helpers">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button key={f} type="button" data-testid={`helper-filter-${f}`} onClick={() => setFilter(f)} className={`droplet-btn px-3 py-1.5 text-xs font-black cursor-pointer ${filter === f ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"}`}>
            {f === "ALL" ? t("svc.admin.all") : t(`svc.helper.status.${f}`)}
            <span className="ml-1 opacity-70">{f === "ALL" ? helpers.length : helpers.filter((h) => h.status === f).length}</span>
          </button>
        ))}
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("svc.admin.search")} aria-label={t("svc.admin.search")} className="ml-auto min-w-40 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white outline-none" />
      </div>
      {problem && <p role="alert" className="rounded-lg bg-red-950/60 p-2 text-xs font-bold text-red-200">{problem}</p>}
      {shown.length === 0 && <p className="rounded-xl border border-slate-800 p-6 text-center text-sm text-slate-400" data-testid="admin-no-helpers">{t("svc.admin.noHelpers")}</p>}
      <ul className="space-y-3">
        {shown.map((h) => (
          <li key={h.id} data-testid={`admin-helper-${h.id}`} data-status={h.status} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-black text-white">{h.displayName}</p>
              <span className={`rounded-full px-3 py-1 text-[11px] font-black ${TONE[h.status]}`}>{t(`svc.helper.status.${h.status}`)}{h.status === "APPROVED" && h.isAvailable ? ` · ${t("svc.admin.online")}` : ""}</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">{h.contactEmail ? `✉️ ${h.contactEmail} · ` : ""}{t("svc.admin.language")}: {h.primaryLocale} · {t("svc.admin.credentialUntil")}: {new Date(h.credentialExpiresAt).toLocaleDateString()}</p>
            <p className="mt-2 text-xs text-slate-200">{h.capabilities.map((s) => { const svc = getService(s); return svc ? t(`service.${svc.key}`) : s; }).join(", ")}</p>
            <p className="mt-1 text-[11px] text-slate-400">📍 {h.regions.map((r) => `${r.sido ?? t("svc.admin.anywhere")} ${r.gungu ?? ""}`.trim()).join(" · ")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {MOVES[h.status].map((m) => (
                <button key={m.to} type="button" data-testid={`helper-${m.to.toLowerCase()}-${h.id}`} disabled={busy === h.id} onClick={() => void move(h, m.to)}
                  className={`rounded-xl px-4 py-2 text-xs font-black text-white disabled:opacity-50 cursor-pointer ${m.to === "APPROVED" ? "bg-emerald-600" : m.to === "SUSPENDED" ? "bg-orange-600" : "bg-slate-700"}`}>{t(m.label)}</button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
