"use client";

import { useState, type ComponentType } from "react";
import { getAudioProvider } from "@/lib/learn/providers/audio";
import type { PublicQuestion, QuestionType, Site } from "@/lib/learn/types";
import { useSite } from "./LearnerProvider";
import { RichText } from "./RichText";

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
            <RichText text={o.text} />
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
            <RichText text={o.text} />
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
        lang={site === "english" && !numeric ? "en" : undefined}
        placeholder={numeric ? t("lesson.answer.numeric") : t("lesson.answer.placeholder")}
        value={typeof value === "string" ? value : ""}
        disabled={disabled}
        maxLength={numeric ? 32 : 120}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
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
            {chosen[i] ? text(chosen[i]) : ""}
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
            {o.text}
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

/* ------------------------- english: listen button ------------------------- */

export function ListenButton({ text }: { text: string }) {
  const { t } = useSite();
  const [busy, setBusy] = useState(false);
  const provider = getAudioProvider();
  if (!provider.isAvailable()) return null;
  return (
    <button
      type="button"
      className="l-chip"
      aria-label={t("lesson.listen")}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await provider.speak(text, "en-US");
        setBusy(false);
      }}
    >
      🔊 {t("lesson.listen")}
    </button>
  );
}

/** Renders the registered input for a question. Registry entries are stable module-level components. */
export function AnswerInput(props: RendererProps & { site: Site }) {
  const { site, ...rest } = props;
  const R = getRenderer(site, rest.q.type);
  // eslint-disable-next-line react-hooks/static-components
  return R ? <R {...rest} /> : null;
}
