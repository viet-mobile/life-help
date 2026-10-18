"use client";

import { useEffect, useMemo, useState } from "react";
import { checkBuild, checkChoose, checkPickLine, checkRevealStage, checkWrite, previousPredictionText } from "@/lib/think/check";
import type { ThinkLang } from "@/lib/think/lang";
import type { BuildStep, ChooseStep, PickLineStep, RevealStep, Step, ThinkTask, WriteStep } from "@/lib/think/types";
import { fmt, labels, type Labels } from "./labels";

export interface Flag { task: string; step: string; note: string; at: string }
/**
 * One task, played step by step. `lang` is the language of the (already localized) task content and of the chrome; `checksOff` hides the
 * surface checks of written answers (math answers are written in the learner's language, the checks only know the authored language).
 */
export function TaskPlayer({ task, lang, checksOff = false, reviewer, onBack, onFlag, onComplete }: { task: ThinkTask; lang?: ThinkLang; checksOff?: boolean; reviewer: boolean; onBack: () => void; onFlag: (f: Omit<Flag, "at">) => void; onComplete?: () => void }) {
  const L = labels(lang ?? task.uiLang);
  const shownLang = lang ?? task.uiLang;
  const [started, setStarted] = useState(false);
  const [at, setAt] = useState(0);
  const [done, setDone] = useState<Record<string, "auto" | "surface" | "skipped" | "revealed">>({});
  const finished = at >= task.steps.length;
  useEffect(() => { if (finished) onComplete?.(); }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps
  const mark = (id: string, how: "auto" | "surface" | "skipped" | "revealed") => setDone((d) => ({ ...d, [id]: how }));
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 text-slate-900" data-testid="think-task" data-task={task.id} lang={task.uiLang}>
      <button onClick={onBack} className="text-sm font-bold underline">{L.back}</button>
      <p className="mt-3 text-xs font-bold text-slate-500">{task.id} · {task.levelLabel} · ≈{task.minutes}{L.minutes} · {task.format}</p>
      <h1 className="text-2xl font-black">{task.title}</h1>
      {task.status === "draft" && <p className="mt-1 rounded-lg bg-amber-50 p-2 text-xs font-bold text-amber-800" data-testid="draft-note">🟡 {shownLang === "ko" ? "초안: 자동 검증만 통과했고 독립 검토 전이에요." : "Draft: passed the automatic validator only; not independently reviewed yet."}</p>}
      <p className="mt-2 text-sm" data-testid="prereq"><b>{L.prereq}:</b> {task.prerequisites.join("; ")}</p>
      <details className="mt-3 rounded-2xl border bg-slate-50 p-4 text-sm" data-testid="task-info" open={reviewer}>
        <summary className="cursor-pointer font-black">{L.info}</summary>
        <div className="mt-2 grid gap-2">
          <p><b>{L.goal}:</b> {task.goal}</p>
          <p><b>{L.thinking}:</b> {task.thinking.join(" · ")}</p>
          <p><b>{L.differs}:</b> {task.differsFromPlain}</p>
          <p><b>{L.curriculum}:</b> {task.curriculum ? `${task.curriculum.standard} — ${task.curriculum.note}` : L.none2}</p>
        </div>
      </details>
      <p className="mt-2 text-xs text-slate-500">{L.uncertainty}</p>
      <section className="mt-4 rounded-2xl border-2 border-slate-900 p-4" aria-label="material"><p className="whitespace-pre-wrap text-base leading-relaxed" data-testid="material">{task.material}</p></section>
      {!started ? (
        <button className="mt-4 rounded-xl bg-slate-900 px-5 py-3 font-black text-white" onClick={() => setStarted(true)} data-testid="start">{L.start}</button>
      ) : (
        <div className="mt-4 grid gap-6">
          {task.steps.slice(0, at + 1).map((s, i) => (
            <StepView key={s.id} step={s} index={i} total={task.steps.length} L={L} reviewer={reviewer} task={task} checksOff={checksOff} current={i === at}
              onResult={(how) => mark(s.id, how)} onFlag={(note) => onFlag({ task: task.id, step: s.id, note })}
              onNext={() => setAt((a) => Math.max(a, i + 1))} resolved={done[s.id]} />
          ))}
          {finished && <Summary task={task} L={L} done={done} />}
        </div>
      )}
    </main>
  );
}

