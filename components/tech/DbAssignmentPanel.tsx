"use client";

import { useCallback, useEffect, useState } from "react";

type Assignment = {
  assignmentId: string;
  requestId: string;
  assignmentStatus: string;
  requestStatus: string;
  serviceSlug: string;
  country: string;
  sido: string;
  gungu: string;
  description: string;
  selectedOptions: string[];
  customerLocale: string;
  assignedAt: string;
  createdAt: string;
};

export function DbAssignmentPanel({ formatBilingual }: { formatBilingual: (en: string, ko: string) => string }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [available, setAvailable] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/helper/assignments", { cache: "no-store" });
    if (!response.ok) {
      setAvailable(false);
      return;
    }
    const data = await response.json();
    setAvailable(true);
    setAssignments(Array.isArray(data.assignments) ? data.assignments : []);
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(timer);
    };
  }, [refresh]);

  const respond = async (assignmentId: string, action: "accept" | "decline") => {
    setBusyId(assignmentId);
    setMessage(null);
    try {
      const response = await fetch(`/api/helper/assignments/${assignmentId}/${action}`, { method: "POST" });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.success === false) {
        setMessage(formatBilingual("The assignment could not be updated.", "배정 상태를 변경하지 못했습니다."));
      } else {
        setMessage(action === "accept" ? formatBilingual("Assignment accepted.", "배정을 수락했습니다.") : formatBilingual("Assignment declined.", "배정을 거절했습니다."));
        await refresh();
      }
    } finally {
      setBusyId(null);
    }
  };

  if (!available) return null;

  return (
    <section className="mt-6 droplet-card border border-emerald-200 bg-emerald-50/80 p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-emerald-950">{formatBilingual("Assigned service requests", "DB 배정 요청")}</h2>
          <p className="mt-1 text-xs font-semibold text-emerald-800">{formatBilingual("Only assignments linked to your authenticated account are shown.", "인증된 계정에 연결된 배정만 표시됩니다.")}</p>
        </div>
        <span className="droplet-pill bg-white px-2.5 py-1 text-xs font-black text-emerald-800">{assignments.length}</span>
      </div>
      {message && <p className="mt-3 text-xs font-bold text-emerald-900">{message}</p>}
      <div className="mt-4 space-y-3">
        {assignments.length === 0 ? (
          <p className="text-xs font-semibold text-slate-600">{formatBilingual("No assigned requests.", "현재 배정된 요청이 없습니다.")}</p>
        ) : assignments.map((assignment) => (
          <article key={assignment.assignmentId} className="droplet-card border border-emerald-200 bg-white p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-black text-slate-900">{assignment.serviceSlug}</h3>
              <span className="text-[11px] font-bold text-slate-500">{assignment.assignmentStatus} · {assignment.requestStatus}</span>
            </div>
            <p className="mt-1 text-xs font-bold text-slate-700">{assignment.sido} {assignment.gungu} · {new Date(assignment.createdAt).toLocaleString()}</p>
            <p className="mt-2 whitespace-pre-line break-words text-sm font-medium text-slate-800">{assignment.description}</p>
            {assignment.selectedOptions.length > 0 && <p className="mt-2 text-xs font-semibold text-slate-600">{assignment.selectedOptions.join(" · ")}</p>}
            {(assignment.assignmentStatus === "PENDING" || assignment.assignmentStatus === "NOTIFIED") && (
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={busyId === assignment.assignmentId} onClick={() => void respond(assignment.assignmentId, "accept")} className="droplet-btn bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50">{formatBilingual("Accept", "수락")}</button>
                <button type="button" disabled={busyId === assignment.assignmentId} onClick={() => void respond(assignment.assignmentId, "decline")} className="droplet-btn border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-50">{formatBilingual("Decline", "거절")}</button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
