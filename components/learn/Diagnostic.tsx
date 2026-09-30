"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Placement } from "@/lib/learn/domain/diagnostic";
import type { EngineDelta, PlayerState, PublicQuestion } from "@/lib/learn/types";
import { useLearner } from "./LearnerProvider";
import { AnswerInput, ListenButton } from "./renderers";
import { MathBlock, RichText } from "./RichText";
import { SkillBars } from "./SkillBars";

interface StepResponse {
  lastCorrect: boolean | null;
  next: PublicQuestion | null;
  answered: number;
  total?: number;
  done: boolean;
  state?: PlayerState;
  delta?: EngineDelta;
  placement?: Placement;
}

/** Adaptive placement: gentle wording, no scores, ends in a skill map. */
export function Diagnostic() {
  const { api, t, href, site } = useLearner();
  const [phase, setPhase] = useState<"intro" | "loading" | "question" | "feedback" | "done" | "error">("intro");
  const [q, setQ] = useState<PublicQuestion | null>(null);
  const [value, setValue] = useState<string | string[]>("");
  const [history, setHistory] = useState<{ questionId: string; correct: boolean }[]>([]);
  const [total, setTotal] = useState(6);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [pending, setPending] = useState<StepResponse | null>(null);
  const [result, setResult] = useState<StepResponse | null>(null);
  const busy = useRef(false);

  const begin = async () => {
    setPhase("loading");
    try {
      const res = await api<StepResponse>("diagnostic", { history: [] });
      if (res.next) {
        setQ(res.next);
        setTotal(res.total ?? 6);
        setValue(res.next.type === "ordering" || res.next.type === "multiple_select" ? [] : "");
        setPhase("question");
      }
    } catch {
      setPhase("error");
    }
  };

  const submit = async () => {
    if (!q || busy.current) return;
    busy.current = true;
    try {
      const res = await api<StepResponse>("diagnostic", { history, answer: { questionId: q.id, value } });
      const correct = res.lastCorrect === true;
      setHistory((h) => [...h, { questionId: q.id, correct }]);
      setLastCorrect(correct);
      setPending(res);
      setPhase("feedback");
    } catch {
      setPhase("error");
    } finally {
      busy.current = false;
    }
  };

  const proceed = () => {
    if (!pending) return;
    if (pending.done) {
      setResult(pending);
      setPhase("done");
    } else if (pending.next) {
      setQ(pending.next);
      setValue(pending.next.type === "ordering" || pending.next.type === "multiple_select" ? [] : "");
      setPhase("question");
    }
  };

  if (phase === "intro" || phase === "loading") {
    return (
      <div className="l-wrap l-stack">
        <h1 className="l-h1">🧭 {t("diag.intro.title")}</h1>
        <p>{t("diag.intro.body")}</p>
        <button className="l-btn l-btn-block" onClick={begin} disabled={phase === "loading"}>{phase === "loading" ? t("diag.checking") : t("diag.start")}</button>
        <Link className="l-link" href={href("/dashboard")}>{t("diag.later")}</Link>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="l-wrap l-stack">
        <div className="l-panel l-panel-reveal" role="alert">{t("lesson.error")}</div>
        <button className="l-btn l-btn-block" onClick={() => (q ? setPhase("question") : begin())}>{t("lesson.error.retry")}</button>
        <Link className="l-link" href={href("/dashboard")}>{t("diag.later")}</Link>
      </div>
    );
  }

  if (phase === "done" && result) {
    const skillIds = Object.keys(result.state?.mastery ?? {});
    return (
      <div className="l-wrap l-stack">
        <div className="l-card l-card-accent l-pop">
          <h1 className="l-h1">🗺️ {t("diag.result.title")}</h1>
          <p>{t("diag.result.body")}</p>
        </div>
        <section className="l-card"><SkillBars skillIds={skillIds.length ? skillIds : undefined} /></section>
        {(result.delta?.xp ?? 0) > 0 && <p className="l-card" role="status">🎁 {t("diag.result.reward", { xp: result.delta?.xp ?? 0 })}</p>}
        {(result.placement?.placedOutLessonIds.length ?? 0) > 0 && <p className="l-muted">{t("diag.result.placed", { n: result.placement?.placedOutLessonIds.length ?? 0 })}</p>}
        <Link className="l-btn l-btn-block" href={href("/dashboard")}>▶ {t("diag.result.cta")}</Link>
      </div>
    );
  }

  if (!q) return null;
  const ready = Array.isArray(value) ? value.length > 0 && (q.type !== "ordering" || value.length === (q.options?.length ?? 0)) : value.trim().length > 0;

  return (
    <div className="l-wrap l-stack">
      <p className="l-muted" aria-live="polite">{t("diag.progress", { n: Math.min(history.length + 1, total), total })}</p>
      <div className="l-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={history.length}><span style={{ width: `${(history.length / total) * 100}%` }} /></div>
      <div className="l-card l-stack">
        <div className="l-qprompt"><RichText text={q.prompt} /></div>
        {q.latex && <MathBlock latex={q.latex} />}
        {q.audioText && site === "english" && <ListenButton text={q.audioText} />}
        <AnswerInput site={site} q={q} value={value} onChange={setValue} disabled={phase !== "question"} onSubmit={submit} />
      </div>
      {phase === "feedback" ? (
        <>
          <div className={`l-panel ${lastCorrect ? "l-panel-good" : "l-panel-hint"}`} role="status">{lastCorrect ? "✅ " + t("diag.good") : "🌱 " + t("diag.growth")}</div>
          <button className="l-btn l-btn-block" onClick={proceed}>{pending?.done ? t("diag.finish") : t("diag.next")}</button>
        </>
      ) : (
        <button className="l-btn l-btn-block" onClick={submit} disabled={!ready}>{t("lesson.check")}</button>
      )}
    </div>
  );
}