function Hints({ hints, L, id }: { hints: string[]; L: Labels; id: string }) {
  const [n, setN] = useState(0);
  return (
    <div className="grid gap-1" data-testid={`hints-${id}`}>
      {hints.slice(0, n).map((h, i) => <p key={i} className="rounded-lg bg-amber-50 p-2 text-sm">💡 {h}</p>)}
      <button type="button" disabled={n >= hints.length} onClick={() => setN(n + 1)} className="w-fit rounded-lg border px-3 py-1 text-sm font-bold disabled:opacity-50" data-testid={`hint-${id}`}>{n >= hints.length && n > 0 ? L.hintNone : `${L.hint} (${n}/${hints.length})`}</button>
    </div>
  );
}

function FlagBox({ L, onFlag }: { L: Labels; onFlag: (note: string) => void }) {
  const [note, setNote] = useState(""); const [saved, setSaved] = useState(false);
  return saved ? <p className="text-sm font-bold text-emerald-700" role="status">{L.flagged}</p> : (
    <details className="text-sm"><summary className="cursor-pointer font-bold">{L.flag}</summary>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full rounded-lg border p-2" rows={2} aria-label={L.flag} />
      <button className="mt-1 rounded-lg border px-3 py-1 font-bold" onClick={() => { onFlag(note.trim() || "(no note)"); setSaved(true); }}>OK</button></details>
  );
}

interface SV { step: Step; index: number; total: number; L: Labels; reviewer: boolean; task: ThinkTask; checksOff: boolean; current: boolean; resolved?: string; onResult: (h: "auto" | "surface" | "skipped" | "revealed") => void; onFlag: (n: string) => void; onNext: () => void }
function StepView(p: SV) {
  const { step, L } = p;
  const [skipped, setSkipped] = useState(false);
  const canSkip = step.scaffold && !p.resolved && !skipped && p.current;
  return (
    <section className="grid gap-3 rounded-2xl border bg-white p-4" aria-label={`${p.index + 1}/${p.total}`} data-testid={`step-${step.id}`} data-resolved={p.resolved ?? ""}>
      <h2 className="text-base font-black">{p.index + 1}/{p.total} · {step.prompt}</h2>
      {skipped ? <p className="text-sm text-slate-500">— {L.skip}</p> : (
        <>
          {step.kind === "choose" && <ChooseView {...p} step={step} />}
          {step.kind === "pickLine" && <PickLineView {...p} step={step} />}
          {step.kind === "write" && <WriteView {...p} step={step} />}
          {step.kind === "build" && <BuildView {...p} step={step} />}
          {step.kind === "reveal" && <RevealView {...p} step={step} />}
          <Hints hints={step.hints} L={L} id={step.id} />
        </>
      )}
      <div className="flex gap-2">
        {canSkip && <button className="rounded-lg border px-3 py-1 text-sm font-bold" data-testid={`skip-${step.id}`} onClick={() => { setSkipped(true); p.onResult("skipped"); p.onNext(); }}>{L.skip}</button>}
        {p.current && p.resolved && !skipped && <button className="rounded-xl bg-slate-900 px-4 py-2 font-black text-white" data-testid={`next-${step.id}`} onClick={p.onNext}>{p.index + 1 >= p.total ? L.finish : L.next}</button>}
      </div>
    </section>
  );
}

function Feedback({ kind, msg, L }: { kind: "match" | "acceptable" | "not-match"; msg: string; L: Labels }) {
  const cls = kind === "match" ? "bg-emerald-50 border-emerald-300" : kind === "acceptable" ? "bg-sky-50 border-sky-300" : "bg-rose-50 border-rose-300";
  const head = kind === "match" ? `✅ ${L.matchT}` : kind === "acceptable" ? `🟦 ${L.acceptT}` : `↻ ${L.notT}`;
  return <div role="status" aria-live="polite" className={`rounded-lg border p-3 text-sm ${cls}`} data-testid="feedback" data-kind={kind}><b>{head}</b>{msg ? <p className="mt-1 whitespace-pre-wrap">{msg}</p> : null}</div>;
}

