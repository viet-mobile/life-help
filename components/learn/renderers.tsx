"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ComponentType } from "react";
import { getAudioProvider } from "@/lib/learn/providers/audio";
import { TtsSettingsPanel } from "./TtsSettings";
import type { PublicQuestion, QuestionType, Site } from "@/lib/learn/types";
import { siteConfig } from "@/lib/learn/sites";
import { useSite } from "./LearnerProvider";
import { RichText } from "./RichText";
import { choiceKeyIndex, isTextTarget } from "./choiceKeys";

/**
 * Renderer registry. A renderer receives the public question and controlled
 * value; adding a question type = register a component (no other UI changes).
 * Lookup order: `${site}:${type}` first, then the shared `type` renderer.
 */
export interface RendererProps {
  q: PublicQuestion;
  value: string | string[];
  onChange: (v: string | string[]) => void;
  disabled: boolean;
  onSubmit: () => void;
}
type Renderer = ComponentType<RendererProps>;

const shared: Partial<Record<QuestionType, Renderer>> = {};
const siteSpecific: Record<string, Renderer> = {};

export function registerRenderer(type: QuestionType, r: Renderer, site?: Site) {
  if (site) siteSpecific[`${site}:${type}`] = r;
  else shared[type] = r;
}
export function getRenderer(site: Site, type: QuestionType): Renderer | undefined {
  return siteSpecific[`${site}:${type}`] ?? shared[type];
}

/* ------------------------------- choice ------------------------------- */

function ChoiceRenderer({ q, value, onChange, disabled }: RendererProps) {
  const { t } = useSite();
  const options =
    q.type === "true_false"
      ? [
          { id: "true", text: t("lesson.tf.true") },
          { id: "false", text: t("lesson.tf.false") },
        ]
      : (q.options ?? []);
  // The letters on the options are keys: A / B / C / D (any case, also under a Korean input method) choose exactly like a click.
  const latest = useRef({ options, onChange, disabled });
  useEffect(() => { latest.current = { options, onChange, disabled }; });
  useEffect(() => {
    if (q.type !== "multiple_choice") return;
    const onKey = (e: KeyboardEvent) => {
      const { options: opts, onChange: choose, disabled: locked } = latest.current;
      if (locked || isTextTarget(e.target)) return;
      const index = choiceKeyIndex(e, opts.length);
      if (index < 0) return;
      e.preventDefault();
      choose(opts[index].id); // the same handler a click runs
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q.id, q.type]);
  return (
    <div role="radiogroup" aria-label={q.prompt} className="l-options">
      {options.map((o, i) => {
        const selected = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(o.id)}
            className="l-option"
            data-selected={selected}
          >
            <span className="l-option-key" aria-hidden="true">{q.type === "true_false" ? (o.id === "true" ? "O" : "X") : String.fromCharCode(65 + i)}</span>
            {/* dir="auto": a gloss in Arabic script reads right-to-left, Korean / English target text left-to-right, on any page */}
            <RichText text={o.text} dir="auto" />
          </button>
        );
      })}
    </div>
  );
}
registerRenderer("multiple_choice", ChoiceRenderer);
registerRenderer("true_false", ChoiceRenderer);

function MultiRenderer({ q, value, onChange, disabled }: RendererProps) {
  const selected = Array.isArray(value) ? value : [];
  return (
    <div role="group" aria-label={q.prompt} className="l-options">
      {(q.options ?? []).map((o) => {
        const on = selected.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            role="checkbox"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(on ? selected.filter((x) => x !== o.id) : [...selected, o.id])}
            className="l-option"
            data-selected={on}
          >
            <span className="l-option-key" aria-hidden="true">{on ? "✓" : ""}</span>
            <RichText text={o.text} dir="auto" />
          </button>
        );
      })}
    </div>
  );
}
registerRenderer("multiple_select", MultiRenderer);

/* ------------------------------- text -------------------------------- */

function TextRenderer({ q, value, onChange, disabled, onSubmit }: RendererProps) {
  const { t, site } = useSite();
  const numeric = q.type === "numeric";
  return (
    <div>
      <label className="l-sr" htmlFor={`ans-${q.id}`}>
        {t("lesson.answer.placeholder")}
      </label>
      <input
        id={`ans-${q.id}`}
        className="l-input"
        type="text"
        // "text" (not "decimal") so students can type minus signs and fractions on phones.
        inputMode="text"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        // typed answers are target-language text (English / Korean) or numbers: always left-to-right, with the target language's keyboard hint
        lang={!numeric ? siteConfig(site).targetLanguage?.code : undefined}
        dir="ltr"
        placeholder={numeric ? t("lesson.answer.numeric") : t("lesson.answer.placeholder")}
        value={typeof value === "string" ? value : ""}
        disabled={disabled}
        maxLength={numeric ? 32 : 120}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Enter" || e.repeat || e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229 || disabled) return;
          if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
          e.preventDefault();
          onSubmit();
        }}
      />
    </div>
  );
}
registerRenderer("numeric", TextRenderer);
registerRenderer("short_answer", TextRenderer);
registerRenderer("fill_blank", TextRenderer);

/* ------------------------------ ordering ------------------------------ */

