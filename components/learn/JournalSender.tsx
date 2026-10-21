"use client";
import { useEffect, useRef } from "react";
// One-way browser bridge: no JIU server, admin, mail, or marketplace module enters the learning bundle.
interface JournalEvent { id: string; site: string; action: string; at: string }
const actions = ["start", "attempt", "complete", "cards", "diagnostic"];
function validEvent(e: unknown): e is JournalEvent {
  if (!e || typeof e !== "object") return false;
  const v = e as JournalEvent;
  return typeof v.id === "string" && v.id.length <= 100 && ["math", "english", "korean"].includes(v.site) && actions.includes(v.action) && typeof v.at === "string" && Number.isFinite(Date.parse(v.at));
}
function appendEvent(event: JournalEvent) {
  const value: unknown = JSON.parse(localStorage.getItem("jiu-journal-v1") || "[]");
  const events = Array.isArray(value) ? value.filter(validEvent) : [];
  if (!events.some(e => e.id === event.id)) localStorage.setItem("jiu-journal-v1", JSON.stringify([...events, event].slice(-5000)));
}

export function JournalSender({ site }: { site: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const origin = window.location.hostname.endsWith(".life.help") ? "https://jiu.life.help" : window.location.origin;
    if (frame.current) frame.current.src = `${origin}/jiu/bridge`;
    const key = `jiu-pending:${site}`;
    let queue: JournalEvent[] = [];
    try { const value = JSON.parse(localStorage.getItem(key) || "[]"); if (Array.isArray(value)) queue = value.filter(validEvent); } catch {}
    const persist = () => { try { localStorage.setItem(key, JSON.stringify(queue)); } catch {} };
    const flush = () => {
      if (origin === window.location.origin) {
        try { queue.forEach(appendEvent); queue = []; persist(); } catch {}
      } else queue.forEach(event => frame.current?.contentWindow?.postMessage({ type: "jiu-journal", event }, origin));
    };
    const record = (e: Event) => {
      const action = (e as CustomEvent<string>).detail;
      if (!actions.includes(action)) return;
      queue = [...queue, { id: crypto.randomUUID(), site, action, at: new Date().toISOString() }].slice(-500);
      persist(); flush();
    };
    const ack = (e: MessageEvent) => {
      if (e.origin !== origin || e.source !== frame.current?.contentWindow || e.data?.type !== "jiu-saved") return;
      queue = queue.filter(event => event.id !== e.data.id); persist();
    };
    window.addEventListener("jiu-activity", record);
    window.addEventListener("message", ack);
    const timer = window.setInterval(flush, 2000);
    return () => { clearInterval(timer); window.removeEventListener("jiu-activity", record); window.removeEventListener("message", ack); };
  }, [site]);
  return <iframe ref={frame} title="학습 일지 자동 저장" hidden aria-hidden="true" />;
}
