"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { buildPath } from "@/lib/learn/domain/path";
import { levelProgress } from "@/lib/learn/domain/level";
import type { EngineDelta, PlayerState, PublicQuestion } from "@/lib/learn/types";
import { ApiError, useLearner } from "./LearnerProvider";
import { QuestionCard, type AttemptResponse, type QuestionOutcome } from "./QuestionCard";
import { RichText } from "./RichText";
import { ListeningPanel } from "./Listening";
import { exampleSegments } from "@/lib/learn/listen/segments";
import { ResultScreen, type SessionResult } from "./ResultScreen";

type Kind = "lesson" | "review" | "practice";
interface StartResponse {
  sessionId: string;
  kind: Kind;
  lessonId: string | null;
  questions: PublicQuestion[];
}
interface CompleteResponse {
  state: PlayerState;
  delta: EngineDelta;
  stars: number;
  accuracy: number;
}

interface Totals {
  xp: number;
  coins: number;
  achievements: string[];
  quest: boolean;
}

export function LessonRunner({ kind, lessonId, skillId }: { kind: Kind; lessonId?: string; skillId?: string }) {
  const { api, index, t, href, state, site } = useLearner();
  const lesson = lessonId ? index.lessons.get(lessonId) : undefined;

  const [phase, setPhase] = useState<"intro" | "loading" | "play" | "finishing" | "result" | "error">("intro");
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<StartResponse | null>(null);
  const [queue, setQueue] = useState<PublicQuestion[]>([]);
  const [coreIds, setCoreIds] = useState<string[]>([]);
  const [i, setI] = useState(0);
  const [firstTryIds, setFirstTryIds] = useState<string[]>([]);
  const [totals, setTotals] = useState<Totals>({ xp: 0, coins: 0, achievements: [], quest: false });
  const [startLevel, setStartLevel] = useState(1);
  const [result, setResult] = useState<SessionResult | null>(null);

  const fail = useCallback(
    (e: unknown) => {
      if (e instanceof ApiError && e.code === "lesson_locked") setError(t("lesson.locked"));
      else if (e instanceof ApiError && (e.code === "nothing_to_review" || e.code === "no_questions")) setError(t("lesson.empty"));
      else setError(t("lesson.error"));
    },
    [t],
  );

  const start = async () => {
    setPhase("loading");
    setError(null);
    try {
      const res = await api<StartResponse>("start", { kind, lessonId, skillId });
      setSession(res);
      setQueue(res.questions);
      setCoreIds(res.questions.map((x) => x.id));
      setI(0);
      setFirstTryIds([]);
      setTotals({ xp: 0, coins: 0, achievements: [], quest: false });
      setStartLevel(levelProgress(state.totalXp).level);
      setResult(null);
      setPhase("play");
    } catch (e) {
      fail(e);
      setPhase("error");
    }
  };

  const onAttempt = (res: AttemptResponse) =>
    setTotals((tt) => ({
      xp: tt.xp + res.delta.xp,
      coins: tt.coins + res.delta.coins,
      achievements: [...tt.achievements, ...res.delta.newAchievements],
      quest: tt.quest || res.delta.questCompleted,
    }));

  const finish = async (ids: string[], sums: Totals) => {
    if (!session) return;
    setPhase("finishing");
    try {
      let finalState: PlayerState | null = null;
      let stars = 0;
      const acc = { ...sums, achievements: [...sums.achievements] };
      if (kind === "lesson" && lessonId) {
        const done = await api<CompleteResponse>("complete", { sessionId: session.sessionId, lessonId, firstTryCorrect: ids.length });
        acc.xp += done.delta.xp;
        acc.coins += done.delta.coins;
        acc.achievements.push(...done.delta.newAchievements);
        acc.quest ||= done.delta.questCompleted;
        finalState = done.state ?? null;
        stars = done.stars;
      }
      setResult({
        kind,
        lessonId: lessonId ?? null,
        stars,
        firstTryCorrect: ids.length,
        total: coreIds.length,
        xp: acc.xp,
        coins: acc.coins,
        achievements: [...new Set(acc.achievements)],
        questCompleted: acc.quest,
        levelBefore: startLevel,
        finalState,
      });
      setPhase("result");
    } catch (e) {
      fail(e);
      setPhase("error");
    }
  };

  const onNext = (q: PublicQuestion, outcome: QuestionOutcome) => {
    const ids = outcome.firstTry && coreIds.includes(q.id) && !firstTryIds.includes(q.id) ? [...firstTryIds, q.id] : firstTryIds;
    setFirstTryIds(ids);
    let nextQueue = queue;
    if (outcome.revealed && outcome.followUp) {
      nextQueue = [...queue.slice(0, i + 1), outcome.followUp, ...queue.slice(i + 1)];
      setQueue(nextQueue);
    }
    if (i + 1 >= nextQueue.length) void finish(ids, totals);
    else setI(i + 1);
  };

  const nextLesson = useMemo(() => {
    if (!result?.finalState) return null;
    const node = buildPath(result.finalState, index).find((n) => n.status === "current");
    return node ? index.lessons.get(node.lessonId)?.lesson ?? null : null;
  }, [result, index]);

  if (phase === "result" && result) return <ResultScreen result={result} nextLesson={nextLesson} onAgain={start} />;

  if (phase === "error") {
    return (
      <div className="l-wrap l-stack">
        <div className="l-panel l-panel-reveal" role="alert">{error ?? t("lesson.error")}</div>
        <button className="l-btn l-btn-block" onClick={() => (session ? void finish(firstTryIds, totals) : void start())}>
          {t("lesson.error.retry")}
        </button>
        <Link className="l-link" href={href("/dashboard")}>{t("result.home")}</Link>
      </div>
    );
  }

  if (phase === "intro" || phase === "loading") {
    return (
      <div className="l-wrap l-stack">
        <Link className="l-link" href={href(kind === "lesson" ? "/learn" : "/dashboard")}>← {t("lesson.exit")}</Link>
        {lesson ? (
          <>
            <h1 className="l-h1">{lesson.lesson.title}</h1>
            <section className="l-card l-stack" aria-labelledby="concept-h">
              <h2 id="concept-h" className="l-h2">💡 {t("lesson.concept")}</h2>
              <p><RichText text={lesson.lesson.concept} /></p>
            </section>
            <section className="l-card l-stack" aria-labelledby="example-h">
              <h2 id="example-h" className="l-h2">✏️ {t("lesson.example")}</h2>
              <p><RichText text={lesson.lesson.example} /></p>
              {site === "english" && <ListeningPanel scope={`ex-${lesson.lesson.id}`} variant="list" segments={exampleSegments(`ex-${lesson.lesson.id}`, lesson.lesson.example)} lesson={{ id: lesson.lesson.id, title: lesson.lesson.title }} />}
            </section>
          </>
        ) : (
          <h1 className="l-h1">{kind === "review" ? t("dash.continue.review") : t("dash.recommended")}</h1>
        )}
        <button className="l-btn l-btn-block" onClick={start} disabled={phase === "loading"}>
          {phase === "loading" ? t("lesson.loading") : t("lesson.begin")}
        </button>
      </div>
    );
  }

  const q = queue[i];
  if (phase === "finishing" || !q || !session) return <div className="l-wrap" role="status">{t("lesson.loading")}</div>;

  const coreTotal = coreIds.length;
  const isFollow = !coreIds.includes(q.id);
  const progress = coreTotal ? Math.min(100, Math.round((firstTryIds.length / coreTotal) * 100)) : 0;
  const label = isFollow
    ? t("lesson.similar")
    : kind === "review"
      ? t("lesson.review")
      : lesson?.lesson.challengeId === q.id
        ? `⭐ ${t("lesson.challenge")}`
        : t("lesson.question", { n: Math.min(coreIds.indexOf(q.id) + 1, coreTotal), total: coreTotal });

  return (
    <div className="l-wrap l-stack">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          className="l-link"
          onClick={() => {
            if (window.confirm(t("lesson.exit.confirm"))) window.location.assign(href("/dashboard"));
          }}
          aria-label={t("lesson.exit")}
        >
          ✕
        </button>
        <div className="l-bar" style={{ flex: 1 }} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
      <QuestionCard
        key={q.id}
        q={q}
        sessionId={session.sessionId}
        isReview={kind === "review"}
        seenIds={queue.map((x) => x.id)}
        label={label}
        isLast={i + 1 >= queue.length}
        onAttempt={onAttempt}
        onNext={(o) => onNext(q, o)}
      />
    </div>
  );
}
