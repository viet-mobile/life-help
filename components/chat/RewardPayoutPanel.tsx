"use client";

import { useEffect, useState } from "react";

export function RewardPayoutPanel({ requestId, capability }: { requestId: string; capability: string }) {
  const [reward, setReward] = useState<{ tier?: string; rewards?: Array<{ state: string; reward_amount_krw: number }> } | null>(null);
  const [destination, setDestination] = useState<{ masked_destination?: string; status?: string } | null>(null);
  const [masked, setMasked] = useState("");
  const [token, setToken] = useState("");
  useEffect(() => {
    void fetch(`/api/rewards?requestId=${requestId}&capability=${encodeURIComponent(capability)}`).then((response) => response.json()).then(setReward);
    void fetch(`/api/rewards/payout?requestId=${requestId}&capability=${encodeURIComponent(capability)}`).then((response) => response.json()).then((data) => setDestination(data.destination || null));
  }, [requestId, capability]);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch("/api/rewards/payout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId, capability, country: "KR", currency: "KRW", payoutMethod: "PROVIDER_TOKEN", providerPayeeToken: token, maskedDestination: masked, consent: true }) });
    if (response.ok) setDestination(await response.json().then((data) => data.destination));
  };
  return <section className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><h2 className="font-black text-emerald-950">Referral rewards</h2>{reward && <p className="mt-1 text-sm text-emerald-900">Tier: {reward.tier || "WLH"} · {reward.rewards?.length || 0} reward records</p>}<p className="mt-2 text-xs text-emerald-800">Payout provider is not connected yet. Destinations remain unverified until a provider verifies them.</p>{destination ? <p className="mt-3 text-sm font-bold text-slate-800">Payout destination: {destination.masked_destination} · {destination.status}</p> : <form onSubmit={save} className="mt-3 space-y-2"><input value={masked} onChange={(event) => setMasked(event.target.value)} placeholder="Masked destination, e.g. ****1234" className="w-full rounded border border-emerald-200 px-3 py-2 text-sm" /><input value={token} onChange={(event) => setToken(event.target.value)} placeholder="Provider payee token" className="w-full rounded border border-emerald-200 px-3 py-2 text-sm" /><button className="rounded bg-emerald-700 px-3 py-2 text-xs font-black text-white">Register payout account</button></form>}</section>;
}
