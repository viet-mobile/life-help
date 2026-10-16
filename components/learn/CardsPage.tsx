"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, useLearner } from "./LearnerProvider";
import { ListenButton } from "./renderers";

type Card = { id: string; front: string; audioText?: string };
const BOX_KEY = (site: string) => `learn.cards.${site}`;
/** Device-only self-rating: a card marked "knew it" moves to a higher box and is shown later next time. Never sent anywhere. */
const readBoxes = (site: string): Record<string, number> => { try { return JSON.parse(localStorage.getItem(BOX_KEY(site)) ?? "{}") as Record<string, number>; } catch { return {}; } };
const writeBoxes = (site: string, b: Record<string, number>) => { try { localStorage.setItem(BOX_KEY(site), JSON.stringify(b)); } catch { /* storage blocked: cards still work */ } };

/**
 * Flashcards. The server sends only the fronts; the back is fetched when the learner asks for it. Cards give no XP, coins or mastery and
 * do not touch the review schedule — the learner's own "knew it / again" rating stays in this browser.
 */
export function CardsPage() {
  const { api, t, href, site } = useLearner();
  const [queue, setQueue] = useState<Card[] | null>(null);
  const [back, setBack] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [known, setKnown] = useState(0);
  const [again, setAgain] = useState(0);

  useEffect(() => {
    let live = true;
    api<{ cards: Card[] }>("cards", { count: 12 }).then((r) => {
      if (!live) return;
      const boxes = readBoxes(site);
      setQueue([...r.cards].sort((a, b) => (boxes[a.id] ?? 0) - (boxes[b.id] ?? 0)));
    }).catch((e) => { if (!live) return; if (e instanceof ApiError && e.code === "no_questions") setQueue([]); else setError(true); });
    return () => { live = false; };
  }, [api, site]);

  const card = queue?.[0];
  const reveal = useCallback(async () => {
    if (!card) return;
    try { setBack((await api<{ back: string }>("reveal", { questionId: card.id })).back); } catch { setError(true); }
  }, [api, card]);
  const rate = useCallback((knew: boolean) => {
    if (!card || back === null) return;
    const boxes = readBoxes(site);
    boxes[card.id] = knew ? Math.min(5, (boxes[card.id] ?? 0) + 1) : 0;
    writeBoxes(site, boxes);
    if (knew) setKnown((n) => n + 1); else setAgain((n) => n + 1);
    setQueue((q) => (q ? (knew ? q.slice(1) : [...q.slice(1), q[0]]) : q));
    setBack(null);
  }, [card, back, site]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (back === null && (e.key === " " || e.key === "Enter")) { e.preventDefault(); void reveal(); }
      else if (back !== null && e.key === "1") rate(false);
      else if (back !== null && e.key === "2") rate(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [back, reveal, rate]);

  return (
    <div className="l-stack">
      <h1 className="l-h1">{t("modes.cards")}</h1>
      <p className="l-muted">{t("cards.local")}</p>
      {error && <p role="alert">{t("lesson.error")}</p>}
      {queue === null && !error && <p>…</p>}
      {queue && queue.length === 0 && known + again === 0 && (
        <section className="l-card l-stack">
          <p>{t("lesson.empty")}</p>
          <Link className="l-btn" href={href("/learn")}>{t("nav.learn")}</Link>
        </section>
      )}
      {queue && queue.length === 0 && known + again > 0 && (
        <section className="l-card l-stack">
          <p>{t("cards.done", { known, again })}</p>
          <Link className="l-btn" href={href("/modes")}>{t("modes.title")}</Link>
        </section>
      )}
      {card && (
        <section className="l-card l-stack" aria-live="polite">
          <p className="l-muted">{t("cards.left", { n: queue!.length })}</p>
          <p style={{ fontSize: "2rem", fontWeight: 700 }} lang={site === "korean" ? "ko" : "en"}>{card.front}</p>
          {card.audioText && <ListenButton text={card.audioText} />}
          {back === null ? (
            <button className="l-btn l-btn-block" onClick={() => void reveal()}>{t("cards.reveal")}</button>
          ) : (
            <>
              <p style={{ fontSize: "1.25rem" }}>{back}</p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="l-btn l-btn-ghost" onClick={() => rate(false)}>{t("cards.again")} (1)</button>
                <button className="l-btn" onClick={() => rate(true)}>{t("cards.knew")} (2)</button>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
