"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FILE_META, TASK_LOADERS } from "@/lib/think/data/assets-index";
import { domainOf } from "@/lib/think/domains";
import { fieldInfo, fieldKeyOf, fieldList } from "@/lib/think/areas";
import { hasThinkSemesters, inSemester } from "@/lib/think/semesters";
import { gradeLabel } from "@/lib/think/grades";
import { thinkLangFor, type ThinkLang } from "@/lib/think/lang";
import { checksOffFor, loadOverlay, localize } from "@/lib/think/localize";
import { siteConfig } from "@/lib/learn/sites";
import { schoolLevel, type Grade } from "@/lib/learn/types";
import type { ThinkTask } from "@/lib/think/types";
import { useLearner } from "../learn/LearnerProvider";
import { flowKey, taskCompleted } from "@/lib/think/flow";
import { ELECTIVE_NAMES, HUB } from "./hubLabels";
import { readLedger } from "./ThinkOffer";
import { labels } from "./labels";
import { TaskPlayer } from "./ThinkPlayer";

const KEY = (site: string) => `learn:think:${site}`;
const readDone = (site: string): Record<string, string> => { try { return JSON.parse(window.localStorage.getItem(KEY(site)) ?? "{}"); } catch { return {}; } };
const writeDone = (site: string, d: Record<string, string>) => { try { window.localStorage.setItem(KEY(site), JSON.stringify(d)); } catch { /* storage unavailable: progress is kept for this visit only */ } };
const bandOf = (g: string): 1 | 2 | 3 => (g.startsWith("K") ? (Number(g.slice(1)) <= 4 ? 1 : Number(g.slice(1)) <= 7 ? 2 : 3) : schoolLevel(g as Grade) === "elementary" ? 1 : /^M/.test(g) ? 2 : 3);

/**
 * Thinking challenges inside the learning site: the tasks of the learner's own grade / level (and, for math H2 / H3, the elective courses),
 * in the learner's language when a translation exists. Opened from the dashboard; the regular lessons are untouched. Progress ("tried") is
 * kept on this device - the tasks write no scores, XP or accounts data.
 */
