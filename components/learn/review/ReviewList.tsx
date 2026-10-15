"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReviewRow } from "@/lib/learn/review/korean";

const KEY = "korean-review:v1";
const CATEGORIES: [string, string][] = [
  ["answer", "정답 오류 / wrong or non-unique answer"],
  ["korean", "한국어 문장·맞춤법 / Korean text"],
  ["romanization", "로마자·발음 표기 / romanization"],
  ["distractor", "오답 보기 / distractors"],
  ["hint", "힌트·해설 / hint or explanation"],
  ["translation", "번역 / translation"],
  ["level", "레벨·난이도 / level or difficulty"],
  ["duplicate", "중복 / duplicate"],
  ["other", "기타 / other"],
];
export interface ReviewNote { id: string; level: string; skillId: string; locale: string; category: string; note: string; at: string }

function load(): ReviewNote[] {
  try { const raw = window.localStorage.getItem(KEY); const v = raw ? JSON.parse(raw) : []; return Array.isArray(v) ? v : []; } catch { return []; }
}
function save(notes: ReviewNote[]): boolean {
  try { window.localStorage.setItem(KEY, JSON.stringify(notes)); return true; } catch { return false; }
}
const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`;
function download(name: string, mime: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

/** Notes live only in this browser (localStorage): the review console writes nothing to any database and never touches learner progress. */
export function ReviewList({ rows, locale }: { rows: ReviewRow[]; locale: string }) {
  const [notes, setNotes] = useState<ReviewNote[]>([]);
  const [storageOk, setStorageOk] = useState(true);
  const [draft, setDraft] = useState<Record<string, { category: string; note: string }>>({});
  useEffect(() => { setNotes(load()); }, []);
  const commit = useCallback((next: ReviewNote[]) => { setNotes(next); setStorageOk(save(next)); }, []);
  const noteOf = (id: string) => notes.find((n) => n.id === id && n.locale === locale);

  return (
    <div className="l-stack" data-testid="review-list">
      <section className="l-card l-stack" aria-label="기록">
        <strong>기록한 문제 {notes.length}건 (이 브라우저에만 저장 · saved in this browser only)</strong>
        {!storageOk && <p className="l-panel l-panel-reveal" role="alert">브라우저 저장소를 쓸 수 없습니다. 아래 내보내기를 바로 사용하세요. / Browser storage is unavailable; export right away.</p>}
        <div className="l-options" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
          <button type="button" className="l-option" onClick={() => download("korean-review-notes.json", "application/json", JSON.stringify(notes, null, 1))} disabled={!notes.length}>JSON</button>
          <button type="button" className="l-option" onClick={() => download("korean-review-notes.csv", "text/csv", ["id,level,skill,locale,category,note,at", ...notes.map((n) => [n.id, n.level, n.skillId, n.locale, n.category, n.note, n.at].map(csvCell).join(","))].join("\n"))} disabled={!notes.length}>CSV</button>
          <button type="button" className="l-option" onClick={() => { if (window.confirm("기록을 모두 지울까요? / Delete all notes?")) commit([]); }} disabled={!notes.length}>지우기 / clear</button>
        </div>
      </section>
      {rows.map((r) => {
        const rec = noteOf(r.id);
        const d = draft[r.id] ?? { category: rec?.category ?? "answer", note: rec?.note ?? "" };
        return (
          <article key={r.id} className="l-card l-stack" id={r.id} data-testid="review-row" data-question-id={r.id}>
            <p className="l-muted" style={{ fontSize: "0.85rem", overflowWrap: "anywhere" }}>
              <code>{r.id}</code> · {r.level} · <code>{r.skillId}</code> {r.skillTitle} · {r.source} · {r.form} · <strong>{r.status}</strong>
              {" · "}<span data-testid="wording" data-wording={r.wording}>{r.wording === "canonical" ? "English source" : r.wording === "localized" ? `${locale} text` : `fallback to English (${r.fallback.join(", ")})`}</span>
              {rec && <strong> · 📝 {rec.category}</strong>}
            </p>
            {r.target && <p style={{ fontSize: "1.3rem" }} lang="ko">{r.target.text}{r.target.romanization && <span className="l-muted" style={{ fontSize: "0.9rem" }}> ({r.target.romanization}{r.target.romanizationVi ? ` · vi: ${r.target.romanizationVi}` : ""})</span>}</p>}
            <p style={{ whiteSpace: "pre-wrap" }}>{r.prompt}</p>
            {r.options.length > 0
              ? <><ol type="a" style={{ paddingLeft: "1.4rem" }}>{r.options.map((o) => <li key={o.id} data-correct={o.correct ? "true" : undefined} style={o.correct ? { fontWeight: 800 } : undefined}>{o.text}{o.correct && <span aria-label="정답"> ✓ 정답</span>}</li>)}</ol>{r.kind !== "choice" && <p><strong>정답 / answer:</strong> {r.answerText}</p>}</>
              : <p><strong>정답 / answer:</strong> {r.answerText}</p>}
            <details>
              <summary>힌트·해설 / hints &amp; explanation</summary>
              <ol style={{ paddingLeft: "1.4rem" }}>{r.hints.map((h, i) => <li key={i}>{h}</li>)}</ol>
              <p style={{ whiteSpace: "pre-wrap" }}>{r.explanation}</p>
            </details>
            <details open={!!rec}>
              <summary>{rec ? "기록 수정 / edit note" : "문제 기록 / report an issue"}</summary>
              <div className="l-stack">
                <label>분류 / category
                  <select className="l-input" value={d.category} onChange={(e) => setDraft({ ...draft, [r.id]: { ...d, category: e.target.value } })}>
                    {CATEGORIES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                  </select>
                </label>
                <label>내용 / note
                  <textarea className="l-input" rows={3} maxLength={2000} value={d.note} onChange={(e) => setDraft({ ...draft, [r.id]: { ...d, note: e.target.value } })} />
                </label>
                <div className="l-options" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <button type="button" className="l-option" disabled={!d.note.trim()} onClick={() => commit([...notes.filter((n) => !(n.id === r.id && n.locale === locale)), { id: r.id, level: r.level, skillId: r.skillId, locale, category: d.category, note: d.note.trim(), at: new Date().toISOString() }])}>저장 / save</button>
                  <button type="button" className="l-option" disabled={!rec} onClick={() => commit(notes.filter((n) => !(n.id === r.id && n.locale === locale)))}>삭제 / delete</button>
                </div>
              </div>
            </details>
          </article>
        );
      })}
    </div>
  );
}
