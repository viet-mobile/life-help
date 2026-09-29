"use client";

import { useCallback, useEffect, useState } from "react";

type CaseRow = {
  caseType: "PAYMENT" | "MONEY_JOB"; caseId: string; kind: string; status: string; reason: string | null; amount: string | null;
  token: string; network: string | null; destinationMasked: string | null; destinationSource: string | null; signatures: string[];
  attemptCount: number | null; lastError: string | null; leaseHeld: boolean; closed: boolean; allowedActions: string[]; createdAt: string; updatedAt: string | null;
};
type PayoutEvidence = {
  jobStatus: string | null; reviewReason: string | null; provider: string | null; network: string | null; businessStatus: string | null; obligationId: string | null;
  attempts: Array<{ attempt: number; state: string; provider: string; network: string; attemptKey: string; destinationMasked: string | null; providerReportedPaidAt: string | null; finalConfirmation: boolean }>;
};
type PaymentEvidence = {
  intentStatus: string | null; network: string | null; mint: string | null; receivingWalletMasked: string | null; reference: string | null; reviewReasons: string[];
  transfers: Array<{ signature: string; classification: string | null; recipientMasked: string | null; recipientMatchesIntent: boolean }>;
};
type Detail = {
  allowedActions: string[]; unresolved: boolean; facts: unknown; systemDecisions: unknown; operatorActions: unknown;
  refundableTransfers?: Array<{ signature: string; classification: string; amount_base_units: string }>;
  payoutEvidence?: PayoutEvidence;
  paymentEvidence?: PaymentEvidence;
};
const MONEY_ACTIONS = ["RETRY_RECONCILIATION", "REQUEUE_SAFE", "INITIATE_REFUND"];
const short = (value: string | null | undefined) => (value ? `${value.slice(0, 6)}…${value.slice(-4)}` : "—");

/**
 * Read-only per-attempt payout evidence (migration 023). "Provider reported payout paid" is the provider's own
 * claim - it is never shown as final: final confirmation is only an attempt in state CONFIRMED.
 */
export function PayoutEvidencePanel({ evidence }: { evidence: PayoutEvidence }) {
  return (
    <div className="space-y-1 rounded border p-2">
      <p className="font-semibold">Payout evidence (read-only)</p>
      <p>Job {evidence.jobStatus ?? "—"} · reason {evidence.reviewReason ?? "—"} · obligation {short(evidence.obligationId)} {evidence.businessStatus ?? "—"} · {evidence.provider ?? "—"} {evidence.network ?? ""}</p>
      {evidence.attempts.map((a) => (
        <div key={a.attempt} className="border-t pt-1">
          <p>Attempt {a.attempt} · {a.state} · {a.network} · key {a.attemptKey ?? "—"}</p>
          <p>Destination: {a.destinationMasked ?? "—"}</p>
          {a.providerReportedPaidAt && (
            <p className="rounded bg-amber-50 p-1" data-testid="provider-reported-paid">
              Provider reported payout paid: {a.providerReportedPaidAt}
              <br />
              <span className="text-slate-600">Reported by the provider only - not final, not beneficiary receipt, not a LIFE.HELP payout confirmation. No new attempt can be created for this job.</span>
            </p>
          )}
          {a.finalConfirmation && <p className="text-emerald-700">Final confirmation recorded for this attempt.</p>}
        </div>
      ))}
    </div>
  );
}

/** Read-only payment evidence: the platform receiving wallet and observed recipients are MASKED server-side. */
export function PaymentEvidencePanel({ evidence }: { evidence: PaymentEvidence }) {
  return (
    <div className="space-y-1 rounded border p-2">
      <p className="font-semibold">Payment evidence (read-only)</p>
      <p>Intent {evidence.intentStatus ?? "—"} · {evidence.network ?? "—"} · asset {short(evidence.mint)} · reason {evidence.reviewReasons.join(", ") || "—"}</p>
      <p>Receiving wallet: {evidence.receivingWalletMasked ?? "—"} · reference {short(evidence.reference)}</p>
      {evidence.transfers.map((t) => (
        <p key={t.signature} className="border-t pt-1">
          {t.classification ?? "—"} · {short(t.signature)} · to {t.recipientMasked ?? "—"} {t.recipientMatchesIntent ? "(our receiving wallet)" : "(NOT our receiving wallet)"}
        </p>
      ))}
    </div>
  );
}

/** Facts / system decisions / operator actions exactly as the (already least-exposure) review API returned them. */
export function CaseDetailSections({ detail }: { detail: Pick<Detail, "facts" | "systemDecisions" | "operatorActions"> }) {
  return (
    <>
      <details open><summary className="font-semibold">Facts (observed on chain)</summary><pre className="whitespace-pre-wrap">{JSON.stringify(detail.facts, null, 1)}</pre></details>
      <details><summary className="font-semibold">System decisions</summary><pre className="whitespace-pre-wrap">{JSON.stringify(detail.systemDecisions, null, 1)}</pre></details>
      <details><summary className="font-semibold">Operator actions</summary><pre className="whitespace-pre-wrap">{JSON.stringify(detail.operatorActions, null, 1)}</pre></details>
    </>
  );
}

