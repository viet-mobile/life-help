"use client";

import { useRef, useState } from "react";
import type { EngineDelta, PlayerState, PublicQuestion } from "@/lib/learn/types";
import { ApiError, useLearner } from "./LearnerProvider";
import { AnswerInput, ListenButton } from "./renderers";
import { MathBlock, RichText } from "./RichText";

export interface AttemptResponse {
  correct: boolean;
  attemptNo: number;
  revealed: boolean;
  feedback: { hint?: string; hintLevel?: number; explanation?: string; answer?: string };
  followUp: PublicQuestion | null;
  delta: EngineDelta;
  state: PlayerState;
}

export interface QuestionOutcome {
  firstTry: boolean;
  revealed: boolean;
  followUp: PublicQuestion | null;
}

type QStatus = "answering" | "checking" | "wrong" | "correct" | "revealed";

/**
 * One question's interaction: answer -> server check -> hint ladder -> explanation.
 * Mounted with `key={question.id}` so all per-question state resets naturally.
 */
export function QuestionCard({
  q,
  sessionId,
  isReview,
  seenIds,
  label,
  isLast,
  onAttempt,
  onNext,
}: {
  q: PublicQuestion;
  sessionId: string;
  isReview: boolean;
  seenIds: string[];
  label: string;
  isLast: boolean;
  onAttempt: (res: AttemptResponse) => void;
  onNext: (outcome: QuestionOutcome) => void;
}) {
  const { api, t, site } = useLearner();
  const isMulti = q.type === "ordering" || q.type === "multiple_select";
  const [value, setValue] = useState<string | string[]>(isMulti ? [] : "");
  const [status, setStatus] = useState<QStatus>("answering");
  const [attempts, setAttempts] = useState(0);
  const [hints, setHints] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<AttemptResponse["feedback"]>({});
  const [followUp, setFollowUp] = useState<PublicQuestion | null>(null);
  const [floatXp, setFloatXp] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());
  const feedbackRef = useRef<HTMLDivElement>(null);

  const hasAnswer = Array.isArray(value)
    ? value.length > 0 && (q.type !== "ordering" || value.length === (q.options?.length ?? 0))
    : value.trim().length > 0;
  const resolved = status === "correct" || status === "revealed";
  const canHint = hints.length < 2 && !resolved;

  const submit = async () => {
    if (status === "checking" || resolved || !hasAnswer) return;
    setStatus("checking");
    setError(null);
    try {
      const res = await api<AttemptResponse>("attempt", {
        questionId: q.id,
        sessionId,
        answer: value,
        attemptNo: attempts + 1,
        hintsUsed: hints.length,
        timeMs: Date.now() - startedAt,
        isReview,
        seenIds,
      });
      onAttempt(res);
      setFeedback(res.feedback);
      if (res.correct) {
        setStatus("correct");
        setFloatXp(res.delta.xp);
        window.setTimeout(() => setFloatXp(null), 1000);
      } else if (res.revealed) {
        setStatus("revealed");
        setFollowUp(res.followUp);
      } else {
        setAttempts(res.attemptNo);
        setStatus("wrong");
        const hint = res.feedback.hint;
        if (hint && !hints.includes(hint)) setHints((h) => [...h, hint]);
        setValue(isMulti ? [] : "");
      }
      window.setTimeout(() => feedbackRef.current?.focus(), 30);
    } catch (e) {
      // Nothing was adopted from the failed request: progress is untouched.
      setStatus("answering");
      setError(e instanceof ApiError && e.code === "rate_limited" ? t("lesson.error") : t("lesson.error"));
    }
  };

  const askHint = async () => {
    try {
      const res = await api<{ hint: string; level: number }>("hint", { questionId: q.id, level: hints.length + 1 });
      setHints((h) => [...h, res.hint]);
    } catch {
      /* no more hints */
    }
  };

  return (
    <div className="l-stack">
      <p className="l-muted" aria-live="polite">{label} · {t("common.diff", { n: q.difficulty })}</p>

      <div className="l-card l-stack">
        <div className="l-qprompt"><RichText text={q.prompt} /></div>
        {q.latex && <MathBlock latex={q.latex} />}
        {q.audioText && site === "english" && <ListenButton text={q.audioText} />}
        <AnswerInput site={site} q={q} value={value} onChange={setValue} disabled={resolved || status === "checking"} onSubmit={submit} />
      </div>

      {error && <div className="l-panel l-panel-reveal" role="alert">{error}</div>}

      <div ref={feedbackRef} tabIndex={-1} aria-live="polite" className="l-stack">
        {status === "wrong" && (
          <div className="l-panel l-panel-hint">
            <div className="l-panel-title">💭 {attempts === 1 ? t("lesson.wrong.1") : t("lesson.wrong.2")}</div>
            {hints.map((h, k) => <p key={k}><RichText text={h} /></p>)}
          </div>
        )}
        {status === "correct" && (
          <div className="l-panel l-panel-good l-pop">
            <div className="l-panel-title">✅ {attempts > 0 ? t("lesson.correct.after") : t("lesson.correct")}</div>
            {feedback.explanation && <p><strong>{t("lesson.explain")}</strong> · <RichText text={feedback.explanation} /></p>}
            {floatXp ? <p className="l-rise" aria-hidden="true">{t("lesson.xp", { n: floatXp })}</p> : null}
          </div>
        )}
        {status === "revealed" && (
          <div className="l-panel l-panel-reveal">
            <div className="l-panel-title">🧭 {t("lesson.reveal")}</div>
            {feedback.answer && <p><strong>{t("lesson.answerIs")}</strong> · <RichText text={feedback.answer} /></p>}
            {feedback.explanation && <p><strong>{t("lesson.explain")}</strong> · <RichText text={feedback.explanation} /></p>}
          </div>
        )}
      </div>

      {status === "answering" && hints.length > 0 && (
        <div className="l-panel l-panel-hint">{hints.map((h, k) => <p key={k}><RichText text={h} /></p>)}</div>
      )}

      <div className="l-stack">
        {resolved ? (
          <button
            className="l-btn l-btn-block"
            onClick={() => onNext({ firstTry: status === "correct" && attempts === 0, revealed: status === "revealed", followUp })}
          >
            {status === "revealed" && followUp ? t("lesson.similar.go") : isLast ? t("lesson.finish") : t("lesson.next")}
          </button>
        ) : (
          <>
            <button className="l-btn l-btn-block" onClick={submit} disabled={!hasAnswer || status === "checking"}>
              {status === "wrong" ? t("lesson.retry") : t("lesson.check")}
            </button>
            <button className="l-btn l-btn-ghost l-btn-block" onClick={askHint} disabled={!canHint || status === "checking"}>
              💡 {canHint ? `${t("lesson.hint")} (${hints.length}/2)` : t("lesson.hint.none")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
