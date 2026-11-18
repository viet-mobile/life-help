"use client";

import { useEffect, useMemo, useState } from "react";
import { TASK_LOADERS } from "@/lib/think/data/assets-index";
import type { ThinkTask } from "@/lib/think/types";
import { THINK_LANGS, LANG_NAMES, type ThinkLang } from "@/lib/think/lang";
import { checksOffFor, loadOverlay, localize } from "@/lib/think/localize";
import type { Overlay } from "@/lib/think/data/files";
import { labels } from "./labels";
import { TaskPlayer } from "./ThinkPlayer";

const STORE = "think-pilot:v1";
interface Flag { task: string; step: string; note: string; at: string }
const readFlags = (): Flag[] => { try { return JSON.parse(window.localStorage.getItem(STORE) ?? "[]"); } catch { return []; } };
const writeFlags = (f: Flag[]) => { try { window.localStorage.setItem(STORE, JSON.stringify(f)); } catch { /* storage unavailable: notes are kept for this visit only */ } };

const SUBJECT_ICON = { math: "➗", english: "🔤", korean: "🇰🇷" } as const;

export function ThinkPilot({ initialTasks }: { initialTasks?: ThinkTask[] } = {}) {
  const [allTasks, setAllTasks] = useState<ThinkTask[]>(initialTasks ?? []);
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => { if (initialTasks) return; let live = true; void Promise.all(Object.values(TASK_LOADERS).map(load => load())).then(lists => { if (live) setAllTasks(lists.flat()); }).catch(() => { if (live) setLoadFailed(true); }); return () => { live = false; }; }, [initialTasks]);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [subject, setSubject] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");
  const [grade, setGrade] = useState<string>("all");
  const [reviewer, setReviewer] = useState(false);
  const [lang, setLang] = useState<ThinkLang>("ko");
  const [overlay, setOverlay] = useState<Overlay>({});
  useEffect(() => { let live = true; setOverlay({}); void loadOverlay(lang).then((o) => { if (live) setOverlay(o); }); return () => { live = false; }; }, [lang]);
  const [flags, setFlags] = useState<Flag[]>([]);
  useEffect(() => { setFlags(readFlags()); const h = window.location.hash.slice(1); if (h) setTaskId(h); }, []);
  const open = (id: string | null) => { setTaskId(id); try { window.history.replaceState(null, "", id ? `#${id}` : window.location.pathname); } catch { /* ignore */ } window.scrollTo?.(0, 0); };
  const addFlag = (f: Omit<Flag, "at">) => { const n = [...flags, { ...f, at: new Date().toISOString() }]; setFlags(n); writeFlags(n); };
  const found = taskId ? allTasks.find((t) => t.id === taskId) ?? null : null;
  const loc = found ? localize(found, lang, overlay) : null;
  const task = loc?.task ?? null;
  const L0 = labels(lang);

  if (task) return <TaskPlayer key={`${task.id}:${lang}:${loc?.translated}`} task={task} lang={lang} checksOff={checksOffFor(task, lang)} reviewer={reviewer} onBack={() => open(null)} onFlag={addFlag} />;

  if (loadFailed) return <p role="alert">과제를 불러오지 못했습니다. 새로고침해 다시 시도해 주세요. / Could not load tasks. Please reload.</p>;
  if (!allTasks.length) return <p role="status">과제를 불러오는 중… / Loading tasks…</p>;
  const grades = [...new Set(allTasks.filter((t) => (subject === "all" || t.subject === subject) && t.grade).map((t) => t.grade as string))];
  const shown = allTasks.filter((t) => (subject === "all" || t.subject === subject) && (level === "all" || String(t.level) === level) && (grade === "all" || t.grade === grade));
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 text-slate-900" data-testid="think-list">
      <div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-black">{L0.title}</h1><label className="ml-auto text-sm font-bold">🌐 <select value={lang} onChange={(e) => setLang(e.target.value as ThinkLang)} data-testid="lang-select" className="rounded-lg border px-2 py-1">{THINK_LANGS.map((l) => <option key={l} value={l}>{LANG_NAMES[l]}</option>)}</select></label></div>
      <p className="mt-1 text-sm text-slate-600">검토용 과제 {allTasks.length}개(앞의 36개는 AI 독립 검토 2회, 🟡 표시는 초안) · Review pilot · 수량이 아니라 학생이 하는 생각을 보기 위한 시제품입니다. 자동 확인은 정오 확정이 아닙니다.</p>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={L0.subject}>
        {["all", "math", "english", "korean"].map((s) => (
          <button key={s} onClick={() => setSubject(s)} aria-pressed={subject === s} className={`rounded-full border px-3 py-1 text-sm font-bold ${subject === s ? "bg-slate-900 text-white" : "bg-white"}`}>{s === "all" ? L0.all : L0[s as "math"]}</button>
        ))}
        {["all", "1", "2", "3"].map((s) => (
          <button key={`l${s}`} onClick={() => setLevel(s)} aria-pressed={level === s} className={`rounded-full border px-3 py-1 text-sm font-bold ${level === s ? "bg-slate-900 text-white" : "bg-white"}`}>{s === "all" ? `${L0.level}: ${L0.all}` : `${L0.level} ${s}`}</button>
        ))}
        {grades.length > 0 && (
          <select value={grade} onChange={(e) => setGrade(e.target.value)} aria-label="grade" data-testid="grade-filter" className="rounded-full border px-3 py-1 text-sm font-bold">
            <option value="all">{L0.all} (grade / level)</option>
            {grades.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        )}
        <label className="ml-auto flex items-center gap-2 text-sm"><input type="checkbox" checked={reviewer} onChange={(e) => setReviewer(e.target.checked)} data-testid="reviewer-toggle" />{L0.reviewerMode}</label>
      </div>
      <ul className="mt-4 grid gap-3">
        {shown.map((t0) => { const t = localize(t0, lang, overlay).task; return (
          <li key={t.id}>
            <button onClick={() => open(t.id)} data-testid={`task-${t.id}`} className="w-full rounded-2xl border bg-white p-4 text-left shadow-sm hover:border-slate-900">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><span aria-hidden>{SUBJECT_ICON[t.subject]}</span>{t.id} · {t.grade ? `${t.grade} · ` : ""}{t.levelLabel} · {t.minutes}{labels(t.uiLang).minutes} · {t.format}{t.topic ? ` · ${t.topic}` : ""}{t.status === "draft" ? " · 🟡 draft (not independently reviewed)" : ""}</div>
              <div className="mt-1 text-lg font-black">{t.title}</div>
              <div className="mt-1 text-sm text-slate-600">{t.goal}</div>
            </button>
          </li>
        ); })}
      </ul>
      {flags.length > 0 && <p className="mt-6 text-sm text-slate-600">{flags.length} note(s) saved on this device · <button className="underline" onClick={() => { const b = new Blob([JSON.stringify(flags, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "think-pilot-notes.json"; a.click(); }}>{L0.export}</button></p>}
    </main>
  );
}

