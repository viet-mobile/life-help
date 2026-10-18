"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FILE_META, TASK_LOADERS } from "@/lib/think/data/assets-index";
import { thinkLangFor } from "@/lib/think/lang";
import { loadOverlay, localize } from "@/lib/think/localize";
import {
  OFFER_EVERY, chooseLater, chooseNow, chooseTask, flowKey, noTaskAvailable, parseLedger, recordCompleted, startOffer, type Candidate, type FlowLedger,
} from "@/lib/think/flow";
import { schoolLevel, type Grade } from "@/lib/learn/types";
import { siteConfig } from "@/lib/learn/sites";
import type { ThinkTask } from "@/lib/think/types";
import { useLearner } from "../learn/LearnerProvider";
import { FLOW } from "./flowLabels";
import { labels } from "./labels";

export const COMPLETE_EVENT = "learn:q-complete";
export const triedKey = (site: string) => `learn:think:${site}`;

const bandOf = (g: string): 1 | 2 | 3 => (g.startsWith("K") ? (Number(g.slice(1)) <= 4 ? 1 : Number(g.slice(1)) <= 7 ? 2 : 3) : schoolLevel(g as Grade) === "elementary" ? 1 : /^M/.test(g) ? 2 : 3);
const NO_COUNT_PATHS = ["/diagnostic", "/onboarding"];

export function readLedger(site: string): FlowLedger {
  try { return parseLedger(window.localStorage.getItem(flowKey(site))); } catch { return parseLedger(null); }
}
function writeLedger(site: string, l: FlowLedger) {
  try { window.localStorage.setItem(flowKey(site), JSON.stringify(l)); } catch { /* storage unavailable: the count lives for this visit only */ }
}
export function readTried(site: string): Set<string> {
  try { return new Set(Object.keys(JSON.parse(window.localStorage.getItem(triedKey(site)) ?? "{}"))); } catch { return new Set(); }
}

/** The tasks of the learner's own grade / level that are ready in the learner's language (never an untranslated original). */
async function readyTasks(site: "math" | "english" | "korean", grade: string, locale: string) {
  const lang = thinkLangFor(locale, site);
  const metas = FILE_META.filter((m) => m.subject === site && (m.grades.includes(grade) || m.grades.length === 0));
  const lists = await Promise.all(metas.map((m) => TASK_LOADERS[m.key]()));
  const own = lists.flat().filter((t: ThinkTask) => (t.grade ? t.grade === grade : t.level === bandOf(grade)));
  const overlay = await loadOverlay(lang, metas.map((m) => m.key));
  return own.map((t) => localize(t, lang, overlay)).filter((x) => x.translated || x.task.uiLang === lang);
}

/**
 * Listens for solved / revealed regular questions (QuestionCard), counts them in the device ledger and, after OFFER_EVERY, offers one
 * thinking challenge as a small non-blocking card: "try now" opens it, "later" keeps it owed. Mounted once in the play shell.
 */
export function ThinkOffer() {
  const { site, state, locale, href, ready } = useLearner();
  const router = useRouter();
  const pathname = usePathname();
  const grade = (state.profile?.grade ?? siteConfig(site).levels[0]) as string;
  const lang = thinkLangFor(locale, site);
  const L = FLOW[lang];
  const [offer, setOffer] = useState<{ id: string; title: string; minutes: number } | null>(null);
  const busy = useRef(false);
  const ctx = useRef({ site, grade, locale, pathname });
  ctx.current = { site, grade, locale, pathname };

  const show = useCallback(async (taskId: string) => {
    try {
      const ready = await readyTasks(ctx.current.site, ctx.current.grade, ctx.current.locale);
      const hit = ready.find((x) => x.task.id === taskId);
      if (hit) setOffer({ id: hit.task.id, title: hit.task.title, minutes: hit.task.minutes });
      else writeLedger(ctx.current.site, { ...readLedger(ctx.current.site), pending: null }); // no longer ready (language or grade changed): drop the offer
    } catch { /* task files unavailable: no offer, regular learning continues */ }
  }, []);

  const onComplete = useCallback(async (questionId: string) => {
    const cur = ctx.current;
    if (NO_COUNT_PATHS.some((p) => cur.pathname.includes(p))) return;
    const { ledger, reached } = recordCompleted(readLedger(cur.site), questionId);
    writeLedger(cur.site, ledger);
    if (!reached || busy.current) return;
    busy.current = true;
    try {
      const cands = (await readyTasks(cur.site, cur.grade, cur.locale)).map<Candidate>((x) => ({ id: x.task.id, topic: x.task.topic, status: x.task.status }));
      const fresh = readLedger(cur.site);
      const id = chooseTask(cands, fresh, readTried(cur.site));
      if (!id) { writeLedger(cur.site, noTaskAvailable(fresh)); return; }
      writeLedger(cur.site, startOffer(fresh, id));
      await show(id);
    } catch { /* offline or files missing: keep learning, the count is kept */ } finally { busy.current = false; }
  }, [show]);

  useEffect(() => {
    const h = (e: Event) => { const d = (e as CustomEvent<{ site?: string; questionId?: string }>).detail; if (d?.site === ctx.current.site && d.questionId) void onComplete(d.questionId); };
    window.addEventListener(COMPLETE_EVENT, h);
    return () => window.removeEventListener(COMPLETE_EVENT, h);
  }, [onComplete]);

  // an offer that was open when the page was reloaded or the learner came back
  useEffect(() => {
    if (!ready) return;
    const l = readLedger(site);
    if (l.pending && !NO_COUNT_PATHS.some((p) => pathname.includes(p))) void show(l.pending);
    else setOffer(null);
  }, [ready, site, show]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!offer) return null;
  const decide = (now: boolean) => {
    const l = readLedger(site);
    writeLedger(site, now ? chooseNow(l) : chooseLater(l));
    setOffer(null);
    if (now) router.push(href(`/think?task=${encodeURIComponent(offer.id)}&from=flow`));
  };
  return (
    <aside className="l-card l-stack" role="region" aria-label={L.title(OFFER_EVERY)} data-testid="think-offer"
      style={{ position: "fixed", left: 12, right: 12, bottom: 12, zIndex: 40, maxWidth: 560, margin: "0 auto", boxShadow: "0 6px 24px rgba(0,0,0,.25)" }}>
      <strong>🧠 {L.title(OFFER_EVERY)}</strong>
      <span>{L.body}</span>
      <span className="l-muted">{offer.title} · ≈{offer.minutes}{labels(lang).minutes}</span>
      <span className="l-muted" style={{ fontSize: "0.85rem" }}>{L.counting}</span>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="l-btn" data-testid="think-offer-now" onClick={() => decide(true)}>{L.now}</button>
        <button type="button" className="l-btn l-btn-ghost" data-testid="think-offer-later" onClick={() => decide(false)}>{L.later}</button>
      </div>
      <span className="l-muted" style={{ fontSize: "0.85rem" }}>{L.laterNote}</span>
    </aside>
  );
}
