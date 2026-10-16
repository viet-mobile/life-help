"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { levelProgress } from "@/lib/learn/domain/level";
import { planNext, type ElectiveOption, type FlowPrefs } from "@/lib/learn/domain/flow";
import type { EngineDelta, PlayerState, PublicQuestion } from "@/lib/learn/types";
import { ApiError, useLearner } from "./LearnerProvider";
import { QuestionCard, type AttemptResponse, type QuestionOutcome } from "./QuestionCard";
import { PremiumGate } from "./PremiumGate";
import { useEnterToContinue } from "./useEnterToContinue";

interface StartResponse { sessionId: string; lessonId: string | null; premiumLocked: number; questions: PublicQuestion[] }
interface CompleteResponse { state: PlayerState; delta: EngineDelta; stars: number }
type Phase = "plan" | "loading" | "play" | "completing" | "advancing" | "choose" | "premium" | "end" | "stopped" | "error";

const electiveKey = (site: string) => `learn:flow:elective:${site}`;
const readElective = (site: string): string | null => { try { return window.localStorage.getItem(electiveKey(site)); } catch { return null; } };
const writeElective = (site: string, v: string) => { try { window.localStorage.setItem(electiveKey(site), v); } catch { /* storage unavailable: the choice is only remembered for this visit */ } };

/**
 * Continuous play. Lesson after lesson, grade after grade, with no stop in between: the next lesson starts as soon as the last question of
 * the previous one is answered (Enter = check / next), the finished lesson is only a line above the next question, and the learner leaves
 * with "stop" (a summary), never by being sent home. The only questions the flow asks are the elective subject (once the grade's own
 * lessons are done) and nothing else. Which lesson comes next is decided by lib/learn/domain/flow.ts; the lesson API is the normal one.
 */