function OrderingRenderer({ q, value, onChange, disabled }: RendererProps) {
  const { t } = useSite();
  const chosen = Array.isArray(value) ? value : [];
  const options = q.options ?? [];
  const text = (id: string) => options.find((o) => o.id === id)?.text ?? id;
  return (
    <div>
      <p className="l-muted">{t("lesson.order.hint")}</p>
      <ol className="l-slots" aria-label={q.prompt}>
        {options.map((_, i) => (
          <li key={i} className="l-slot" aria-label={t("lesson.order.slot", { n: i + 1 })}>
            <bdi>{chosen[i] ? text(chosen[i]) : ""}</bdi>
          </li>
        ))}
      </ol>
      <div className="l-tokens">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            className="l-token"
            disabled={disabled || chosen.includes(o.id)}
            onClick={() => onChange([...chosen, o.id])}
          >
            <bdi>{o.text}</bdi>
          </button>
        ))}
      </div>
      <button type="button" className="l-link" disabled={disabled || chosen.length === 0} onClick={() => onChange([])}>
        {t("lesson.order.reset")}
      </button>
    </div>
  );
}
registerRenderer("ordering", OrderingRenderer);

/* ------------------- target-language audio and text ------------------- */

/**
 * Speaker button for target-language audio (browser speech only: no cloud TTS, nothing leaves the device). When the device reports
 * its voices and none speaks the language, the button is replaced by a short note: the learner continues with the text.
 */
export function ListenButton({ text }: { text: string }) {
  const { t, site } = useSite();
  const [busy, setBusy] = useState(false);
  const target = siteConfig(site).targetLanguage;
  const provider = getAudioProvider();
  const voice = useSyncExternalStore(subscribeVoices, () => (target ? provider.hasVoice(target.speech) : false), () => true);
  if (!target || !provider.isAvailable()) return null;
  const lang = t(`lang.${target.code}`);
  if (!voice) return (
    <>
      <p className="l-target-note" role="note" data-testid="no-voice">{t("listen.noVoice", { lang })}</p>
      <TtsSettingsPanel t={t} code={target.code === "ko" ? "ko" : "en"} speech={target.speech} />
    </>
  );
  return (
    <>
    <button
      type="button"
      className="l-chip"
      data-testid="target-listen"
      aria-label={site === "english" ? t("lesson.listen") : t("target.listen", { lang })}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await provider.speak(text, target.speech);
        setBusy(false);
      }}
    >
      🔊 {site === "english" ? t("lesson.listen") : t("target.listen", { lang })}
    </button>
    <TtsSettingsPanel t={t} code={target.code === "ko" ? "ko" : "en"} speech={target.speech} />
    </>
  );
}
function subscribeVoices(notify: () => void) {
  if (typeof window === "undefined" || !window.speechSynthesis || typeof window.speechSynthesis.addEventListener !== "function") return () => {};
  window.speechSynthesis.addEventListener("voiceschanged", notify);
  return () => window.speechSynthesis.removeEventListener("voiceschanged", notify);
}

const RR_KEY = "life_help_learn_rr";
const rrListeners = new Set<() => void>();
function readRr(): boolean {
  try { return window.localStorage.getItem(RR_KEY) === "1"; } catch { return false; }
}
/**
 * The target-language text of a question (study.korean): shown large with lang / dir set for the target language, an optional
 * reading aid (Vietnamese pronunciation for vi, Revised Romanization otherwise; off by default, remembered per browser) and the speaker button.
 */
export function TargetBlock({ target, audioText }: { target: { text: string; romanization?: string; romanizationVi?: string }; audioText?: string }) {
  const { t, site, locale } = useSite();
  const romanization = site === "korean" && locale === "vi" ? target.romanizationVi : target.romanization;
  const lang = siteConfig(site).targetLanguage;
  const showRr = useSyncExternalStore((n) => { rrListeners.add(n); return () => { rrListeners.delete(n); }; }, readRr, () => false);
  const toggle = () => {
    try { window.localStorage.setItem(RR_KEY, showRr ? "0" : "1"); } catch { /* private mode: the toggle still works for this page */ }
    rrListeners.forEach((n) => n());
  };
  return (
    <div className="l-target" data-testid="target-block">
      <span className="l-target-text" lang={lang?.code} dir="ltr" data-testid="target-text">{target.text}</span>
      {audioText && <ListenButton text={audioText} />}
      {romanization && (
        <>
          <button type="button" className="l-link" aria-pressed={showRr} onClick={toggle} data-testid="rr-toggle">
            {t(showRr ? "target.romanization.hide" : "target.romanization.show")}
          </button>
          {showRr && <span className="l-target-rr" lang="ko-Latn" dir="ltr" title={t("target.romanization.name")} data-testid="target-rr">{romanization}</span>}
        </>
      )}
    </div>
  );
}

/** Renders the registered input for a question. Registry entries are stable module-level components. */
export function AnswerInput(props: RendererProps & { site: Site }) {
  const { site, ...rest } = props;
  const R = getRenderer(site, rest.q.type);
  // eslint-disable-next-line react-hooks/static-components
  return R ? <R {...rest} /> : null;
}
