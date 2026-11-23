"use client";

import { formatPrompt } from "@/lib/learn/promptFormat";
import { FigureView } from "./FigureView";
import { useMemo, useRef, useState } from "react";
import type { EngineDelta, PlayerState, PublicQuestion } from "@/lib/learn/types";
import { ApiError, useLearner } from "./LearnerProvider";
import { AnswerInput, ListenButton, TargetBlock } from "./renderers";
import { PronTip } from "./PronTip";
import { MathBlock, RichText } from "./RichText";
import { useEnterToContinue } from "./useEnterToContinue";
import { ListeningPanel } from "./Listening";
import { passageSegments } from "@/lib/learn/listen/segments";

export interface AttemptResponse {
  correct: boolean;
  attemptNo: number;
  /** server-issued proof of the attempt counter (guests) */
  attemptProof?: string;
  revealed: boolean;
  feedback: {
    hint?: string;
    secondaryHint?: string;
    hintLevel?: number;
    /** server proof that this hint level was served (needed to ask for the next one) */
    hintProof?: string;
    explanation?: string;
    secondaryExplanation?: string;
    answer?: string;
    /** canonical Korean of the passage, sent once the question is solved or revealed */
    passageKo?: string[];
    /** the correct Korean sentence for pick-the-Korean / fill-in questions, sent only once solved or revealed */
    audioAnswer?: string;
  };
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
  const { api, t, tSecondary, isBilingual, site } = useLearner();
  const isMulti = q.type === "ordering" || q.type === "multiple_select";
  const [value, setValue] = useState<string | string[]>(isMulti ? [] : "");
  const [status, setStatus] = useState<QStatus>("answering");
  const [attempts, setAttempts] = useState(0);
  const [proof, setProof] = useState<string | undefined>(undefined);
  const [hints, setHints] = useState<string[]>([]);
  const [secondaryHints, setSecondaryHints] = useState<string[]>([]);
  const [hintProof, setHintProof] = useState<string | undefined>(undefined);
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
  // an English reading passage inside the prompt is listenable sentence by sentence; its Korean only after the question is solved or revealed
  const passageKo = resolved ? feedback.passageKo : undefined;
  const passage = useMemo(() => (site === "english" ? passageSegments(`q-${q.id}`, q.prompt, passageKo) : null), [site, q.id, q.prompt, passageKo]);
  const canHint = hints.length < 2 && !resolved;
  const goNext = () => onNext({ firstTry: status === "correct" && attempts === 0, revealed: status === "revealed", followUp });

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
        attemptProof: proof,
        hintsUsed: hints.length,
        timeMs: Date.now() - startedAt,
        isReview,
        seenIds,
      });
      onAttempt(res);
      // a solved or revealed regular question counts toward the thinking-challenge offer (once per question; see lib/think/flow.ts)
      if (res.correct || res.revealed) window.dispatchEvent(new CustomEvent("learn:q-complete", { detail: { site, questionId: q.id } }));
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
        setProof(res.attemptProof);
        setStatus("wrong");
        const hint = res.feedback.hint;
        if (hint && !hints.includes(hint)) {
          setHints((h) => [...h, hint]);
          if (res.feedback.secondaryHint) setSecondaryHints((sh) => [...sh, res.feedback.secondaryHint!]);
          setHintProof(res.feedback.hintProof);
        }
        setValue(isMulti ? [] : "");
      }
      window.setTimeout(() => feedbackRef.current?.focus(), 30);
    } catch (e) {
      // Nothing was adopted from the failed request: progress is untouched.
      setStatus("answering");
      setError(e instanceof ApiError && e.code === "rate_limited" ? t("lesson.error") : t("lesson.error"));
    }
  };

  useEnterToContinue(resolved || (hasAnswer && status !== "checking"), () => { if (resolved) goNext(); else void submit(); }, status);

  const askHint = async () => {
    try {
      const res = await api<{ hint: string; secondaryHint?: string; level: number; hintProof?: string }>("hint", { questionId: q.id, level: hints.length + 1, sessionId, prevProof: hintProof });
      setHints((h) => [...h, res.hint]);
      if (res.secondaryHint) setSecondaryHints((sh) => [...sh, res.secondaryHint!]);
      setHintProof(res.hintProof);
    } catch {
      /* no more hints */
    }
  };

  return (
    <div className="l-stack">
      <p className="l-muted" aria-live="polite">
        <span>{label} · {t("common.diff", { n: q.difficulty })}</span>
        {isBilingual && <span style={{ marginLeft: "0.4rem", opacity: 0.85 }}>({tSecondary("common.diff", { n: q.difficulty })})</span>}
      </p>

      <div className="l-card l-stack">
        <div className="l-qprompt">
          <RichText text={formatPrompt(q.prompt)} />
          {isBilingual && q.secondary?.prompt && q.secondary.prompt !== q.prompt && (
            <div style={{ borderTop: "1px dashed var(--l-border, #ccc)", paddingTop: "0.5rem", marginTop: "0.5rem", opacity: 0.88, fontSize: "0.95em" }}>
              <RichText text={formatPrompt(q.secondary.prompt)} />
            </div>
          )}
        </div>
        {q.figure && <FigureView figure={q.figure} label={t("figure.alt")} />}
        {passage && <ListeningPanel scope={`q-${q.id}`} variant="chips" segments={passage} meaningPending={!resolved} />}
        {q.latex && <MathBlock latex={q.latex} />}
        {q.target ? <TargetBlock target={q.target} audioText={q.audioText} /> : q.audioText && <ListenButton text={q.audioText} />}
        <AnswerInput site={site} q={q} value={value} onChange={setValue} disabled={resolved || status === "checking"} onSubmit={submit} />
      </div>

      {error && <div className="l-panel l-panel-reveal" role="alert">{error}</div>}

      <div ref={feedbackRef} tabIndex={-1} aria-live="polite" className="l-stack">
        {status === "wrong" && (
          <div className="l-panel l-panel-hint">
            <div className="l-panel-title">
              <span>💭 {attempts === 1 ? t("lesson.wrong.1") : t("lesson.wrong.2")}</span>
              {isBilingual && (
                <span style={{ fontSize: "0.85em", fontWeight: 400, opacity: 0.85, marginLeft: "0.4rem" }}>
                  ({attempts === 1 ? tSecondary("lesson.wrong.1") : tSecondary("lesson.wrong.2")})
                </span>
              )}
            </div>
            {hints.map((h, k) => (
              <div key={k} style={{ marginBottom: "0.35rem" }}>
                <p><RichText text={h} /></p>
                {isBilingual && secondaryHints[k] && secondaryHints[k] !== h && (
                  <p style={{ opacity: 0.85, fontSize: "0.9em", marginTop: "0.15rem" }}>
                    <RichText text={secondaryHints[k]} />
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        {(status === "wrong" || status === "revealed") && <PronTip text={q.target?.text ?? q.audioText} />}
        {status === "correct" && (
          <div className="l-panel l-panel-good l-pop">
            <div className="l-panel-title">
              <span>✅ {attempts > 0 ? t("lesson.correct.after") : t("lesson.correct")}</span>
              {isBilingual && (
                <span style={{ fontSize: "0.85em", fontWeight: 400, opacity: 0.85, marginLeft: "0.4rem" }}>
                  ({attempts > 0 ? tSecondary("lesson.correct.after") : tSecondary("lesson.correct")})
                </span>
              )}
            </div>
            {feedback.explanation && (
              <div>
                <p>
                  <strong>{t("lesson.explain")}</strong>{isBilingual && <span style={{ opacity: 0.85 }}> ({tSecondary("lesson.explain")})</span>} · <RichText text={feedback.explanation} />
                </p>
                {isBilingual && feedback.secondaryExplanation && feedback.secondaryExplanation !== feedback.explanation && (
                  <p style={{ opacity: 0.85, fontSize: "0.92em", marginTop: "0.2rem" }}>
                    <RichText text={feedback.secondaryExplanation} />
                  </p>
                )}
              </div>
            )}
            {feedback.audioAnswer && <ListenButton text={feedback.audioAnswer} />}
            {floatXp ? <p className="l-rise" aria-hidden="true">{t("lesson.xp", { n: floatXp })}</p> : null}
          </div>
        )}
        {status === "revealed" && (
          <div className="l-panel l-panel-reveal">
            <div className="l-panel-title">
              <span>🧭 {t("lesson.reveal")}</span>
              {isBilingual && (
                <span style={{ fontSize: "0.85em", fontWeight: 400, opacity: 0.85, marginLeft: "0.4rem" }}>
                  ({tSecondary("lesson.reveal")})
                </span>
              )}
            </div>
            {feedback.answer && (
              <p>
                <strong>{t("lesson.answerIs")}</strong>{isBilingual && <span style={{ opacity: 0.85 }}> ({tSecondary("lesson.answerIs")})</span>} · <RichText text={feedback.answer} />
              </p>
            )}
            {feedback.explanation && (
              <div>
                <p>
                  <strong>{t("lesson.explain")}</strong>{isBilingual && <span style={{ opacity: 0.85 }}> ({tSecondary("lesson.explain")})</span>} · <RichText text={feedback.explanation} />
                </p>
                {isBilingual && feedback.secondaryExplanation && feedback.secondaryExplanation !== feedback.explanation && (
                  <p style={{ opacity: 0.85, fontSize: "0.92em", marginTop: "0.2rem" }}>
                    <RichText text={feedback.secondaryExplanation} />
                  </p>
                )}
              </div>
            )}
            {feedback.audioAnswer && <ListenButton text={feedback.audioAnswer} />}
          </div>
        )}
      </div>

      {status === "answering" && hints.length > 0 && (
        <div className="l-panel l-panel-hint" aria-live="polite">
          {hints.map((h, k) => (
            <div key={k} style={{ marginBottom: "0.35rem" }}>
              <p><RichText text={h} /></p>
              {isBilingual && secondaryHints[k] && secondaryHints[k] !== h && (
                <p style={{ opacity: 0.85, fontSize: "0.9em", marginTop: "0.15rem" }}>
                  <RichText text={secondaryHints[k]} />
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="l-stack w-full max-w-xl mx-auto">
        {resolved ? (
          <button className="l-btn l-btn-block" onClick={goNext}>
            <span>{status === "revealed" && followUp ? t("lesson.similar.go") : isLast ? t("lesson.finish") : t("lesson.next")}</span>
            {isBilingual && (
              <span style={{ fontSize: "0.85em", opacity: 0.85, marginLeft: "0.4rem" }}>
                · {status === "revealed" && followUp ? tSecondary("lesson.similar.go") : isLast ? tSecondary("lesson.finish") : tSecondary("lesson.next")}
              </span>
            )}
          </button>
        ) : (
          <>
            <button className="l-btn l-btn-block" onClick={submit} disabled={!hasAnswer || status === "checking"}>
              <span>{status === "wrong" ? t("lesson.retry") : t("lesson.check")}</span>
              {isBilingual && (
                <span style={{ fontSize: "0.85em", opacity: 0.85, marginLeft: "0.4rem" }}>
                  · {status === "wrong" ? tSecondary("lesson.retry") : tSecondary("lesson.check")}
                </span>
              )}
            </button>
            <button className="l-btn l-btn-ghost l-btn-block" onClick={askHint} disabled={!canHint || status === "checking"}>
              <span>💡 {canHint ? `${t("lesson.hint")} (${hints.length}/2)` : t("lesson.hint.none")}</span>
              {isBilingual && (
                <span style={{ fontSize: "0.85em", opacity: 0.85, marginLeft: "0.4rem" }}>
                  · {canHint ? `${tSecondary("lesson.hint")} (${hints.length}/2)` : tSecondary("lesson.hint.none")}
                </span>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