/** Minimal operator console: queue, filters, case detail, allowed actions only, confirmation for money actions. */
export function ReviewConsole() {
  const [rows, setRows] = useState<CaseRow[]>([]);
  const [filter, setFilter] = useState({ caseType: "", status: "", reason: "", includeClosed: false });
  const [selected, setSelected] = useState<CaseRow | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [reason, setReason] = useState("");
  const [signature, setSignature] = useState("");
  const [pending, setPending] = useState<{ action: string; key: string; confirmation: Record<string, unknown> } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter.caseType) params.set("caseType", filter.caseType);
    if (filter.status) params.set("status", filter.status);
    if (filter.reason) params.set("reason", filter.reason);
    if (filter.includeClosed) params.set("includeClosed", "1");
    const response = await fetch(`/api/sys/review/cases?${params}`, { cache: "no-store" });
    const data = await response.json().catch(() => null);
    if (!response.ok) { setMessage("Unable to load the review queue."); return; }
    setRows(data.cases ?? []);
  }, [filter]);

  const open = useCallback(async (row: CaseRow) => {
    setSelected(row); setPending(null); setMessage(null); setSignature("");
    const response = await fetch(`/api/sys/review/cases/${row.caseType}/${row.caseId}`, { cache: "no-store" });
    const data = await response.json().catch(() => null);
    setDetail(response.ok ? data.case : null);
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  const act = async (action: string, confirmed?: { key: string }) => {
    if (!selected) return;
    const key = confirmed?.key ?? crypto.randomUUID();
    const response = await fetch(`/api/sys/review/cases/${selected.caseType}/${selected.caseId}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason, idempotencyKey: key, ...(signature ? { signature } : {}), ...(confirmed ? { confirm: true } : {}) }),
    });
    const data = await response.json().catch(() => null);
    if (response.status === 428) { setPending({ action, key, confirmation: data?.confirmation ?? {} }); return; }
    setPending(null);
    setMessage(response.ok ? `${action}: done${data?.replayed ? " (already applied)" : ""}` : `${action}: ${data?.code ?? "rejected"}`);
    await load();
    await open(selected);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-4">
        <h1 className="text-2xl font-black">Financial review queue</h1>
        <div className="flex flex-wrap gap-2 text-sm">
          <select aria-label="case type" className="rounded border px-2 py-1" value={filter.caseType} onChange={(e) => setFilter({ ...filter, caseType: e.target.value })}>
            <option value="">All cases</option>
            <option value="PAYMENT">Payments</option>
            <option value="MONEY_JOB">Money jobs</option>
          </select>
          <input aria-label="status" className="rounded border px-2 py-1" placeholder="status" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} />
          <input aria-label="reason filter" className="rounded border px-2 py-1" placeholder="reason" value={filter.reason} onChange={(e) => setFilter({ ...filter, reason: e.target.value })} />
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={filter.includeClosed} onChange={(e) => setFilter({ ...filter, includeClosed: e.target.checked })} />
            closed
          </label>
        </div>
        {message && <p className="rounded bg-amber-50 p-2 text-sm">{message}</p>}
        <div className="grid gap-4 lg:grid-cols-2">
          <table className="w-full text-left text-xs">
            <thead><tr><th>Case</th><th>Status</th><th>Reason</th><th>Amount</th><th>Lease</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.caseType}:${row.caseId}`} className="cursor-pointer border-t hover:bg-white" onClick={() => void open(row)}>
                  <td>{row.kind}<br /><span className="text-slate-500">{short(row.caseId)}</span></td>
                  <td>{row.status}{row.closed ? " · closed" : ""}</td>
                  <td>{row.reason ?? "—"}</td>
                  <td>{row.amount ?? "—"} {row.token} {row.network ?? ""}</td>
                  <td>{row.leaseHeld ? "held" : "free"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {selected && detail && (
            <section className="space-y-3 rounded border bg-white p-3 text-xs">
              <h2 className="font-bold">{selected.kind} · {short(selected.caseId)}</h2>
              {detail.payoutEvidence && <PayoutEvidencePanel evidence={detail.payoutEvidence} />}
              {detail.paymentEvidence && <PaymentEvidencePanel evidence={detail.paymentEvidence} />}
              <CaseDetailSections detail={detail} />
              <p className="font-semibold">{detail.unresolved ? "UNRESOLVED" : "Resolved / closed"}</p>
              {detail.refundableTransfers && detail.refundableTransfers.length > 0 && (
                <select aria-label="source transfer" className="w-full rounded border px-2 py-1" value={signature} onChange={(e) => setSignature(e.target.value)}>
                  <option value="">Source transfer for a refund…</option>
                  {detail.refundableTransfers.map((t) => (
                    <option key={t.signature} value={t.signature}>{t.classification} · {(Number(t.amount_base_units) / 1e6).toFixed(6)} USDC · {short(t.signature)}</option>
                  ))}
                </select>
              )}
              <textarea aria-label="reason" className="w-full rounded border p-2" placeholder="Reason / note (required)" value={reason} onChange={(e) => setReason(e.target.value)} />
              <div className="flex flex-wrap gap-2">
                {detail.allowedActions.map((action) => (
                  <button key={action} type="button" disabled={!reason.trim() || (action === "INITIATE_REFUND" && !signature)} className="rounded bg-slate-900 px-3 py-1 font-semibold text-white disabled:opacity-40" onClick={() => void act(action)}>{action}</button>
                ))}
              </div>
              {pending && (
                <div className="space-y-2 rounded border-2 border-red-600 p-2">
                  <p className="font-bold">Confirm {pending.action}: this may move money.</p>
                  <pre className="whitespace-pre-wrap">{JSON.stringify(pending.confirmation, null, 1)}</pre>
                  <div className="flex gap-2">
                    <button type="button" className="rounded bg-red-700 px-3 py-1 font-semibold text-white" onClick={() => void act(pending.action, { key: pending.key })}>Confirm</button>
                    <button type="button" className="rounded border px-3 py-1" onClick={() => setPending(null)}>Cancel</button>
                  </div>
                </div>
              )}
              {MONEY_ACTIONS.some((a) => detail.allowedActions.includes(a)) && <p className="text-slate-500">Money actions always ask for a second confirmation. Refund destinations are derived from the chain, never typed.</p>}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
