/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ThinkTask } from "./types";

/**
 * Flat map of the learner-facing strings of a task (path -> string), and the inverse (apply a translated map onto a task).
 * Reviewer-only fields (rubric, alternatives, hardCases, cautions, autoVsHuman) are excluded. Learner-visible humanReview/check labels are exported separately by flattenLearnerExtras.
 * The ORDER of Object.keys(flatten(task)) is the index a translator works with (scripts/think/tr-*.ts), so keep it stable.
 */
const WRITE = (p: string, w: any, out: Record<string, string>) => {
  if (w.placeholder) out[`${p}.placeholder`] = w.placeholder;
  w.selfAssess.forEach((s: string, i: number) => (out[`${p}.selfAssess.${i}`] = s));
  w.modelAnswers.forEach((m: any, i: number) => { out[`${p}.model.${i}`] = m.text; if (m.note) out[`${p}.modelNote.${i}`] = m.note; });
};
const OPTS = (p: string, opts: any[], out: Record<string, string>) => opts.forEach((o) => { out[`${p}.o.${o.id}`] = o.text; if (o.reveals) out[`${p}.r.${o.id}`] = o.reveals; });
/**
 * Does this learner-facing string need a translation? Korean-subject tasks are authored with English instructions (pure Korean is the learning
 * target); math / English tasks are authored with Korean instructions (English target text and formulas stay as authored).
 */
