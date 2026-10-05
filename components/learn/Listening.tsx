"use client";

import { useEffect, useMemo, useState } from "react";
import { learnConfig } from "@/lib/learn/config";
import { buildQueue, hasMeaning, MAX_REPEAT, parseCustomRepeat, REPEAT_CHOICES, SPEEDS, type ListenMode, type Speed } from "@/lib/learn/listen/queue";
import { meaningLang, type ListenSegment } from "@/lib/learn/listen/segments";
import { getListenPlayer, type PlayerState } from "@/lib/learn/listen/speech";
import { addWord, hasWord, loadWords, removeWord, saveWords, wordId, type SavedWord } from "@/lib/learn/listen/vocab";
import { useSite } from "./LearnerProvider";

/**
 * Browser-native listening (Speech Synthesis). Client-only: nothing touches `window` on the server or during hydration; when the browser has no
 * speech the controls are replaced by one short note and the lesson works exactly as before. One shared player per page: starting anything
 * cancels whatever was speaking, and leaving the page / unmounting stops the speech.
 */
export function useListenPlayer() {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<PlayerState>({ status: "idle", segmentId: null, segmentIndex: null, error: false });
  const player = useMemo(() => (typeof window === "undefined" ? null : getListenPlayer()), []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!player) return;
    const off = player.subscribe(setState);
    const stop = () => player.stop();
    window.addEventListener("pagehide", stop);
    window.addEventListener("beforeunload", stop);
    return () => { off(); window.removeEventListener("pagehide", stop); window.removeEventListener("beforeunload", stop); player.stop(); };
  }, [player]);
  return { player, state, available: mounted && !!player && player.isAvailable(), mounted };
}

const RATE_KEY = `${learnConfig.guestStorageKey}:listen:rate`;
function useSpeed(): [Speed, (s: Speed) => void] {
  const [speed, setSpeed] = useState<Speed>(1);
  useEffect(() => {
    try { const v = Number(window.localStorage.getItem(RATE_KEY)); // eslint-disable-next-line react-hooks/set-state-in-effect
      if ((SPEEDS as readonly number[]).includes(v)) setSpeed(v as Speed); } catch { /* preference only */ }
  }, []);
  return [speed, (s) => { setSpeed(s); try { window.localStorage.setItem(RATE_KEY, String(s)); } catch { /* preference only */ } }];
}

/** how many words make a "word or phrase"; longer sentences are listen-only */
const MAX_WORDS_TO_SAVE = 6;
const wordCount = (s: string) => s.trim().split(/\s+/).length;

interface PanelProps {
  scope: string;
  segments: ListenSegment[];
  /** "list": every segment on its own row (lesson examples); "chips": numbered sentence buttons under a question's passage */
  variant: "list" | "chips";
  /** lets the learner save words/phrases of this lesson into the Words list */
  lesson?: { id: string; title: string };
}