export function ThinkHub() {
  const { site, state, locale, href, ready, t } = useLearner();
  const router = useRouter();
  const params = useSearchParams();
  const own = (state.profile?.grade ?? siteConfig(site).levels[0]) as string;
  const [grade, setGrade] = useState<string>(params.get("grade") || own);
  const [field, setField] = useState<string>(params.get("field") || "all");
  const [semester, setSemester] = useState<string>(params.get("semester") === "1" || params.get("semester") === "2" ? (params.get("semester") as string) : "all");
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [tasks, setTasks] = useState<ThinkTask[]>([]);
  const [overlay, setOverlay] = useState<Record<string, Record<string, string>>>({});
  const [done, setDone] = useState<Record<string, string>>({});
  const lang: ThinkLang = thinkLangFor(locale, site);
  const H = HUB[lang];
  const L = labels(lang);
  const open = params.get("task");

  useEffect(() => { if (!params.get("grade")) setGrade(own); }, [own, params]);
  useEffect(() => { setDone(readDone(site)); }, [site]);
  useEffect(() => {
    let live = true;
    setTasks([]); setOverlay({}); setLoadError(false); setLoading(true);
    const isElective = grade.startsWith("EL-");
    const metas = FILE_META.filter((m) => m.subject === site && (m.grades.includes(grade) || (!isElective && m.grades.length === 0)));
    void Promise.all(metas.map((m) => TASK_LOADERS[m.key]())).then(async (lists) => {
      const all = lists.flat().filter((t) => (t.grade ? t.grade === grade : !isElective && t.level === bandOf(grade)));
      const o = await loadOverlay(lang, metas.map((m) => m.key));
      if (live) { setTasks(all); setOverlay(o); setLoading(false); }
    }).catch(() => { if (live) { setLoadError(true); setLoading(false); } });
    return () => { live = false; };
  }, [site, grade, lang, retry]);

  const everything = useMemo(() => tasks.map((t) => localize(t, lang, overlay)), [tasks, lang, overlay]);
  // Only tasks fully available in the learner's language are listed or opened; the others are counted and explained, never shown half-translated.
  const localized = useMemo(() => everything.filter((x) => x.translated), [everything]);
  const hidden = everything.length - localized.length;
  // Math: four curriculum areas; English / Korean: six fields (lib/think/areas.ts). A task that fits none is listed under "all" only. Other sites: topic / skill.
  const fieldOf = (t: (typeof tasks)[number]): string | null => (fieldList(site).length ? fieldKeyOf(site, t.id) : (t.topic ?? domainOf(t)));
  const fields = useMemo(() => (fieldList(site).length ? fieldList(site).filter((a) => localized.some((x) => fieldKeyOf(site, x.task.id) === a)) : [...new Set(localized.map((x) => x.task.topic ?? domainOf(x.task)))]), [localized, site]);
  const fieldText = (k: string | null, full: boolean) => (k && fieldList(site).length ? fieldInfo(site, k, lang)[full ? "full" : "short"] : k ?? "");
  const semesterOn = hasThinkSemesters(site) && !grade.startsWith("EL-");
  const bySemester = localized.filter((x) => !semesterOn || inSemester(x.task.id, semester));
  const fieldNow = fields.includes(field) ? field : "all"; // a ?field= that this grade has no tasks for falls back to all
  const shown = bySemester.filter((x) => fieldNow === "all" || fieldOf(x.task) === fieldNow);
  const current = open ? localized.find((x) => x.task.id === open) : undefined;
  const grades = [...siteConfig(site).levels, ...(site === "math" ? Object.keys(ELECTIVE_NAMES) : [])];
  const gradeName = (g: string) => (g.startsWith("EL-") ? ELECTIVE_NAMES[g][lang] : g);

  if (!ready) return <div className="l-wrap" role="status">…</div>;
  const loadText = { ko: ["과제를 불러오는 중…", "과제를 불러오지 못했어요.", "다시 시도"], en: ["Loading tasks…", "Could not load tasks.", "Try again"], vi: ["Đang tải bài tập…", "Không thể tải bài tập.", "Thử lại"], ja: ["課題を読み込み中…", "課題を読み込めませんでした。", "再試行"], "zh-Hans": ["正在加载任务…", "无法加载任务。", "重试"], "zh-Hant": ["正在載入任務…", "無法載入任務。", "重試"] }[lang];
  if (loadError) return <div className="l-wrap" role="alert"><p>{loadText[1]}</p><button className="l-btn" onClick={() => setRetry(n => n + 1)}>{loadText[2]}</button></div>;
  if (loading) return <div className="l-wrap" role="status">{loadText[0]}</div>;
  if (current) {
    return (
      <div className="l-wrap l-stack" data-testid="think-player">
        <TaskPlayer key={`${current.task.id}:${lang}`} task={current.task} lang={lang} checksOff={checksOffFor(current.task, lang)} reviewer={false}
          onBack={() => router.push(href("/think"))} onFlag={() => undefined}
          onComplete={() => { const d = { ...readDone(site), [current.task.id]: new Date().toISOString() }; writeDone(site, d); setDone(d); try { window.localStorage.setItem(flowKey(site), JSON.stringify(taskCompleted(readLedger(site), current.task.id))); } catch { /* storage unavailable */ } }} />
      </div>
    );
  }
  const doneCount = shown.filter((x) => done[x.task.id]).length;
  return (
    <div className="l-wrap l-wrap-wide l-stack" data-testid="think-hub">
      <h1 className="l-h1">🧠 {H.title}</h1>
      <p className="l-muted">{H.intro}</p>
      <div className="l-card l-stack">
        <label className="l-stack" style={{ gap: 4 }}>
          <span className="l-muted">{H.grade}</span>
          <select className="l-input" data-testid="think-grade" value={grade} onChange={(e) => { setGrade(e.target.value); setField("all"); }}>
            {grades.map((g) => <option key={g} value={g}>{g.startsWith("EL-") ? `${H.electives}: ${gradeName(g)}` : gradeLabel(g, lang)}</option>)}
          </select>
        </label>
        {semesterOn && (
          <label className="l-stack" style={{ gap: 4 }}>
            <span className="l-muted">{t("semester.title")}</span>
            <select className="l-input" data-testid="think-semester" value={semester} onChange={(e) => setSemester(e.target.value)}>
              <option value="all">{H.allSemesters}</option>
              <option value="1">{t("semester.1")}</option>
              <option value="2">{t("semester.2")}</option>
            </select>
          </label>
        )}
        {fields.length > 1 && (
          <label className="l-stack" style={{ gap: 4 }}>
            <span className="l-muted">{H.field}</span>
            <select className="l-input" data-testid="think-field" value={fieldNow} onChange={(e) => setField(e.target.value)}>
              <option value="all">{H.allFields}</option>
              {fields.map((f) => <option key={f} value={f}>{fieldText(f, true)}</option>)}
            </select>
          </label>
        )}
        <p className="l-muted">{H.done}: {doneCount} {H.of} {shown.length}</p>
      </div>
      {shown.length === 0 && <div className="l-panel l-panel-hint" role="status">{H.empty}</div>}
      {hidden > 0 && <div className="l-panel l-panel-hint" role="status" data-testid="think-hidden">{H.notTranslated} ({hidden})</div>}
      <ul className="l-stack" style={{ listStyle: "none", padding: 0 }}>
        {shown.map(({ task }) => (
          <li key={task.id}>
            <button type="button" className="l-card" data-testid={`think-${task.id}`} style={{ textAlign: "left", width: "100%", cursor: "pointer", display: "block" }} onClick={() => router.push(href(`/think?task=${encodeURIComponent(task.id)}`))}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="l-muted" style={{ fontSize: 13 }}>{done[task.id] ? "✅ " : ""}{fieldText(fieldOf(task), false) ? `${fieldText(fieldOf(task), false)} · ` : ""}≈{task.minutes}{L.minutes}</div>
                <strong style={{ display: "block", fontSize: 18, lineHeight: 1.35 }}>{task.title}</strong>
                <div className="l-muted" style={{ lineHeight: 1.5 }}>{task.goal}</div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
