import { evalExpr, ExprError } from "./expr";
import type { BuildStep, ChooseStep, PickLineStep, RevealStep, WriteCheck, WriteStep } from "./types";

export interface Verdict { status: "match" | "acceptable" | "not-match"; message: string }

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

/** Choice against the key. An alternative reasonable reading is `acceptable` (not wrong), anything else is `not-match` and says what that choice shows. */
export function checkChoose(step: ChooseStep, picked: string[]): Verdict {
  if (picked.length === 0) return { status: "not-match", message: "" };
  if (sameSet(picked, step.correct)) return { status: "match", message: step.explain };
  const alt = step.acceptable?.find((a) => sameSet(a.ids, picked));
  if (alt) return { status: "acceptable", message: alt.reason };
  const shown = picked.map((id) => step.options.find((o) => o.id === id)?.reveals).filter(Boolean).join(" ");
  return { status: "not-match", message: shown };
}

export function checkPickLine(step: PickLineStep, picked: number | null): Verdict {
  if (picked === null) return { status: "not-match", message: "" };
  return step.wrong.includes(picked) ? { status: "match", message: step.explain } : { status: "not-match", message: "" };
}

const rx = (p: string) => new RegExp(p, "iu");
export interface CheckResult { id: string; label: string; ok: boolean }
/** Surface features only. A pass here is NOT a judgement that the text is good. */
export function checkWrite(step: Pick<WriteStep, "checks" | "minChars">, text: string): { results: CheckResult[]; longEnough: boolean } {
  const results = step.checks.map((c: WriteCheck) => {
    const hits = c.patterns.map((p) => rx(p).test(text));
    const ok = c.mode === "any" ? hits.some(Boolean) : c.mode === "all" ? hits.every(Boolean) : !hits.some(Boolean);
    return { id: c.id, label: c.label, ok };
  });
  return { results, longEnough: text.trim().length >= (step.minChars ?? 1) };
}

export interface RowResult { ok: boolean; failed: Array<{ id: string; message: string }>; error?: string }
export function checkRow(step: BuildStep, row: Record<string, number>): RowResult {
  const failed: RowResult["failed"] = [];
  try {
    for (const name of step.vars.map((v) => v.name)) if (typeof row[name] !== "number" || !Number.isFinite(row[name])) return { ok: false, failed, error: "missing" };
    for (const c of step.constraints) if (!evalExpr(c.expr, row)) failed.push({ id: c.id, message: c.fail });
  } catch (e) {
    return { ok: false, failed, error: e instanceof ExprError ? e.message : "error" };
  }
  return { ok: failed.length === 0, failed };
}
const rowKey = (step: BuildStep, row: Record<string, number>) => (step.distinctBy ? String(evalExpr(step.distinctBy, row)) : step.vars.map((v) => row[v.name]).join("|"));
export function checkBuild(step: BuildStep, rows: Array<Record<string, number>>) {
  const results = rows.map((r) => checkRow(step, r));
  const seen = new Set<string>(); let valid = 0; const duplicates: number[] = [];
  rows.forEach((r, i) => {
    if (!results[i].ok) return;
    const k = rowKey(step, r);
    if (seen.has(k)) duplicates.push(i); else { seen.add(k); valid++; }
  });
  return { results, valid, duplicates, done: valid >= step.need };
}

export function checkRevealStage(stage: RevealStep["stages"][number], picked: string | null): "reasonable" | "other" | "none" {
  if (!picked) return "none";
  return stage.reasonable.includes(picked) ? "reasonable" : "other";
}