export function FlowRunner() {
  const { api, index, t, href, state, site, access, ready } = useLearner();
  const params = useSearchParams();
  const sem = params.get("semester");
  const prefsRef = useRef<FlowPrefs>({ semester: sem === "1" ? 1 : sem === "2" ? 2 : null, unitId: params.get("unit"), elective: null });

  const [phase, setPhase] = useState<Phase>("plan");
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<StartResponse | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [queue, setQueue] = useState<PublicQuestion[]>([]);
  const [coreIds, setCoreIds] = useState<string[]>([]);
  const [i, setI] = useState(0);
  const [firstTryIds, setFirstTryIds] = useState<string[]>([]);
  const [options, setOptions] = useState<ElectiveOption[]>([]);
  const [banner, setBanner] = useState<string | null>(null);
  const [sum, setSum] = useState({ solved: 0, lessons: 0, xp: 0 });
  const startedFor = useRef<string | null>(null);

  const fail = useCallback((e: unknown) => {
    setError(e instanceof ApiError && (e.code === "no_questions") ? t("lesson.empty") : t("lesson.error"));
    setPhase("error");
  }, [t]);

  const begin = useCallback(async (id: string) => {
    setPhase("loading");
    try {
      const res = await api<StartResponse>("start", { kind: "lesson", lessonId: id });
      setSession(res); setLessonId(id); setQueue(res.questions); setCoreIds(res.questions.map((x) => x.id)); setI(0); setFirstTryIds([]);
      setPhase("play");
    } catch (e) {
      if (e instanceof ApiError && (e.code === "premium_required" || e.code === "premium_expired")) setPhase("premium");
      else fail(e);
    }
  }, [api, fail]);

  // Decide what comes next whenever the flow is "between lessons" (and again once a grade change has reached the context).
  useEffect(() => {
    if (!ready || phase !== "plan" || !state.profile) return;
    // the chosen subject is remembered; a "skip" only counts for the grade it was given in (the question comes back in the next grade that offers one)
    const saved = readElective(site);
    prefsRef.current.elective = saved === `skip:${state.profile.grade}` ? "skip" : saved && !saved.startsWith("skip:") ? saved : null;
    const step = planNext(state, index, prefsRef.current);
    if (step.kind === "lesson") {
      if (startedFor.current === step.lessonId + ":" + (state.lessons[step.lessonId]?.completions ?? 0)) return; // already started for this state
      startedFor.current = step.lessonId + ":" + (state.lessons[step.lessonId]?.completions ?? 0);
      void begin(step.lessonId);
    } else if (step.kind === "choose") { setOptions(step.options); setPhase("choose"); }
    else if (step.kind === "end") setPhase("end");
    else {
      setPhase("advancing");
      const p = state.profile;
      api("onboard", { nickname: p.nickname, grade: step.to, goal: p.goal, avatar: p.avatar }).then(() => setPhase("plan")).catch(fail);
    }
  }, [ready, phase, state, index, begin, api, fail]);

  const finishLesson = async (ids: string[]) => {
    if (!session || !lessonId) return;
    if (session.premiumLocked > 0) { setPhase("premium"); return; }
    setPhase("completing");
    try {
      const done = await api<CompleteResponse>("complete", { sessionId: session.sessionId, lessonId, firstTryCorrect: ids.length });
      const title = index.lessons.get(lessonId)?.lesson.title ?? "";
      setBanner(`✅ ${t("flow.cleared", { title })} ${"★".repeat(done.stars)}`);
      setSum((s) => ({ ...s, lessons: s.lessons + 1, xp: s.xp + done.delta.xp }));
      setPhase("plan");
    } catch (e) { fail(e); }
  };

  const onAttempt = (res: AttemptResponse) => setSum((s) => ({ ...s, xp: s.xp + res.delta.xp }));
  const onNext = (q: PublicQuestion, outcome: QuestionOutcome) => {
    const ids = outcome.firstTry && coreIds.includes(q.id) && !firstTryIds.includes(q.id) ? [...firstTryIds, q.id] : firstTryIds;
    setFirstTryIds(ids);
    setSum((s) => ({ ...s, solved: s.solved + 1 }));
    setBanner(null);
    let nextQueue = queue;
    if (outcome.revealed && outcome.followUp) { nextQueue = [...queue.slice(0, i + 1), outcome.followUp, ...queue.slice(i + 1)]; setQueue(nextQueue); }
    if (i + 1 >= nextQueue.length) void finishLesson(ids); else setI(i + 1);
  };

  useEnterToContinue(phase === "choose" && options.length === 1, () => pick(options[0].courseId));
  function pick(courseId: string) { writeElective(site, courseId); startedFor.current = null; setPhase("plan"); }
  function skipElective() { writeElective(site, `skip:${state.profile?.grade ?? ""}`); setPhase("plan"); }

  const Summary = () => (
    <p className="l-muted" data-testid="flow-summary">{t("flow.solved", { n: sum.solved, lessons: sum.lessons, xp: sum.xp })}</p>
  );

  if (phase === "premium") return <PremiumGate t={t} access={access} title={lessonId ? index.lessons.get(lessonId)?.lesson.title ?? "" : ""} backHref={href("/learn")} />;
  if (phase === "error") {
    return (
      <div className="l-wrap l-stack">
        <div className="l-panel l-panel-reveal" role="alert">{error ?? t("lesson.error")}</div>
        <button className="l-btn l-btn-block" onClick={() => { startedFor.current = null; setPhase("plan"); }}>{t("lesson.error.retry")}</button>
        <Link className="l-link" href={href("/dashboard")}>{t("result.home")}</Link>
      </div>
    );
  }
  if (phase === "choose") {
    return (
      <div className="l-wrap l-stack" data-testid="flow-elective">
        <h1 className="l-h1">{t("flow.elective.title")}</h1>
        <div className="l-stack">
          {options.map((o) => <button key={o.courseId} className="l-btn l-btn-block" data-testid={`elective-${o.courseId}`} onClick={() => pick(o.courseId)}>{o.title}</button>)}
          <button className="l-btn l-btn-ghost l-btn-block" onClick={skipElective}>{t("flow.elective.skip")}</button>
        </div>
        <Summary />
      </div>
    );
  }
  if (phase === "end" || phase === "stopped") {
    const level = levelProgress(state.totalXp);
    return (
      <div className="l-wrap l-stack" role="region" aria-label={t("result.title.session")}>
        <div className="l-card l-card-accent l-pop" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem" }} aria-hidden="true">{phase === "end" ? "🏆" : "🎯"}</div>
          <h1 className="l-h1">{phase === "end" ? t("flow.end") : t("result.title.session")}</h1>
          <Summary />
          <p className="l-muted">{t("dash.level")} {level.level}</p>
        </div>
        <Link className="l-btn l-btn-block" href={href("/dashboard")}>{t("result.home")}</Link>
        {phase === "stopped" && <button className="l-btn l-btn-ghost l-btn-block" onClick={() => { startedFor.current = null; setPhase("plan"); }}>{t("flow.start")}</button>}
      </div>
    );
  }

  const q = queue[i];
  if (phase !== "play" || !q || !session) {
    const grade = state.profile?.grade;
    return <div className="l-wrap" role="status" data-testid="flow-loading">{phase === "advancing" && grade ? t("flow.moving") : t("lesson.loading")}</div>;
  }

  const coreTotal = coreIds.length;
  const isFollow = !coreIds.includes(q.id);
  const progress = coreTotal ? Math.min(100, Math.round((firstTryIds.length / coreTotal) * 100)) : 0;
  const lesson = lessonId ? index.lessons.get(lessonId)?.lesson : undefined;
  const label = isFollow ? t("lesson.similar") : lesson?.challengeId === q.id ? `⭐ ${t("lesson.challenge")}` : t("lesson.question", { n: Math.min(coreIds.indexOf(q.id) + 1, coreTotal), total: coreTotal });

  return (
    <div className="l-wrap l-stack" data-testid="flow-play">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="l-link" data-testid="flow-stop" onClick={() => setPhase("stopped")} aria-label={t("flow.stop")}>✕ {t("flow.stop")}</button>
        <div className="l-bar" style={{ flex: 1 }} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>
      </div>
      <p className="l-muted" data-testid="flow-where">{state.profile ? t(`grade.${state.profile.grade}` as never) : ""} · {lesson?.title}</p>
      {banner && <div className="l-panel l-panel-good l-pop" role="status" data-testid="flow-banner">{banner}</div>}
      <QuestionCard key={q.id} q={q} sessionId={session.sessionId} isReview={false} seenIds={queue.map((x) => x.id)} label={label} isLast={i + 1 >= queue.length} onAttempt={onAttempt} onNext={(o) => onNext(q, o)} />
      <Summary />
    </div>
  );
}