function ChooseView({ step, L, reviewer, onResult, onFlag }: SV & { step: ChooseStep }) {
  const [sel, setSel] = useState<string[]>([]);
  const [res, setRes] = useState<ReturnType<typeof checkChoose> | null>(null);
  const [tries, setTries] = useState(0);
  const toggle = (id: string) => { setRes(null); setSel((s) => (step.multi ? (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]) : [id])); };
  return (
    <div className="grid gap-2">
      <div role={step.multi ? "group" : "radiogroup"} className="grid gap-2">
        {step.options.map((o) => (
          <button key={o.id} type="button" role={step.multi ? "checkbox" : "radio"} aria-checked={sel.includes(o.id)} onClick={() => toggle(o.id)} data-testid={`opt-${o.id}`}
            className={`rounded-xl border p-3 text-left text-sm ${sel.includes(o.id) ? "border-slate-900 bg-slate-100" : ""}`}>
            <b className="mr-2" aria-hidden="true">{o.id.toUpperCase()}.</b>{o.text}{reviewer && step.correct.includes(o.id) ? " ✔" : ""}
          </button>
        ))}
      </div>
      {step.multi && <p className="text-xs text-slate-500">{step.multi ? "☑ multiple" : ""}</p>}
      <button className="w-fit rounded-xl bg-slate-900 px-4 py-2 font-black text-white disabled:opacity-40" disabled={!sel.length} data-testid="check" onClick={() => { const r = checkChoose(step, sel); setRes(r); setTries((t) => t + 1); onResult(r.status === "not-match" ? "surface" : "auto"); }}>{L.check}</button>
      {res && <Feedback kind={res.status} msg={res.status === "not-match" ? res.message : res.message || step.explain} L={L} />}
      {res?.status === "not-match" && tries >= 2 && <Feedback kind="match" msg={step.explain} L={L} />}
      {res && <FlagBox L={L} onFlag={onFlag} />}
    </div>
  );
}

function PickLineView({ step, L, reviewer, onResult, onFlag }: SV & { step: PickLineStep }) {
  const [sel, setSel] = useState<number | null>(null);
  const [res, setRes] = useState<ReturnType<typeof checkPickLine> | null>(null);
  const [tries, setTries] = useState(0);
  return (
    <div className="grid gap-2">
      <p className="text-xs text-slate-500">{L.pickLine}</p>
      <ol className="grid gap-1" role="radiogroup">
        {step.lines.map((l, i) => (
          <li key={i}><button type="button" role="radio" aria-checked={sel === i} onClick={() => { setSel(i); setRes(null); }} data-testid={`line-${i}`} className={`w-full rounded-lg border p-2 text-left text-sm ${sel === i ? "border-slate-900 bg-slate-100" : ""}`}>{i + 1}. {l}{reviewer && step.wrong.includes(i) ? " ✘" : ""}</button></li>
        ))}
      </ol>
      <button className="w-fit rounded-xl bg-slate-900 px-4 py-2 font-black text-white disabled:opacity-40" disabled={sel === null} data-testid="check" onClick={() => { const r = checkPickLine(step, sel); setRes(r); setTries((t) => t + 1); onResult(r.status === "match" ? "auto" : "surface"); }}>{L.check}</button>
      {res && <Feedback kind={res.status} msg={res.message} L={L} />}
      {res?.status === "not-match" && tries >= 2 && <Feedback kind="match" msg={step.explain} L={L} />}
      {res && <FlagBox L={L} onFlag={onFlag} />}
    </div>
  );
}

function WriteBlock({ step, L, onResult, onFlag, reviewer, checksOff }: { step: WriteStep; L: Labels; onResult: (h: "surface") => void; onFlag: (n: string) => void; reviewer: boolean; checksOff: boolean }) {
  const [text, setText] = useState("");
  const [shown, setShown] = useState(false);
  const [ticks, setTicks] = useState<boolean[]>(() => step.selfAssess.map(() => false));
  const r = useMemo(() => (shown ? checkWrite(step, text) : null), [shown, step, text]);
  return (
    <div className="grid gap-2">
      <textarea value={text} onChange={(e) => { setText(e.target.value); }} rows={4} placeholder={step.placeholder} aria-label={step.prompt} data-testid="write" dir="auto" className="w-full rounded-xl border p-3 text-sm" />
      <div className="flex gap-2">
        <button className="rounded-xl bg-slate-900 px-4 py-2 font-black text-white disabled:opacity-40" disabled={!text.trim()} data-testid="check" onClick={() => { setShown(true); onResult("surface"); }}>{L.check}</button>
        {shown && <button className="rounded-xl border px-4 py-2 font-bold" onClick={() => setShown(false)}>{L.retry}</button>}
      </div>
      {shown && r && (
        <div className="grid gap-2" data-testid="write-result">
          {!checksOff && <p className="rounded-lg bg-slate-50 p-2 text-xs text-slate-600">{L.surfaceNote}</p>}
          {!checksOff && (
            <ul className="grid gap-1 text-sm">
              {r.results.map((c) => <li key={c.id} data-ok={c.ok}>{c.ok ? "☑" : "☐"} {c.label}</li>)}
              {!r.longEnough && <li>☐ {L.enterAnswer}</li>}
            </ul>
          )}
          <details open className="rounded-lg border p-3"><summary className="cursor-pointer text-sm font-black">{L.model}</summary>
            <ul className="mt-2 grid gap-2 text-sm">{step.modelAnswers.map((m, i) => <li key={i} className="rounded-lg bg-emerald-50 p-2" dir="auto">{m.text}{m.note ? <span className="block text-xs text-slate-500">{m.note}</span> : null}</li>)}</ul></details>
          <fieldset className="grid gap-1 text-sm"><legend className="font-black">{L.selfAssess}</legend>
            {step.selfAssess.map((s, i) => <label key={i} className="flex gap-2"><input type="checkbox" checked={ticks[i]} onChange={() => setTicks((t) => t.map((x, j) => (j === i ? !x : x)))} />{s}</label>)}</fieldset>
          <p className="text-xs text-slate-600"><b>{L.needsHuman}:</b> {step.humanReview}</p>
          {reviewer && <ul className="text-xs text-rose-700">{step.badAnswers.map((b, i) => <li key={i}>✘ {b.text} — {b.why}</li>)}</ul>}
          <FlagBox L={L} onFlag={onFlag} />
        </div>
      )}
    </div>
  );
}
function WriteView(p: SV & { step: WriteStep }) { return <WriteBlock step={p.step} L={p.L} onResult={p.onResult} onFlag={p.onFlag} reviewer={p.reviewer} checksOff={p.checksOff} />; }