export const needsTranslation = (subject: ThinkTask["subject"], s: string): boolean => (subject === "korean" ? (s.match(/[A-Za-z]{3,}/g) ?? []).length >= 2 : /[가-힣]/.test(s));
export function flatten(t: ThinkTask): Record<string, string> {
  const out: Record<string, string> = {};
  out.title = t.title; out.topic = t.topic ?? ""; out.goal = t.goal; out.material = t.material;
  t.thinking.forEach((x: string, i: number) => (out[`thinking.${i}`] = x));
  t.prerequisites.forEach((x: string, i: number) => (out[`prereq.${i}`] = x));
  for (const s of t.steps as any[]) {
    const p = `s.${s.id}`;
    out[`${p}.prompt`] = s.prompt;
    s.hints.forEach((h: string, i: number) => (out[`${p}.hint.${i}`] = h));
    if (s.kind === "choose") { OPTS(p, s.options, out); out[`${p}.explain`] = s.explain; (s.acceptable ?? []).forEach((a: any, i: number) => (out[`${p}.acc.${i}`] = a.reason)); }
    else if (s.kind === "pickLine") { s.lines.forEach((l: string, i: number) => (out[`${p}.line.${i}`] = l)); out[`${p}.explain`] = s.explain; }
    else if (s.kind === "write") WRITE(p, s, out);
    else if (s.kind === "build") {
      s.vars.forEach((v: any) => (out[`${p}.var.${v.name}`] = v.label));
      s.constraints.forEach((c: any) => { out[`${p}.ok.${c.id}`] = c.ok; out[`${p}.fail.${c.id}`] = c.fail; });
      out[`${p}.explain`] = s.explain;
      if (s.because) { out[`${p}.because.prompt`] = s.because.prompt; s.because.hints.forEach((h: string, i: number) => (out[`${p}.because.hint.${i}`] = h)); WRITE(`${p}.because`, s.because, out); }
    } else if (s.kind === "reveal") {
      s.stages.forEach((st: any, i: number) => { out[`${p}.st.${i}.info`] = st.info; out[`${p}.st.${i}.ask`] = st.ask; out[`${p}.st.${i}.after`] = st.after; OPTS(`${p}.st.${i}`, st.options, out); });
      out[`${p}.reflect`] = s.reflect;
    }
  }
  return out;
}
/** Additional learner-visible fields, kept separate to preserve existing authoring indices and locale coverage. */
export function flattenLearnerExtras(t: ThinkTask): Record<string, string> {
  const out: Record<string, string> = {};
  if (t.levelLabel) out["meta.levelLabel"] = t.levelLabel;
  const write = (p: string, w: any) => {
    if (w.humanReview) out[`${p}.humanReview`] = w.humanReview;
    (w.checks ?? []).forEach((c: any) => { if (c.label) out[`${p}.check.${c.id}.label`] = c.label; });
  };
  for (const s of t.steps as any[]) {
    const p = `s.${s.id}`;
    if (s.kind === "write") write(p, s);
    if (s.kind === "build" && s.because) write(`${p}.because`, s.because);
  }
  return out;
}
export function applyFlat(t: ThinkTask, m: Record<string, string>): ThinkTask {
  const g = (k: string, d: string): string => (typeof m[k] === "string" && m[k].trim() ? m[k] : d);
  const W = (p: string, w: any) => ({ ...w, humanReview: g(`${p}.humanReview`, w.humanReview), checks: w.checks.map((c: any) => ({ ...c, label: g(`${p}.check.${c.id}.label`, c.label) })), placeholder: w.placeholder ? g(`${p}.placeholder`, w.placeholder) : w.placeholder, selfAssess: w.selfAssess.map((s: string, i: number) => g(`${p}.selfAssess.${i}`, s)),
    modelAnswers: w.modelAnswers.map((x: any, i: number) => ({ ...x, text: g(`${p}.model.${i}`, x.text), ...(x.note ? { note: g(`${p}.modelNote.${i}`, x.note) } : {}) })) });
  const O = (p: string, opts: any[]) => opts.map((o) => ({ ...o, text: g(`${p}.o.${o.id}`, o.text), ...(o.reveals ? { reveals: g(`${p}.r.${o.id}`, o.reveals) } : {}) }));
  return { ...(t as any), levelLabel: g("meta.levelLabel", t.levelLabel), title: g("title", t.title), ...(t.topic ? { topic: g("topic", t.topic) } : {}), goal: g("goal", t.goal), material: g("material", t.material),
    thinking: t.thinking.map((x: string, i: number) => g(`thinking.${i}`, x)), prerequisites: t.prerequisites.map((x: string, i: number) => g(`prereq.${i}`, x)),
    steps: (t.steps as any[]).map((s: any) => {
      const p = `s.${s.id}`; const base = { ...s, prompt: g(`${p}.prompt`, s.prompt), hints: s.hints.map((h: string, i: number) => g(`${p}.hint.${i}`, h)) };
      if (s.kind === "choose") return { ...base, options: O(p, s.options), explain: g(`${p}.explain`, s.explain), ...(s.acceptable ? { acceptable: s.acceptable.map((a: any, i: number) => ({ ...a, reason: g(`${p}.acc.${i}`, a.reason) })) } : {}) };
      if (s.kind === "pickLine") return { ...base, lines: s.lines.map((l: string, i: number) => g(`${p}.line.${i}`, l)), explain: g(`${p}.explain`, s.explain) };
      if (s.kind === "write") return { ...base, ...W(p, s) };
      if (s.kind === "build") return { ...base, vars: s.vars.map((v: any) => ({ ...v, label: g(`${p}.var.${v.name}`, v.label) })), constraints: s.constraints.map((c: any) => ({ ...c, ok: g(`${p}.ok.${c.id}`, c.ok), fail: g(`${p}.fail.${c.id}`, c.fail) })), explain: g(`${p}.explain`, s.explain),
        ...(s.because ? { because: { ...s.because, prompt: g(`${p}.because.prompt`, s.because.prompt), hints: s.because.hints.map((h: string, i: number) => g(`${p}.because.hint.${i}`, h)), ...W(`${p}.because`, s.because) } } : {}) };
      if (s.kind === "reveal") return { ...base, stages: s.stages.map((st: any, i: number) => ({ ...st, info: g(`${p}.st.${i}.info`, st.info), ask: g(`${p}.st.${i}.ask`, st.ask), after: g(`${p}.st.${i}.after`, st.after), options: O(`${p}.st.${i}`, st.options) })), reflect: g(`${p}.reflect`, s.reflect) };
      return base;
    }) } as ThinkTask;
}