export function ListeningPanel({ scope, segments, variant, lesson }: PanelProps) {
  const { t, locale, site } = useSite();
  const { player, state, available, mounted } = useListenPlayer();
  const [mode, setMode] = useState<ListenMode>("en");
  const [speed, setSpeed] = useSpeed();
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(Math.max(0, segments.length - 1));
  const [count, setCount] = useState<string>("1");
  const [custom, setCustom] = useState("");
  const bilingual = hasMeaning(segments);
  const [words, setWords] = useState<SavedWord[]>([]);

  useEffect(() => { // eslint-disable-next-line react-hooks/set-state-in-effect
    if (lesson && site === "english") setWords(loadWords(window.localStorage, learnConfig.guestStorageKey, site, "device")); }, [lesson, site]);
  useEffect(() => { setTo((v) => Math.min(v, Math.max(0, segments.length - 1))); }, [segments.length]);

  const effectiveMode: ListenMode = bilingual ? mode : "en";
  const repeat = count === "custom" ? (parseCustomRepeat(custom) ?? 0) : Number(count);
  const customInvalid = count === "custom" && parseCustomRepeat(custom) === null;
  const ml = (ko: string) => meaningLang(ko, locale);
  const play = (opts: { from?: number; to?: number; repeat?: number; mode?: ListenMode }) => player?.play(buildQueue(segments, { mode: opts.mode ?? effectiveMode, from: opts.from, to: opts.to, repeat: opts.repeat ?? 1, meaningLang: ml }), speed);

  if (!segments.length) return null;
  if (!mounted) return <div className="l-muted" aria-hidden="true" style={{ minHeight: 24 }} />;
  if (!available) return <p className="l-muted" role="note">{t("listen.unavailable")}</p>;

  const playing = state.status !== "idle";
  const savable = (s: ListenSegment) => !!lesson && site === "english" && wordCount(s.en) <= MAX_WORDS_TO_SAVE;
  const toggleSave = (s: ListenSegment) => {
    if (!lesson) return;
    const id = wordId(s.en);
    const next = words.some((w) => w.id === id) ? removeWord(words, id)
      : addWord(words, { en: s.en, ko: s.ko, exampleEn: segments.find((o) => o.id !== s.id && wordCount(o.en) >= 4 && o.en.toLowerCase().includes(s.en.toLowerCase()))?.en, lessonId: lesson.id, lessonTitle: lesson.title }).list;
    setWords(next);
    saveWords(window.localStorage, learnConfig.guestStorageKey, site, "device", next);
  };

  const sentenceButton = (s: ListenSegment, i: number) => (
    <button key={s.id} type="button" className="l-chip" aria-label={t("listen.sentence", { n: i + 1 })} aria-current={state.segmentId === s.id ? "true" : undefined}
      onClick={() => play({ from: i, to: i, mode: "en" })} style={state.segmentId === s.id ? { outline: "3px solid var(--l-accent)", fontWeight: 800 } : undefined}>
      🔊 {i + 1}
    </button>
  );

  return (
    <div className="l-stack" data-testid="listening-panel" role="group" aria-label={t("listen.title")}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <button type="button" className="l-btn" data-testid="listen-full" onClick={() => play({})}>🔊 {t((variant === "chips" ? "listen.passage" : "listen.full"))}</button>
        {playing && <button type="button" className="l-btn l-btn-ghost" data-testid="listen-stop" onClick={() => player?.stop()}>⏹ {t("listen.stop")}</button>}
        {playing && player?.supportsPause() && (state.status === "playing"
          ? <button type="button" className="l-btn l-btn-ghost" onClick={() => player.pause()}>⏸ {t("listen.pause")}</button>
          : <button type="button" className="l-btn l-btn-ghost" onClick={() => player.resume()}>▶ {t("listen.resume")}</button>)}
        {variant === "chips" && <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{segments.map(sentenceButton)}</div>}
      </div>
      <p className="l-muted" aria-live="polite" style={{ minHeight: "1.2em" }}>{state.error ? t("listen.error") : state.status === "playing" && state.segmentIndex !== null ? `${t("listen.now")}: ${state.segmentIndex + 1}/${segments.length}` : ""}</p>

      {variant === "list" && (
        <ul className="l-stack" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {segments.map((s, i) => {
            const active = state.segmentId === s.id;
            return (
              <li key={s.id} aria-current={active ? "true" : undefined} data-testid={`segment-${i}`}
                style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", padding: "6px 8px", borderRadius: 10, border: active ? "2px solid var(--l-accent)" : "1px solid transparent", background: active ? "var(--l-accent-soft, rgba(0,0,0,.05))" : undefined }}>
                <button type="button" className="l-chip" aria-label={`${t("listen.sentence", { n: i + 1 })}: ${s.en}`} onClick={() => play({ from: i, to: i, mode: "en" })}>🔊</button>
                <span lang="en" style={{ flex: "1 1 8rem", minWidth: 0, overflowWrap: "anywhere" }}>{s.en}{s.ko ? <span className="l-muted"> = {s.ko}</span> : null}</span>
                {savable(s) && (
                  <button type="button" className="l-chip" data-testid={`save-word-${i}`} aria-pressed={hasWord(words, s.en)} onClick={() => toggleSave(s)}>
                    {hasWord(words, s.en) ? `✅ ${t("words.saved")}` : `➕ ${t("words.save")}`}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <details>
        <summary className="l-link" style={{ cursor: "pointer" }}>{t("listen.repeat")} · {t("listen.mode")} · {t("listen.speed")}</summary>
        <div className="l-stack" style={{ marginTop: 8 }}>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="l-muted">{t("listen.mode")}</legend>
            <label style={{ marginRight: 12 }}><input type="radio" name={`mode-${scope}`} checked={effectiveMode === "en"} onChange={() => setMode("en")} /> {t("listen.mode.en")}</label>
            <label><input type="radio" name={`mode-${scope}`} checked={effectiveMode === "en+ko"} disabled={!bilingual} onChange={() => setMode("en+ko")} /> {t("listen.mode.enko")}</label>
            {!bilingual && <p className="l-muted">{t("listen.mode.na")}</p>}
          </fieldset>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="l-muted">{t("listen.speed")}</legend>
            {SPEEDS.map((s) => <label key={s} style={{ marginRight: 12 }}><input type="radio" name={`speed-${scope}`} checked={speed === s} onChange={() => setSpeed(s)} /> {s}x</label>)}
          </fieldset>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <label>{t("listen.from")} <select aria-label={t("listen.from")} data-testid="repeat-from" value={from} onChange={(e) => { const v = Number(e.target.value); setFrom(v); if (to < v) setTo(v); }}>{segments.map((_, i) => <option key={i} value={i}>{i + 1}</option>)}</select></label>
            <label>{t("listen.to")} <select aria-label={t("listen.to")} data-testid="repeat-to" value={to} onChange={(e) => { const v = Number(e.target.value); setTo(v); if (from > v) setFrom(v); }}>{segments.map((_, i) => <option key={i} value={i}>{i + 1}</option>)}</select></label>
            <label>{t("listen.count")} <select aria-label={t("listen.count")} data-testid="repeat-count" value={count} onChange={(e) => setCount(e.target.value)}>
              {REPEAT_CHOICES.map((n) => <option key={n} value={String(n)}>{n}</option>)}<option value="custom">{t("listen.count.custom")}</option></select></label>
            {count === "custom" && (
              <label>{t("listen.count.custom.label", { n: MAX_REPEAT })} <input data-testid="repeat-custom" inputMode="numeric" value={custom} onChange={(e) => setCustom(e.target.value)} aria-invalid={customInvalid} style={{ width: "4.5rem" }} /></label>
            )}
          </div>
          <button type="button" className="l-btn l-btn-ghost" data-testid="repeat-play" disabled={customInvalid || repeat < 1} onClick={() => play({ from, to, repeat })}>🔁 {t("listen.repeat.play")}</button>
        </div>
      </details>
    </div>
  );
}
