import { checkRow, checkWrite, checkBuild } from "./check";
import type { Step, ThinkTask, WriteStep } from "./types";

/** Structural + semantic checks of a task file. Returns a list of problems (empty = valid). Used by the tests and the review page. */
export function validateTask(t: ThinkTask): string[] {
  const p: string[] = [];
  const need = (cond: unknown, msg: string) => { if (!cond) p.push(`${t.id}: ${msg}`); };
  for (const k of ["id", "title", "levelLabel", "goal", "differsFromPlain", "material"] as const) need(typeof t[k] === "string" && t[k].trim(), `missing ${k}`);
  need(t.thinking?.length >= 1, "thinking[] empty");
  need(t.prerequisites?.length >= 1, "prerequisites[] empty");
  need(Number.isFinite(t.minutes) && t.minutes >= 3 && t.minutes <= 30, "minutes out of range 3..30");
  need(t.curriculum === null || (t.curriculum && t.curriculum.standard && t.curriculum.note), "curriculum must be null or {standard, note}");
  need(t.rubric?.length >= 2 && t.rubric.every((r) => r.criterion && r.full && r.partial && r.none), "rubric needs >= 2 complete rows");
  need(t.alternatives?.length >= 1, "alternatives[] empty");
  need(t.hardCases?.length >= 1, "hardCases[] empty");
  need(t.cautions?.language && t.cautions?.culture && t.cautions?.accessibility, "cautions need language/culture/accessibility");
  need(t.autoVsHuman?.auto?.length >= 1 && t.autoVsHuman?.human?.length >= 1, "autoVsHuman needs both lists");
  need(Array.isArray(t.steps) && t.steps.length >= 2, "needs >= 2 steps");
  const ids = new Set<string>();
  const writeChecks = (s: WriteStep, where: string) => {
    need(s.checks.length >= 1, `${where}: no checks`);
    need(s.selfAssess.length >= 2, `${where}: selfAssess needs >= 2 items`);
    need(s.modelAnswers.length >= 2, `${where}: needs >= 2 model answers (more than one good answer exists)`);
    need(s.badAnswers.length >= 1, `${where}: needs >= 1 bad answer`);
    need(s.humanReview, `${where}: humanReview missing`);
    for (const c of s.checks) for (const pat of c.patterns) { try { new RegExp(pat, "iu"); } catch { p.push(`${t.id}: ${where}: invalid pattern ${pat}`); } }
    for (const m of s.modelAnswers) { const r = checkWrite(s, m.text); need(r.longEnough && r.results.every((x) => x.ok), `${where}: a model answer fails its own checks (${r.results.filter((x) => !x.ok).map((x) => x.id).join(",")}): ${m.text.slice(0, 40)}`); }
    for (const b of s.badAnswers) { const r = checkWrite(s, b.text); need(!r.longEnough || r.results.some((x) => !x.ok), `${where}: a bad answer passes every check: ${b.text.slice(0, 40)}`); }
  };
  for (const s of t.steps as Step[]) {
    need(s.id && !ids.has(s.id), `duplicate or missing step id ${s.id}`); ids.add(s.id);
    need(s.prompt, `${s.id}: prompt missing`);
    need(s.hints?.length >= 2, `${s.id}: needs >= 2 staged hints`);
    if (s.kind === "choose") {
      const opt = new Set(s.options.map((o) => o.id));
      need(s.options.length >= 3 && opt.size === s.options.length, `${s.id}: needs >= 3 options with unique ids`);
      need(s.correct.every((c) => opt.has(c)) && s.correct.length >= 1, `${s.id}: correct ids must exist (>= 1)`);
      need(s.multi || s.correct.length === 1, `${s.id}: single choice must have one correct id`);
      need(s.explain, `${s.id}: explain missing`);
      need(s.options.filter((o) => !s.correct.includes(o.id)).every((o) => o.reveals), `${s.id}: every non-key option needs 'reveals' (what the choice shows about the student's thinking)`);
      for (const a of s.acceptable ?? []) need(a.ids.every((i) => opt.has(i)) && a.reason, `${s.id}: acceptable entry invalid`);
    } else if (s.kind === "pickLine") {
      need(s.lines.length >= 3 && s.wrong.length >= 1 && s.wrong.every((i) => i >= 0 && i < s.lines.length), `${s.id}: lines/wrong invalid`);
      need(s.explain, `${s.id}: explain missing`);
      need(!/(^|[^\d])0\s*번|\b[Ll]ine\s*0\b/.test(s.explain), `${s.id}: explain numbers lines from 0, but the player shows lines from 1`);
    } else if (s.kind === "write") writeChecks(s, s.id);
    else if (s.kind === "build") {
      need(s.vars.length >= 1 && s.constraints.length >= 1 && s.need >= 1, `${s.id}: vars/constraints/need`);
      const mr = s.modelRows.map((r) => checkRow(s, r));
      need(s.modelRows.length >= s.need && mr.every((r) => r.ok), `${s.id}: modelRows must satisfy every constraint (${mr.map((r) => r.error ?? r.failed.map((f) => f.id).join("+")).join(";")})`);
      need(checkBuild(s, s.modelRows).valid >= s.need, `${s.id}: modelRows must contain >= need DIFFERENT examples`);
      need(s.badRows.length >= 1 && s.badRows.every((r) => !checkRow(s, r).ok), `${s.id}: badRows must each violate a constraint`);
      need(s.explain, `${s.id}: explain missing`);
      if (s.because) writeChecks(s.because, `${s.id}.because`);
    } else if (s.kind === "reveal") {
      need(s.stages.length >= 3, `${s.id}: needs >= 3 stages`);
      for (const st of s.stages) { const o = new Set(st.options.map((x) => x.id)); need(st.options.length >= 3 && st.reasonable.length >= 1 && st.reasonable.every((r) => o.has(r)), `${s.id}: stage options/reasonable invalid`); need(st.info && st.after, `${s.id}: stage info/after`); }
      need(s.reflect, `${s.id}: reflect missing`);
    } else p.push(`${t.id}: unknown step kind`);
  }
  return p;
}

export function validateSet(tasks: ThinkTask[]): string[] {
  const p: string[] = [];
  const ids = new Set<string>();
  for (const t of tasks) { if (ids.has(t.id)) p.push(`duplicate task id ${t.id}`); ids.add(t.id); p.push(...validateTask(t)); }
  return p;
}
