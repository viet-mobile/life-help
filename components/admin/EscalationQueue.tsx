"use client";

import { useEffect, useState } from "react";

export function EscalationQueue() {
  const [rows, setRows] = useState<Array<{ id: string; status: string; escalated_at: string; service_requests?: { service_slug: string; sido: string; gungu: string; description: string; status: string } | null }>>([]);
  const [error, setError] = useState<string | null>(null);
  const load = async () => {
    const response = await fetch("/api/sys/requests", { cache: "no-store" });
    const data = await response.json().catch(() => null);
    if (!response.ok) { setError("Unable to load escalation queue."); return; }
    setRows(data.escalations ?? []);
  };
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 5000); return () => window.clearInterval(timer); }, []);
  return <main className="min-h-screen bg-slate-50 p-6"><div className="mx-auto max-w-4xl"><h1 className="text-2xl font-black text-slate-900">NO_HELPER_AVAILABLE queue</h1>{error && <p className="mt-4 font-bold text-red-700">{error}</p>}<div className="mt-5 space-y-3">{rows.map((row) => <article key={row.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex justify-between gap-3"><strong>{row.service_requests?.service_slug}</strong><span className="text-xs font-bold text-slate-500">{row.status}</span></div><p className="mt-1 text-sm text-slate-600">{row.service_requests?.sido} {row.service_requests?.gungu} · {row.service_requests?.status}</p><p className="mt-2 text-sm text-slate-900">{row.service_requests?.description}</p></article>)}{rows.length===0&&<p className="text-sm text-slate-600">No open escalations.</p>}</div></div></main>;
}
