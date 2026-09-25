"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";

export function RewardPayoutPanel({ requestId, capability }: { requestId: string; capability: string }) {
  const { t } = useLocale();
  const [reward, setReward] = useState<{ tier?: string; rewards?: Array<{ state: string; reward_amount_krw: number }> } | null>(null);
  useEffect(() => {
    void fetch("/api/rewards", { cache: "no-store" }).then((response) => response.json()).then(setReward);
  }, [requestId, capability]);
  return <section className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><h2 className="font-black text-emerald-950">{t("common.referralRewards")}</h2>{reward && <p className="mt-1 text-sm text-emerald-900">{reward.tier || "WLH"} · {reward.rewards?.length || 0}</p>}<p className="mt-2 text-xs text-emerald-800">{t("common.payoutNotConnected")}</p></section>;
}
