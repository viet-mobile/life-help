"use client";

import { useLocale } from "@/lib/i18n/LocaleContext";
import type { RequestStatus as Status } from "@/lib/service/clientTypes";

const STYLE: Record<Status, string> = {
  WAITING: "bg-amber-100 text-amber-900 border-amber-300",
  ASSIGNED: "bg-blue-100 text-blue-900 border-blue-300",
  IN_PROGRESS: "bg-indigo-100 text-indigo-900 border-indigo-300",
  COMPLETED: "bg-emerald-100 text-emerald-900 border-emerald-300",
  CANCELLED: "bg-slate-200 text-slate-700 border-slate-300",
};
const STEPS: Status[] = ["WAITING", "ASSIGNED", "IN_PROGRESS", "COMPLETED"];

export function StatusBadge({ status }: { status: Status }) {
  const { t } = useLocale();
  return (
    <span data-testid="request-status" data-status={status} className={`inline-block rounded-full border px-3 py-1 text-xs font-black ${STYLE[status]}`}>
      {t(`svc.status.${status}`)}
    </span>
  );
}

/** WAITING -> ASSIGNED -> IN_PROGRESS -> COMPLETED, with the reached steps filled in. */
export function StatusSteps({ status }: { status: Status }) {
  const { t } = useLocale();
  if (status === "CANCELLED") return null;
  const at = STEPS.indexOf(status);
  return (
    <ol className="mt-3 grid grid-cols-4 gap-1 text-center text-[10px] font-bold" aria-label={t("svc.status.steps")}>
      {STEPS.map((s, i) => (
        <li key={s} className={`rounded-lg px-1 py-1.5 ${i <= at ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"}`}>{t(`svc.status.${s}`)}</li>
      ))}
    </ol>
  );
}
