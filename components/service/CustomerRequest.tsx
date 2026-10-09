"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { ApiError, customerApi } from "@/lib/service/client";
import type { SvcEvent, SvcRequest } from "@/lib/service/clientTypes";
import { usePoll } from "@/lib/service/usePoll";
import { getService } from "@/lib/services";
import { ServiceChat } from "./ServiceChat";
import { StatusBadge, StatusSteps } from "./RequestStatus";

/** One request as the server knows it, refreshed every few seconds, with its chat. Everything shown here comes from the database. */
export function CustomerRequest({ requestId, token }: { requestId: string; /** only in memory, from the link just opened or created: used to show the shareable link, never stored */ token: string | null }) {
  const { t } = useLocale();
  const [request, setRequest] = useState<SvcRequest | null>(null);
  const [events, setEvents] = useState<SvcEvent[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "offline">("loading");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  usePoll(async () => {
    const out = await customerApi.get(requestId);
    setRequest(out.request);
    setEvents(out.events);
    setState("ready");
  }, 3000, true, (e) => {
    if (e instanceof ApiError && e.status === 404) setState("missing");
    else setState((cur) => (cur === "ready" ? cur : "offline"));
  });

  if (state === "missing") {
    return (
      <div className="droplet-card border border-slate-200 bg-white p-6 text-center" data-testid="request-missing">
        <p className="text-sm font-bold text-slate-800">{t("svc.req.missing")}</p>
        <Link href="/request" className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white">{t("svc.req.newRequest")}</Link>
      </div>
    );
  }
  if (!request) {
    return <p className="p-6 text-center text-sm text-slate-500" role="status" data-testid="request-loading">{state === "offline" ? t("svc.req.offline") : t("svc.req.loading")}</p>;
  }

  const service = getService(request.serviceSlug);
  const open = request.status === "WAITING" || request.status === "ASSIGNED";
  const link = typeof window !== "undefined" && token ? `${window.location.origin}/chat?r=${request.id}#t=${token}` : null;

  const cancel = async () => {
    if (busy || !window.confirm(t("svc.req.cancelConfirm"))) return;
    setBusy(true);
    try { setRequest(await customerApi.cancel(request.id)); } catch { /* the next refresh shows the truth */ } finally { setBusy(false); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(link ?? ""); setCopied(true); } catch { /* shown below to copy by hand */ }
  };

  return (
    <div className="space-y-4" data-testid="customer-request" data-status={request.status}>
      <section className="droplet-card border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-black text-slate-900">{service ? t(`service.${service.key}`) : request.serviceSlug}</h1>
          <StatusBadge status={request.status} />
        </div>
        <p className="mt-1 text-xs text-slate-500">{request.sido} {request.gungu}</p>
        <StatusSteps status={request.status} />

        {request.status === "WAITING" && (
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-900" data-testid={request.unmatched ? "request-unmatched" : "request-waiting"}>
            {request.unmatched ? t("svc.req.unmatched") : t("svc.req.waiting")}
          </p>
        )}
        {request.helper && request.status !== "CANCELLED" && (
          <p className="mt-3 text-sm font-bold text-slate-800" data-testid="request-helper">{t("svc.req.helper").replace("{name}", request.helper.displayName)}</p>
        )}
        {request.status === "COMPLETED" && <p className="mt-3 text-sm font-bold text-emerald-700">{t("svc.req.completed")}</p>}
        {request.status === "CANCELLED" && <p className="mt-3 text-sm font-bold text-slate-600">{t("svc.req.cancelled")}</p>}

        <dl className="mt-4 space-y-2 text-xs text-slate-700">
          <div><dt className="font-black text-slate-500">{t("svc.req.address")}</dt><dd dir="auto">{request.address}</dd></div>
          <div><dt className="font-black text-slate-500">{t("svc.req.description")}</dt><dd dir="auto" className="whitespace-pre-wrap">{request.description}</dd></div>
        </dl>

        {link && (
          <div className="mt-4 rounded-xl bg-slate-50 p-3">
            <p className="text-[11px] font-bold text-slate-600">{t("svc.req.saveLink")}</p>
            <p dir="ltr" className="mt-1 break-all text-[11px] text-slate-500" data-testid="request-link">{link}</p>
            <button type="button" onClick={copy} className="mt-2 rounded-lg bg-slate-200 px-3 py-1.5 text-[11px] font-black text-slate-800 cursor-pointer">{copied ? t("svc.req.copied") : t("svc.req.copy")}</button>
          </div>
        )}
        {open && (
          <button type="button" data-testid="request-cancel" onClick={cancel} disabled={busy} className="mt-4 rounded-xl border border-red-200 px-4 py-2 text-xs font-black text-red-700 hover:bg-red-50 disabled:opacity-50 cursor-pointer">{t("svc.req.cancel")}</button>
        )}
      </section>

      {request.status === "WAITING" && !request.helper && <p className="px-1 text-[11px] text-slate-500">{t("svc.chat.beforeHelper")}</p>}
      <ServiceChat requestId={request.id} kind="CUSTOMER" canSend={request.status !== "COMPLETED" && request.status !== "CANCELLED"} />

      <details className="px-1 text-[11px] text-slate-500">
        <summary className="cursor-pointer font-bold">{t("svc.req.history")}</summary>
        <ul className="mt-2 space-y-1">{events.map((e, i) => <li key={i}>{new Date(e.at).toLocaleString()} · {t(`svc.status.${e.to}`)}</li>)}</ul>
      </details>
    </div>
  );
}
