"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { learnConfig } from "@/lib/learn/config";
import { meaningLang } from "@/lib/learn/listen/segments";
import { filterWords, loadWords, removeWord, saveWords, shuffled, stepIndex, type SavedWord, type WordFilter } from "@/lib/learn/listen/vocab";
import { useListenPlayer } from "./Listening";
import { useSite } from "./LearnerProvider";

/**
 * Words: the learner's saved vocabulary as flashcards. Front: the English word or phrase. Back: the canonical meaning from the lesson (when the
 * lesson has one; otherwise a plain note, never an invented translation), plus the lesson's English example when it has one. No spaced repetition in
 * this release. English pronunciation is browser-native speech; Korean/meaning audio only when the learner presses its button.
 */
export function Flashcards() {
  const { t, site, href, locale } = useSite();
  const { player, state, available, mounted } = useListenPlayer();
  const [all, setAll] = useState<SavedWord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<WordFilter>({ kind: "all" });
  const [seed, setSeed] = useState<number | null>(null);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => { // eslint-disable-next-line react-hooks/set-state-in-effect
    setAll(loadWords(window.localStorage, learnConfig.guestStorageKey, site, "device")); setLoaded(true); }, [site]);

  const lessons = useMemo(() => [...new Map(all.map((w) => [w.lessonId, w.lessonTitle ?? w.lessonId])).entries()], [all]);
  const deck = useMemo(() => { const d = filterWords(all, filter); return seed === null ? d : shuffled(d, seed); }, [all, filter, seed]);
  const idx = deck.length ? Math.min(i, deck.length - 1) : 0;
  const card = deck[idx];

  if (!loaded || !mounted) return <div className="l-wrap" aria-busy="true" />;

  const speak = (text: string, lang: "en-US" | "ko-KR" | "vi-VN") =>
    player?.play([{ segmentId: "card", segmentIndex: 0, lang, text }], 1);
  const move = (dir: 1 | -1) => { player?.stop(); setFlipped(false); setI(stepIndex(idx, dir, deck.length)); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); }
  };
  const remove = (id: string) => {
    const next = removeWord(all, id);
    setAll(next);
    saveWords(window.localStorage, learnConfig.guestStorageKey, site, "device", next);
    setFlipped(false);
  };

  return (
    <div className="l-wrap l-stack" data-testid="flashcards" onKeyDown={onKey}>
      <Link className="l-link" href={href("/dashboard")}>← {t("lesson.exit")}</Link>
      <h1 className="l-h1">📇 {t("words.title")}</h1>
      <p className="l-muted" aria-live="polite">{t("words.saved.n", { n: all.length })}</p>

      {all.length === 0 ? (
        <div className="l-card l-stack"><p>{t("words.empty")}</p></div>
      ) : (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <label>{t("words.filter")}{" "}
              <select style={{ minHeight: 44 }} data-testid="words-filter" aria-label={t("words.filter")} value={filter.kind === "all" ? "all" : filter.lessonId}
                onChange={(e) => { setFilter(e.target.value === "all" ? { kind: "all" } : { kind: "lesson", lessonId: e.target.value }); setI(0); setFlipped(false); }}>
                <option value="all">{t("words.filter.all")}</option>
                {lessons.map(([id, title]) => <option key={id} value={id}>{t("words.filter.lesson")}: {title}</option>)}
              </select>
            </label>
            <button type="button" className="l-chip" aria-pressed={seed !== null} onClick={() => { setSeed(seed === null ? Date.now() : null); setI(0); setFlipped(false); }}>🔀 {t("words.shuffle")}</button>
          </div>

          {card && (
            <section className="l-card l-stack" aria-label={`${t("words.card", { i: idx + 1, n: deck.length })}`} data-testid="flashcard" style={{ textAlign: "center", minHeight: 200 }}>
              <p className="l-muted" aria-live="polite">{t("words.card", { i: idx + 1, n: deck.length })} · {flipped ? t("words.back") : t("words.front")}</p>
              <button type="button" className="l-btn l-btn-ghost" data-testid="flashcard-flip" aria-pressed={flipped} aria-label={t("words.flip")} onClick={() => setFlipped((f) => !f)}
                style={{ fontSize: "1.6rem", fontWeight: 800, padding: "1rem", whiteSpace: "normal", overflowWrap: "anywhere" }}>
                {flipped
                  ? <span data-testid="flashcard-back">{card.ko ?? <span className="l-muted" style={{ fontSize: "1rem", fontWeight: 600 }}>{t("words.noMeaning")}</span>}</span>
                  : <span lang="en" data-testid="flashcard-front">{card.en}</span>}
              </button>
              {flipped && card.exampleEn && <p lang="en" data-testid="flashcard-example"><span className="l-muted">{t("words.example")}: </span>{card.exampleEn}</p>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {available
                  ? <>
                      <button type="button" className="l-btn" data-testid="flashcard-listen" aria-label={`${t("words.pronounce")}: ${card.en}`} onClick={() => speak(card.en, "en-US")}>🔊 {t("words.pronounce")}</button>
                      {card.exampleEn && <button type="button" className="l-chip" data-testid="flashcard-listen-example" aria-label={`${t("words.pronounce.example")}: ${card.exampleEn}`} onClick={() => speak(card.exampleEn!, "en-US")}>🔊 {t("words.pronounce.example")}</button>}
                      {flipped && card.ko && meaningLang(card.ko, locale) && <button type="button" className="l-chip" data-testid="flashcard-listen-meaning" aria-label={`${t("words.pronounce.meaning")}: ${card.ko}`} onClick={() => speak(card.ko!, meaningLang(card.ko!, locale)!)}>🔊 {t("words.pronounce.meaning")}</button>}
                      {state.status !== "idle" && <button type="button" className="l-chip" onClick={() => player?.stop()}>⏹ {t("listen.stop")}</button>}
                    </>
                  : <p className="l-muted" role="note">{t("listen.unavailable")}</p>}
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                <button type="button" className="l-btn l-btn-ghost" data-testid="flashcard-prev" onClick={() => move(-1)}>← {t("words.prev")}</button>
                <button type="button" className="l-btn l-btn-ghost" data-testid="flashcard-next" onClick={() => move(1)}>{t("words.next")} →</button>
              </div>
              <button type="button" className="l-link" data-testid="flashcard-remove" onClick={() => remove(card.id)}>{t("words.remove")}</button>
            </section>
          )}
        </>
      )}
    </div>
  );
}
