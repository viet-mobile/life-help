"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FILE_META, TASK_LOADERS } from "@/lib/think/data/assets-index";
import { domainOf } from "@/lib/think/domains";
import { fieldInfo, fieldKeyOf, fieldList } from "@/lib/think/areas";
import { hasThinkSemesters, inSemester, thinkSemesterOf } from "@/lib/think/semesters";
import { gradeLabel, formatMinutes } from "@/lib/think/grades";
import { BOSS_TEXT, addTrophy, bossKey, bossKeyOf, bossProgress, finalBossFor, isFinalBoss, readTrophies, type Trophy } from "@/lib/think/bosses";
import { KOREAN_LEVELS, isKoreanFirst, isLevelCode, koreanLevelOf, levelCode, levelFromCode, levelName, priorLevelFor } from "@/lib/think/korean-levels";
import { LANG_NAMES, TASK_LANG_NAMES, taskLangFor, thinkLangFor, type TaskLang, type ThinkLang } from "@/lib/think/lang";
import { checksOffFor, loadOverlay, loadOverlays, localize, localizeFor, mergeBilingual } from "@/lib/think/localize";
import { siteConfig } from "@/lib/learn/sites";
import { schoolLevel, type Grade } from "@/lib/learn/types";
import type { ThinkTask } from "@/lib/think/types";
import { useLearner } from "../learn/LearnerProvider";
import { flowKey, taskCompleted } from "@/lib/think/flow";
import { ELECTIVE_NAMES, hubLabels } from "./hubLabels";
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
  const { site, state, locale, isBilingual: globalIsBilingual, secondaryLocales, secondaryTranslators, href, ready, t } = useLearner();
  const router = useRouter();
  const params = useSearchParams();
  const ownGrade = (state.profile?.grade ?? siteConfig(site).levels[0]) as string;
  const own = site === "korean" ? levelCode(priorLevelFor(ownGrade)) : ownGrade;
  const [grade, setGrade] = useState<string>(params.get("grade") || own);
  const [field, setField] = useState<string>(params.get("field") || "all");
  const [semester, setSemester] = useState<string>(params.get("semester") === "1" || params.get("semester") === "2" ? (params.get("semester") as string) : "all");
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [tasks, setTasks] = useState<ThinkTask[]>([]);
  const [overlay, setOverlay] = useState<Record<string, Record<string, string>>>({});
  const [overlayFb, setOverlayFb] = useState<Record<string, Record<string, string>>>({}); // English fallback for languages outside the six
  const [overlayKo, setOverlayKo] = useState<Record<string, Record<string, string>>>({}); // Korean version of the Korean-subject tasks (level 4+ shows it first)
  const [bilingual, setBilingual] = useState(false);
  const [secOverlays, setSecOverlays] = useState<Array<{ lang: string; primary: any; fallback: any }>>([]);
  useEffect(() => { try { setBilingual(window.localStorage.getItem("learn:think:bilingual") === "1"); } catch { /* storage unavailable */ } }, []);
  const [done, setDone] = useState<Record<string, string>>({});
  const [trophies, setTrophies] = useState<Record<string, Trophy>>({});
  const [won, setWon] = useState(false);
  const lang: ThinkLang = thinkLangFor(locale, site); // language of the screen text
  const taskLang = taskLangFor(locale); // language the task text is shown in when it is fully translated (else English, see localizeFor)
  const H = hubLabels(t);
  const L = labels(lang);
  const open = params.get("task");

  // the learner's own grade / level is the default only until they pick one (or arrive with ?grade=): opening a task changes the URL (?task=) and must not reset the list
  const startedWithGrade = useRef(!!params.get("grade"));
  useEffect(() => { if (!startedWithGrade.current) setGrade(own); }, [own]);
  // a task opened by link (?task=) that belongs to another Korean level: switch to that level so it can open
  useEffect(() => { if (site === "korean" && open) { const n = koreanLevelOf(open); if (n && levelCode(n) !== grade) setGrade(levelCode(n)); } }, [site, open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setDone(readDone(site)); setTrophies(readTrophies(site)); }, [site]);
  useEffect(() => {
    let live = true;
    setTasks([]); setOverlay({}); setOverlayFb({}); setOverlayKo({}); setLoadError(false); setLoading(true);
    const isElective = grade.startsWith("EL-");
    const level = site === "korean" ? levelFromCode(grade) : null; // Korean: tasks are grouped by language level (1-6급), whatever step they were written for
    const metas = FILE_META.filter((m) => m.subject === site && (level ? true : m.grades.includes(grade) || (!isElective && m.grades.length === 0)));
    void Promise.all(metas.map((m) => TASK_LOADERS[m.key]())).then(async (lists) => {
      const seen = new Set<string>();
      const all = lists.flat().filter((t) => {
        if (!t || seen.has(t.id)) return false;
        seen.add(t.id);
        return level ? koreanLevelOf(t.id) === level : t.grade ? t.grade === grade : !isElective && t.level === bandOf(grade);
      });
      const o = await loadOverlays(taskLang, metas.map((m) => m.key));
      const ok = site === "korean" && lang !== "ko" ? await loadOverlay("ko", metas.map((m) => m.key)) : {};
      const rawSecLangs = (secondaryLocales ?? []).map((loc) => taskLangFor(loc));
      if (rawSecLangs.length === 0 && (bilingual || globalIsBilingual)) {
        if (site === "math" && taskLang !== "ko") rawSecLangs.push("ko");
        else if (site === "korean" && taskLang !== "en") rawSecLangs.push("en");
      }
      const secLangs = [...new Set(rawSecLangs)].filter((l) => l !== taskLang);
      const secLoaded = await Promise.all(
        secLangs.map(async (sl) => {
          const so = await loadOverlays(sl, metas.map((m) => m.key));
          return { lang: sl, primary: so.primary, fallback: so.fallback };
        })
      );
      if (live) { setTasks(all); setOverlay(o.primary); setOverlayFb(o.fallback); setOverlayKo(ok); setSecOverlays(secLoaded); setLoading(false); }
    }).catch(() => { if (live) { setLoadError(true); setLoading(false); } });
    return () => { live = false; };
  }, [site, grade, lang, taskLang, retry, secondaryLocales, bilingual, globalIsBilingual]);

  const everything = useMemo(() => tasks.map((t) => localizeFor(t, taskLang, { primary: overlay, fallback: overlayFb })), [tasks, taskLang, overlay, overlayFb]);
  // Only tasks fully available in the learner's language are listed or opened; the others are counted and explained, never shown half-translated.
  const localized = useMemo(() => everything.filter((x) => x.translated), [everything]);
  const hidden = everything.length - localized.length;
  // Math: four curriculum areas; English / Korean: six fields (lib/think/areas.ts). A task that fits none is listed under "all" only. Other sites: topic / skill.
  const fieldOf = (t: (typeof tasks)[number]): string | null => (fieldList(site).length ? fieldKeyOf(site, t.id) : (t.topic ?? domainOf(t)));
  const fields = useMemo(() => (fieldList(site).length ? fieldList(site).filter((a) => localized.some((x) => fieldKeyOf(site, x.task.id) === a)) : [...new Set(localized.map((x) => x.task.topic ?? domainOf(x.task)))]), [localized, site]);
  const fieldText = (k: string | null, full: boolean) => (k && fieldList(site).length ? fieldInfo(site, k, taskLang)[full ? "full" : "short"] : k ?? "");
  const semesterOn = hasThinkSemesters(site) && !grade.startsWith("EL-");
  const bySemester = localized.filter((x) => !semesterOn || inSemester(x.task.id, semester));
  const fieldNow = fields.includes(field) ? field : "all"; // a ?field= that this grade has no tasks for falls back to all
  const filtered = bySemester.filter((x) => !isFinalBoss(x.task.id) && (fieldNow === "all" || fieldOf(x.task) === fieldNow));
  const shown = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aSem = thinkSemesterOf(a.task.id);
      const bSem = thinkSemesterOf(b.task.id);
      const aExact = a.task.grade === grade ? 1 : 0;
      const bExact = b.task.grade === grade ? 1 : 0;

      const rank = (exact: number, sem: number): number => {
        if (semester === "1" || semester === "2") {
          const target = Number(semester);
          if (exact && sem === target) return 0;
          if (exact && sem === 0) return 1;
          if (!exact && sem === target) return 2;
          return 3;
        } else {
          if (exact && sem === 1) return 0;
          if (exact && sem === 2) return 1;
          if (exact && sem === 0) return 2;
          return 3;
        }
      };

      return rank(aExact, aSem) - rank(bExact, bSem);
    });
  }, [filtered, grade, semester]);
  const BT = BOSS_TEXT[lang];
  // final bosses of the chosen grade / semester(s) / level, only those fully available in this language
  const bossSlots = (grade.startsWith("EL-") ? [] : site === "korean" ? [bossKey(site, grade, 1)] : semester === "all" ? [bossKey(site, grade, 1), bossKey(site, grade, 2)] : [bossKey(site, grade, Number(semester) as 1 | 2)])
    .map((key) => ({ key, task: localized.find((x) => x.task.id === finalBossFor(key))?.task })).filter((b) => b.task);
  const slotName = (key: string) => (site === "korean" ? levelName(Number(key.split("L")[1]), lang) : `${gradeLabel(key.split("|")[1], taskLang)} ${t(`semester.${key.split("|")[2]}` as never)}`);
  const current = open ? localized.find((x) => x.task.id === open) : undefined;
  const grades = site === "korean" ? KOREAN_LEVELS.map(levelCode) : [...siteConfig(site).levels, ...(site === "math" ? Object.keys(ELECTIVE_NAMES) : [])];
  const gradeName = (g: string) => (g.startsWith("EL-") ? ELECTIVE_NAMES[g][lang] : g);

  if (!ready) return <div className="l-wrap" role="status">…</div>;
  const loadMap: Record<string, [string, string, string]> = {
    ko: ["과제를 불러오는 중…", "과제를 불러오지 못했어요.", "다시 시도"],
    en: ["Loading tasks…", "Could not load tasks.", "Try again"],
    vi: ["Đang tải bài tập…", "Không thể tải bài tập.", "Thử lại"],
    ja: ["課題を読み込み中…", "課題を読み込めませんでした。", "再試行"],
    "zh-Hans": ["正在加载任务…", "无法加载任务。", "重试"],
    "zh-Hant": ["正在載入任務…", "無法載入任務。", "重試"],
  };
  const loadText = loadMap[lang] ?? loadMap.en;
  if (loadError) return <div className="l-wrap" role="alert"><p>{loadText[1]}</p><button className="l-btn" onClick={() => setRetry(n => n + 1)}>{loadText[2]}</button></div>;
  if (loading) return <div className="l-wrap" role="status">{loadText[0]}</div>;
  // "next challenge": the next not-yet-tried task of the list the learner is looking at (this grade / semester / field), else any other untried one
    const isMulti = globalIsBilingual || bilingual;
  const getSecTasks = (tTask: ThinkTask) => {
    if (!isMulti || secOverlays.length === 0) return [];
    const raw = tasks.find((t) => t.id === tTask.id) ?? tTask;
    return secOverlays
      .map((so) => ({ lang: so.lang, loc: localizeFor(raw, so.lang, { primary: so.primary, fallback: so.fallback }) }))
      .filter((x) => x.loc.translated && x.loc.task.title !== tTask.title);
  };
  const order = shown.map((x) => x.task.id);
  const nextId = current ? (order.slice(order.indexOf(current.task.id) + 1).find((id) => !done[id]) ?? order.find((id) => id !== current.task.id && !done[id]) ?? null) : null;
  if (current) {
    // Korean level 4+: the instructions are shown in Korean (reading them is practice); the learner's language can be shown beside them
    const raw = tasks.find((t) => t.id === current.task.id);
    const koItem = site === "korean" && lang !== "ko" && raw && isKoreanFirst(raw.id) ? localize(raw, "ko", overlayKo) : null;
    const koFirst = !!koItem?.translated;
    const playTask = koFirst ? ((bilingual || globalIsBilingual) ? mergeBilingual(koItem!.task, current.task) : koItem!.task) : current.task;
    let finalTask = playTask;
    if (!koFirst && raw && (bilingual || globalIsBilingual) && secOverlays.length > 0) {
      for (const sec of secOverlays) {
        const secLoc = localizeFor(raw, sec.lang, { primary: sec.primary, fallback: sec.fallback });
        if (secLoc.translated) {
          finalTask = mergeBilingual(finalTask, secLoc.task);
        }
      }
    }
    return (
      <div className="l-wrap l-stack" data-testid="think-player" style={{ whiteSpace: "pre-line" }}>
        {koFirst && (
          <div className="l-panel l-panel-hint" data-testid="korean-first-bar" style={{ whiteSpace: "normal" }}>
            <p>{t("think.hub.koFirst.note")}</p>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 8, fontWeight: 700 }}>
              <input type="checkbox" data-testid="bilingual-toggle" checked={bilingual} onChange={(e) => { setBilingual(e.target.checked); try { window.localStorage.setItem("learn:think:bilingual", e.target.checked ? "1" : "0"); } catch { /* storage unavailable */ } }} />
              {t("think.hub.koFirst.toggle", { name: TASK_LANG_NAMES[current.lang as TaskLang] ?? LANG_NAMES[lang] })}
            </label>
          </div>
        )}
        <TaskPlayer key={`${current.task.id}:${current.lang}`} task={finalTask} lang={lang} checksOff={checksOffFor(playTask, current.lang)} reviewer={false}
          onBack={() => router.push(href("/think"))} onNext={nextId ? () => router.push(href(`/think?task=${encodeURIComponent(nextId)}`)) : undefined} onFlag={() => undefined}
          onComplete={() => { const d = { ...readDone(site), [current.task.id]: new Date().toISOString() }; writeDone(site, d); setDone(d); try { window.localStorage.setItem(flowKey(site), JSON.stringify(taskCompleted(readLedger(site), current.task.id))); } catch { /* storage unavailable */ } if (isFinalBoss(current.task.id)) { addTrophy(site, current.task.id); setTrophies(readTrophies(site)); setWon(true); } }} />
      </div>
    );
  }
  const doneCount = shown.filter((x) => done[x.task.id]).length;
  return (
    <div className="l-wrap l-wrap-wide l-stack" data-testid="think-hub">
      <h1 className="l-h1">
        <div>🧠 {H.title}</div>
        {isMulti && secondaryTranslators && secondaryTranslators.length > 0 && secondaryTranslators.map(({ locale: secLoc, t: secT }) => (
          <div key={secLoc} style={{ fontSize: "0.75em", fontWeight: 400, opacity: 0.85, marginTop: "0.2rem" }}>
            🧠 {hubLabels(secT).title}
          </div>
        ))}
      </h1>
      <p className="l-muted">
        <span>{H.intro}</span>
        {isMulti && secondaryTranslators && secondaryTranslators.length > 0 && secondaryTranslators.map(({ locale: secLoc, t: secT }) => (
          <span key={secLoc} style={{ display: "block", fontSize: "0.9em", opacity: 0.85, marginTop: "0.2rem" }}>
            {hubLabels(secT).intro}
          </span>
        ))}
      </p>
      <div className="l-card l-stack">
        <label className="l-stack" style={{ gap: 4 }}>
          <span className="l-muted">
            {H.grade}
            {isMulti && secondaryTranslators && secondaryTranslators.length > 0 && ` (${secondaryTranslators.map((s) => hubLabels(s.t).grade).join(" / ")})`}
          </span>
          <select className="l-input" data-testid="think-grade" value={grade} onChange={(e) => { setGrade(e.target.value); setField("all"); }}>
            {grades.map((g) => {
              const pri = g.startsWith("EL-") ? `${H.electives}: ${gradeName(g)}` : isLevelCode(g) ? levelName(Number(g.slice(1)), lang) : gradeLabel(g, taskLang);
              const sec = isMulti && secondaryTranslators && secondaryTranslators.length > 0
                ? " / " + secondaryTranslators.map((s) => {
                    const secLang = thinkLangFor(s.locale, site);
                    const secTaskLang = taskLangFor(s.locale);
                    return g.startsWith("EL-") ? `${hubLabels(s.t).electives}: ${ELECTIVE_NAMES[g as keyof typeof ELECTIVE_NAMES]?.[secLang] ?? gradeName(g)}` : isLevelCode(g) ? levelName(Number(g.slice(1)), secLang) : gradeLabel(g, secTaskLang);
                  }).join(" / ")
                : "";
              return <option key={g} value={g}>{pri}{sec}</option>;
            })}
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
            <span className="l-muted">
              {H.field}
              {isMulti && secondaryTranslators && secondaryTranslators.length > 0 && ` (${secondaryTranslators.map((s) => hubLabels(s.t).field).join(" / ")})`}
            </span>
            <select className="l-input" data-testid="think-field" value={fieldNow} onChange={(e) => setField(e.target.value)}>
              <option value="all">
                {H.allFields}
                {isMulti && secondaryTranslators && secondaryTranslators.length > 0 && ` (${secondaryTranslators.map((s) => hubLabels(s.t).allFields).join(" / ")})`}
              </option>
              {fields.map((f) => {
                const pri = fieldText(f, true);
                const sec = isMulti && secondaryTranslators && secondaryTranslators.length > 0
                  ? " / " + secondaryTranslators.map((s) => {
                      const secTaskLang = taskLangFor(s.locale);
                      return f && fieldList(site).length ? fieldInfo(site, f, secTaskLang).full : f;
                    }).join(" / ")
                  : "";
                return <option key={f} value={f}>{pri}{sec}</option>;
              })}
            </select>
          </label>
        )}
        <p className="l-muted">{H.done}: {doneCount} {H.of} {shown.length}</p>
      </div>
      {(bossSlots.length > 0 || Object.keys(trophies).length > 0) && (
        <section className="l-card l-stack" data-testid="think-boss" aria-labelledby="boss-h" style={{ borderColor: "var(--l-accent)" }}>
          <h2 id="boss-h" className="l-h2">
            <div>👑 {BT.final}</div>
            {isMulti && secondaryTranslators && secondaryTranslators.length > 0 && secondaryTranslators.map(({ locale: secLoc }) => {
              const secLang = thinkLangFor(secLoc, site);
              const secBT = BOSS_TEXT[secLang] ?? BOSS_TEXT.en;
              return (
                <div key={secLoc} style={{ fontSize: "0.8em", fontWeight: 400, opacity: 0.85, marginTop: "0.15rem" }}>
                  👑 {secBT.final}
                </div>
              );
            })}
          </h2>
          {won && <div className="l-panel l-panel-hint" role="status" data-testid="boss-reward">🏆 {BT.reward}</div>}
          {bossSlots.map(({ key, task }) => {
            const prog = bossProgress(key, state.lessons ?? {});
            const beaten = trophies[key];
            const secList = getSecTasks(task!);
            return (
              <button key={key} type="button" className="l-card" disabled={!prog.open} data-testid={`boss-${key}`} data-state={beaten ? "defeated" : prog.open ? "open" : "locked"}
                style={{ textAlign: "left", width: "100%", cursor: prog.open ? "pointer" : "not-allowed", opacity: prog.open ? 1 : 0.65, display: "block" }}
                onClick={() => router.push(href(`/think?task=${encodeURIComponent(task!.id)}`))}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div className="l-muted" style={{ fontSize: 13 }}>
                    <div>{beaten ? `✅ ${BT.defeated} · ` : prog.open ? "⚔️ " : "🔒 "}{slotName(key)}</div>
                    {isMulti && secondaryTranslators && secondaryTranslators.length > 0 && secondaryTranslators.map(({ locale: secLoc, t: secT }) => {
                      const secLang = thinkLangFor(secLoc, site);
                      const secBT = BOSS_TEXT[secLang] ?? BOSS_TEXT.en;
                      const secTaskLang = taskLangFor(secLoc);
                      const secSlot = site === "korean" ? levelName(Number(key.split("L")[1]), secLang) : `${gradeLabel(key.split("|")[1], secTaskLang)} ${secT(`semester.${key.split("|")[2]}` as never)}`;
                      return (
                        <div key={secLoc} style={{ fontSize: "0.9em", opacity: 0.85 }}>
                          {beaten ? `✅ ${secBT.defeated} · ` : prog.open ? "⚔️ " : "🔒 "}{secSlot}
                        </div>
                      );
                    })}
                  </div>
                  <strong style={{ display: "block", fontSize: 18, lineHeight: 1.35 }}>
                    <div>{task!.title}</div>
                    {isMulti && secList.map((st, i) => (
                      <div key={i} className="text-sm font-semibold text-slate-600 mt-0.5">
                        {st.loc.task.title}
                      </div>
                    ))}
                  </strong>
                  <div className="l-muted" style={{ lineHeight: 1.5 }}>
                    <div>{beaten ? BT.title(slotName(key)) : prog.open ? BT.open : BT.locked(prog.done, prog.total)}</div>
                    {isMulti && secondaryTranslators && secondaryTranslators.length > 0 && secondaryTranslators.map(({ locale: secLoc, t: secT }) => {
                      const secLang = thinkLangFor(secLoc, site);
                      const secBT = BOSS_TEXT[secLang] ?? BOSS_TEXT.en;
                      const secTaskLang = taskLangFor(secLoc);
                      const secSlot = site === "korean" ? levelName(Number(key.split("L")[1]), secLang) : `${gradeLabel(key.split("|")[1], secTaskLang)} ${secT(`semester.${key.split("|")[2]}` as never)}`;
                      return (
                        <div key={secLoc} style={{ fontSize: "0.85em", opacity: 0.85 }}>
                          {beaten ? secBT.title(secSlot) : prog.open ? secBT.open : secBT.locked(prog.done, prog.total)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </button>
            );
          })}
          {Object.keys(trophies).length > 0 && (
            <div data-testid="boss-trophies" className="l-muted"><strong>🏆 {BT.trophies} ({Object.keys(trophies).length})</strong>{" "}{Object.keys(trophies).sort().map((k) => slotName(k)).join(" · ")}</div>
          )}
        </section>
      )}
      {shown.length === 0 && <div className="l-panel l-panel-hint" role="status">{H.empty}</div>}
      {hidden > 0 && <div className="l-panel l-panel-hint" role="status" data-testid="think-hidden">{H.notTranslated} ({hidden})</div>}
      <ul className="l-stack" style={{ listStyle: "none", padding: 0 }}>
        {shown.map(({ task }) => {
          const secList = getSecTasks(task);
          return (
            <li key={task.id}>
              <button type="button" className="l-card" data-testid={`think-${task.id}`} style={{ textAlign: "left", width: "100%", cursor: "pointer", display: "block" }} onClick={() => router.push(href(`/think?task=${encodeURIComponent(task.id)}`))}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div className="l-muted" style={{ fontSize: 13 }}>
                    <div>
                      {done[task.id] ? "✅ " : ""}{fieldText(fieldOf(task), false) ? `${fieldText(fieldOf(task), false)} · ` : ""}{formatMinutes(task.minutes, taskLang, true)}
                    </div>
                    {isMulti && secondaryTranslators && secondaryTranslators.length > 0 && secondaryTranslators.map(({ locale: secLoc }) => {
                      const secTaskLang = taskLangFor(secLoc);
                      const fKey = fieldOf(task);
                      const secField = fKey ? fieldInfo(site, fKey, secTaskLang).short : "";
                      return (
                        <div key={secLoc} style={{ fontSize: "0.85em", opacity: 0.85 }}>
                          {done[task.id] ? "✅ " : ""}{secField ? `${secField} · ` : ""}{formatMinutes(task.minutes, secTaskLang, true)}
                        </div>
                      );
                    })}
                  </div>
                  <strong style={{ display: "block", fontSize: 18, lineHeight: 1.35 }}>
                    <div>{task.title}</div>
                    {isMulti && secList.map((st, i) => (
                      <div key={i} className="text-sm font-semibold text-slate-600 mt-0.5">
                        {st.loc.task.title}
                      </div>
                    ))}
                  </strong>
                  <div className="l-muted" style={{ lineHeight: 1.5 }}>
                    <div>{task.goal}</div>
                    {isMulti && secList.map((st, i) => (
                      <div key={i} className="text-xs text-slate-500 mt-0.5">
                        {st.loc.task.goal}
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
