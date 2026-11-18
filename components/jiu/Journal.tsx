"use client";
import { useEffect, useState } from "react";
import { ACTIONS, SERVICES, appendEvent, readEvents, dayKey, type JournalEvent } from "@/lib/jiu/journal";
import { JournalMailSync } from "./JournalMailSync";
export default function Journal() {
  const [events, setEvents] = useState<JournalEvent[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [filter, setFilter] = useState("all");
  const today = dayKey(new Date().toISOString());
  useEffect(() => {
    const load = () => { try { setEvents(readEvents()); const n = JSON.parse(localStorage.getItem("jiu-notes-v1") || "{}"); if (n && typeof n === "object" && !Array.isArray(n)) setNotes(Object.fromEntries(Object.entries(n).filter(([, v]) => typeof v === "string")) as Record<string, string>); } catch { setStatus("브라우저 저장소를 사용할 수 없습니다. 저장 설정을 확인해 주세요."); } };
    load(); window.addEventListener("focus", load); window.addEventListener("storage", load);
    return () => { window.removeEventListener("focus", load); window.removeEventListener("storage", load); };
  }, []);
  const days = [...new Set([today, ...events.map(e => dayKey(e.at)), ...Object.keys(notes)])].sort().reverse();
  const visit = (site: string) => { try { appendEvent({ id: crypto.randomUUID(), site, action: "visit", at: new Date().toISOString() }); setEvents(readEvents()); } catch { setStatus("이용 기록을 저장하지 못했습니다."); } };
  const saveNote = (day: string, text: string) => { const next = { ...notes, [day]: text }; setNotes(next); try { localStorage.setItem("jiu-notes-v1", JSON.stringify(next)); setStatus("소감을 저장했어요."); window.dispatchEvent(new Event("jiu-journal-updated")); } catch { setStatus("소감을 저장하지 못했습니다."); } };
  return <main className="jiu-shell">
    <header className="jiu-header"><a href="/jiu" className="jiu-logo">jiu<span>배움의 기록</span></a><a href="/jiu/admin">관리자 로그인 ↗</a></header>
    <section className="jiu-hero"><p className="jiu-eyebrow">MY LEARNING JOURNAL</p><h1>오늘의 작은 배움,<br /><em>내일의 나를 만들어요.</em></h1><p>수학도, 언어도, 일상도. 차곡차곡 쌓이는 나의 배움 이야기.</p><div className="jiu-summary"><span><b>{new Set(events.map(e => dayKey(e.at))).size}</b> 기록한 날</span><span><b>{events.filter(e => e.action === "attempt").length}</b> 문제 풀이</span><span><b>{events.filter(e => e.action === "complete").length}</b> 학습 완료</span></div></section>
    <section aria-labelledby="services-title"><div className="jiu-section-title"><h2 id="services-title">어디로 배움을 떠나볼까요?</h2><span>나의 학습 바로가기</span></div><div className="jiu-services">{SERVICES.map(s => <a key={s.id} href={`https://${s.host}`} target="_blank" rel="noopener noreferrer" onClick={() => visit(s.id)} style={{ background: s.color }}><span className="jiu-service-icon">{s.icon}</span><span className="jiu-arrow">↗</span><h3>{s.name}</h3><p>{s.description}</p><small>{s.host}</small></a>)}</div></section>
    <section className="jiu-journal" aria-labelledby="journal-title"><div className="jiu-section-title"><h2 id="journal-title">나의 학습 블로그</h2><span>활동은 자동으로, 생각은 자유롭게</span></div><p className="jiu-storage">이 브라우저에 저장하는 나의 학습 일지입니다. 배너 클릭과 연결된 학습 사이트의 문제 풀이·완료 활동을 자동 기록합니다. 저장소 차단·삭제 시 기록이 남지 않으며, 기기나 사용자 계정 사이에는 동기화되지 않습니다. 최근 활동 5,000개를 보관합니다.</p><JournalMailSync /><div className="jiu-filters" role="group" aria-label="과목 필터">{[{ id: "all", name: "전체" }, ...SERVICES].map(s => <button key={s.id} aria-pressed={filter === s.id} onClick={() => setFilter(s.id)}>{s.name}</button>)}</div><p role="status">{status}</p>
    {days.map(day => { const items = events.filter(e => dayKey(e.at) === day && (filter === "all" || e.site === filter)); if (!items.length && day !== today && filter !== "all") return null; return <article className="jiu-entry" key={day}><div className="jiu-entry-heading"><time dateTime={day}>{day.replaceAll("-", ". ")}</time><span>{day === today ? "오늘의 이야기" : "배움의 발자국"}</span></div><h3>{items.length ? `${items.length}개의 작은 발걸음을 남겼어요` : "오늘은 어떤 것을 배워볼까요?"}</h3>{items.length ? <ul>{SERVICES.map(s => { const rows = items.filter(e => e.site === s.id); return rows.length ? <li key={s.id}><strong>{s.name}</strong><span>{Object.entries(ACTIONS).map(([action, label]) => { const count = rows.filter(e => e.action === action).length; return count ? `${label} ${count}회` : null; }).filter(Boolean).join(" · ")}</span></li> : null; })}</ul> : <p>위 배너에서 학습을 시작하면 이곳에 기록이 쌓여요.</p>}<label htmlFor={`note-${day}`}>오늘의 발견과 소감</label><textarea id={`note-${day}`} maxLength={5000} value={notes[day] || ""} onChange={e => saveNote(day, e.target.value)} placeholder="새로 알게 된 것, 어려웠던 것, 내일 해보고 싶은 것…" /></article>; })}</section><footer className="jiu-footer">JIU × LIFE.HELP · 나의 속도로, 매일 한 걸음.</footer>
  </main>;
}
