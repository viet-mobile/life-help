"use client";

import { useEffect, useState } from "react";
import { useLearner } from "./LearnerProvider";
import { pronTipFor } from "@/lib/learn/pron";

const KEY = "learn.pron.v1";
const MAX_SHOWS = 3; // each rule at most this many times on this device: a tip is a nudge, not a lecture
type Store = { off?: boolean; shown?: Record<string, number> };
const read = (): Store => { try { return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Store; } catch { return {}; } };
const write = (s: Store) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* blocked storage: tips simply show */ } };

/** Shown only after a wrong answer on a short Korean text that contains a rule of the Standard Pronunciation Rules. */
export function PronTip({ text }: { text?: string | null }) {
  const { t, site } = useLearner();
  const tip = site === "korean" ? pronTipFor(text) : null;
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!tip) { setVisible(false); return; }
    const s = read();
    if (s.off || (s.shown?.[tip.rule] ?? 0) >= MAX_SHOWS) { setVisible(false); return; }
    write({ ...s, shown: { ...s.shown, [tip.rule]: (s.shown?.[tip.rule] ?? 0) + 1 } });
    setVisible(true);
  }, [tip?.rule, text]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!tip || !visible) return null;
  return (
    <div className="l-panel l-panel-hint" role="note">
      <div className="l-panel-title">🔊 {t("pron.heading")}</div>
      <p>{t(`pron.${tip.rule}`, { ex: tip.ex })}</p>
      <p className="l-muted">{t("pron.source", { art: tip.art })} {t("pron.note")}</p>
      <button className="l-btn l-btn-ghost" onClick={() => { write({ ...read(), off: true }); setVisible(false); }}>{t("pron.hide")}</button>
    </div>
  );
}
