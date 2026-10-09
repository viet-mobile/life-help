"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { customerApi } from "@/lib/service/client";
import type { SvcRequest } from "@/lib/service/clientTypes";
import { usePoll } from "@/lib/service/usePoll";
import { getService } from "@/lib/services";
import { StatusBadge } from "./RequestStatus";

/** The requests this browser's credential owns, from the server. (Requests opened with a link on another device are not in this list.) */
export function MyRequests() {
  const { t } = useLocale();
  const [list, setList] = useState<SvcRequest[] | null>(null);
  usePoll(async () => setList(await customerApi.list()), 5000, true, () => setList((cur) => cur ?? []));
  if (list === null) return <p className="p-6 text-center text-sm text-slate-500" role="status">{t("svc.req.loading")}</p>;
  return (
    <div className="space-y-3" data-testid="my-requests">
      <h1 className="text-lg font-black text-slate-900">{t("svc.req.mine")}</h1>
      {list.length === 0 && <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-600 border border-slate-200">{t("svc.req.none")}</p>}
      {list.map((r) => {
        const s = getService(r.serviceSlug);
        return (
          <Link key={r.id} href={`/chat?r=${r.id}`} data-testid="my-request" className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 hover:border-blue-400">
            <span className="min-w-0"><span className="block truncate text-sm font-black text-slate-900">{s ? t(`service.${s.key}`) : r.serviceSlug}</span><span className="block truncate text-[11px] text-slate-500">{r.sido} {r.gungu} · {new Date(r.createdAt).toLocaleString()}</span></span>
            <StatusBadge status={r.status} />
          </Link>
        );
      })}
      <Link href="/request" className="block rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-black text-white">{t("svc.req.newRequest")}</Link>
    </div>
  );
}