function BuildView({ step, L, reviewer, checksOff, onResult, onFlag }: SV & { step: BuildStep }) {
  const blank = () => Object.fromEntries(step.vars.map((v) => [v.name, ""])) as Record<string, string>;
  const [rows, setRows] = useState<Array<Record<string, string>>>([blank()]);
  const [checked, setChecked] = useState(false);
  const nums = rows.map((r) => Object.fromEntries(step.vars.map((v) => [v.name, r[v.name].trim() === "" ? NaN : Number(r[v.name])])) as Record<string, number>);
  const out = useMemo(() => (checked ? checkBuild(step, nums) : null), [checked, step, rows]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="grid gap-3">
      {rows.map((r, i) => (
        <div key={i} className="grid gap-1 rounded-xl border p-2" data-testid={`row-${i}`}>
          <div className="flex flex-wrap items-end gap-2">
            {step.vars.map((v) => (
              <label key={v.name} className="grid text-xs font-bold">{v.label}
                <input inputMode="decimal" value={r[v.name]} onChange={(e) => { setChecked(false); setRows((rs) => rs.map((x, j) => (j === i ? { ...x, [v.name]: e.target.value } : x))); }} aria-label={`${v.label} #${i + 1}`} data-testid={`in-${v.name}-${i}`} className="w-24 rounded-lg border p-2 text-sm" /></label>
            ))}
            {rows.length > 1 && <button className="rounded-lg border px-2 py-1 text-xs" onClick={() => { setChecked(false); setRows((rs) => rs.filter((_, j) => j !== i)); }}>{L.remove}</button>}
          </div>
          {out && (
            <ul className="text-xs" aria-live="polite">
              {out.results[i].error ? <li>⚠ {L.numbers}</li> : out.results[i].ok ? <li data-testid={`ok-${i}`}>✅ {step.constraints.map((c) => c.ok).join(" ")}{out.duplicates.includes(i) ? ` ⚠ ${L.duplicate}` : ""}</li> : out.results[i].failed.map((f) => <li key={f.id}>↻ {f.message}</li>)}
            </ul>
          )}
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <button className="rounded-lg border px-3 py-1 text-sm font-bold" onClick={() => { setChecked(false); setRows((rs) => [...rs, blank()]); }}>{L.add}</button>
        <button className="rounded-xl bg-slate-900 px-4 py-2 font-black text-white" data-testid="check" onClick={() => { setChecked(true); const o = checkBuild(step, nums); onResult(o.done ? "auto" : "surface"); }}>{L.check}</button>
      </div>
      <p className="text-xs text-slate-600" data-testid="build-count">{fmt(L.needN, { n: step.need, k: out?.valid ?? 0 })}</p>
      {out?.done && <Feedback kind="match" msg={step.explain} L={L} />}
      {reviewer && <p className="text-xs text-emerald-700">✔ {JSON.stringify(step.modelRows)}</p>}
      {out && <FlagBox L={L} onFlag={onFlag} />}
      {step.because && out?.done && <WriteBlock step={step.because} L={L} onResult={() => onResult("surface")} onFlag={onFlag} reviewer={reviewer} checksOff={checksOff} />}
    </div>
  );
}

function RevealView({ step, L, onResult, onFlag }: SV & { step: RevealStep }) {
  const [stage, setStage] = useState(0);
  const [picks, setPicks] = useState<Array<string | null>>(step.stages.map(() => null));
  const [committed, setCommitted] = useState<boolean[]>(step.stages.map(() => false));
  const all = committed.every(Boolean);
  useEffect(() => { if (all) onResult("surface"); }, [all]); // eslint-disable-line react-hooks/exhaustive-deps
  const changes = picks.filter((p, i) => i > 0 && p !== picks[i - 1]).length;
  return (
    <div className="grid gap-3">
      {step.stages.slice(0, stage + 1).map((st, i) => (
        <div key={i} className="grid gap-2 rounded-xl border p-3" data-testid={`stage-${i}`}>
          <p className="whitespace-pre-wrap text-sm"><b>#{i + 1}</b> {st.info}</p>
          <p className="text-sm font-bold">{st.ask}</p>
          <div role="radiogroup" className="grid gap-1">
            {st.options.map((o) => (
              <button key={o.id} role="radio" aria-checked={picks[i] === o.id} disabled={committed[i]} onClick={() => setPicks((p) => p.map((x, j) => (j === i ? o.id : x)))} data-testid={`s${i}-${o.id}`} className={`rounded-lg border p-2 text-left text-sm ${picks[i] === o.id ? "border-slate-900 bg-slate-100" : ""}`}><b className="mr-2" aria-hidden="true">{o.id.toUpperCase()}.</b>{o.text}</button>
            ))}
          </div>
          {!committed[i] ? (
            <button className="w-fit rounded-xl bg-slate-900 px-4 py-2 font-black text-white disabled:opacity-40" disabled={!picks[i]} data-testid={`commit-${i}`} onClick={() => { setCommitted((c) => c.map((x, j) => (j === i ? true : x))); }}>{L.check}</button>
          ) : (
            <>
              <Feedback kind={checkRevealStage(st, picks[i]) === "reasonable" ? "acceptable" : "not-match"} msg={`${st.options.find((o) => o.id === picks[i])?.reveals ?? ""} ${st.after}`.trim()} L={L} />
              {i > 0 && picks[i] !== picks[i - 1] && <p className="text-xs text-slate-600">↺ {L.before}: {previousPredictionText(step, i, picks[i - 1]) ?? L.notAnswered}</p>}
              {i === stage && i + 1 < step.stages.length && <button className="w-fit rounded-lg border px-3 py-1 text-sm font-bold" data-testid={`more-${i}`} onClick={() => setStage(i + 1)}>{L.reveal}</button>}
            </>
          )}
        </div>
      ))}
      {all && <div className="rounded-lg bg-slate-50 p-3 text-sm" data-testid="reflect"><b>{L.reflect}</b> — {L.revise} ({changes}) <p className="mt-1">{step.reflect}</p></div>}
      {all && <FlagBox L={L} onFlag={onFlag} />}
    </div>
  );
}

function Summary({ task, L, done }: { task: ThinkTask; L: Labels; done: Record<string, string> }) {
  return (
    <section className="grid gap-3 rounded-2xl border-2 border-slate-900 p-4" data-testid="summary">
      <h2 className="text-lg font-black">{L.summary}</h2>
      <ul className="text-sm">{task.steps.map((s) => <li key={s.id}>{done[s.id] === "auto" ? "✅" : done[s.id] === "skipped" ? "⏭" : "◐"} {s.id}: {done[s.id] === "auto" ? L.matchT : done[s.id] === "skipped" ? L.skip : L.needsHuman}</li>)}</ul>
      <div><b>{L.autoVs}</b><ul className="list-disc pl-5 text-sm"><li><u>auto</u>: {task.autoVsHuman.auto.join("; ")}</li><li><u>human</u>: {task.autoVsHuman.human.join("; ")}</li></ul></div>
      <div><b>{L.rubric}</b>
        <table className="mt-1 w-full border text-xs"><thead><tr><th className="border p-1" /><th className="border p-1">{L.full}</th><th className="border p-1">{L.partial}</th><th className="border p-1">{L.none}</th></tr></thead>
          <tbody>{task.rubric.map((r) => <tr key={r.criterion}><th className="border p-1 text-left">{r.criterion}</th><td className="border p-1">{r.full}</td><td className="border p-1">{r.partial}</td><td className="border p-1">{r.none}</td></tr>)}</tbody></table></div>
      <div><b>{L.alternatives}</b><ul className="list-disc pl-5 text-sm">{task.alternatives.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
      <div><b>{L.hard}</b><ul className="list-disc pl-5 text-sm">{task.hardCases.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
      <div><b>{L.cautions}</b><ul className="list-disc pl-5 text-sm"><li>{task.cautions.language}</li><li>{task.cautions.culture}</li><li>{task.cautions.accessibility}</li></ul></div>
    </section>
  );
}
