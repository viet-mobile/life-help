"use client";
import { useEffect, useState } from "react";
import { readEvents } from "@/lib/jiu/journal";
const RECEIPT_KEY = "jiu-mail-receipt-v1";
const INTERVAL = 5 * 60_000;
type Receipt = { ids: string[]; notes: Record<string, string>; sentAt: number };
export function JournalMailSync({ silent = false }: { silent?: boolean }) {
  const [status, setStatus] = useState("메일 연결을 확인하고 있어요.");
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let busy = false;
    let stopped = false;
    let retryAfter = 0;
    const sync = async () => {
      if (busy || stopped || Date.now() < retryAfter) return;
      busy = true;
      try {
        const check = await fetch("/jiu/mail", { cache: "no-store" });
        const auth = await check.json();
        if (stopped) return;
        setEnabled(auth.enabled === true);
        if (!auth.enabled) { setStatus("관리자 로그인 후 이 브라우저의 일지를 이메일로도 자동 저장합니다."); retryAfter = Date.now() + 60_000; return; }
        let receipt: Receipt = { ids: [], notes: {}, sentAt: 0 };
        try {
          const parsed = JSON.parse(localStorage.getItem(RECEIPT_KEY) || "null");
          if (parsed && Array.isArray(parsed.ids) && parsed.notes && typeof parsed.notes === "object" && Number.isFinite(parsed.sentAt)) receipt = parsed;
        } catch {}
        if (Date.now() - receipt.sentAt < INTERVAL) { setStatus("메일 자동 저장 연결됨 · 새 기록은 약 5분 간격으로 발송합니다."); return; }
        const all = readEvents();
        const known = new Set(receipt.ids);
        const events = all.filter(e => !known.has(e.id)).slice(0, 200);
        const stored: unknown = JSON.parse(localStorage.getItem("jiu-notes-v1") || "{}");
        const notes = stored && typeof stored === "object" && !Array.isArray(stored)
          ? Object.entries(stored).filter(([day, text]) => /^\d{4}-\d{2}-\d{2}$/.test(day) && typeof text === "string" && receipt.notes[day] !== text).slice(0, 10).map(([day, text]) => ({ day, text: text as string })) : [];
        if (!events.length && !notes.length) { setStatus("메일 자동 저장 연결됨 · 새 기록을 기다리고 있어요."); return; }
        const response = await fetch("/jiu/mail", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ events, notes }) });
        if (!response.ok) throw new Error("mail_failed");
        const result = await response.json();
        if (!result.sent) throw new Error("mail_failed");
        const sentIds = new Set([...receipt.ids, ...events.map(e => e.id)]);
        localStorage.setItem(RECEIPT_KEY, JSON.stringify({ ids: all.filter(e => sentIds.has(e.id)).map(e => e.id), notes: { ...receipt.notes, ...Object.fromEntries(notes.map(n => [n.day, n.text])) }, sentAt: Date.now() }));
        if (!stopped) setStatus("새 학습 일지를 jiubag850@gmail.com으로 발송했습니다.");
      } catch {
        retryAfter = Date.now() + 60_000;
        if (!stopped) setStatus("메일을 보내지 못했습니다. 기록은 브라우저에 유지하며 자동으로 다시 시도합니다.");
      } finally { busy = false; }
    };
    const timer = window.setInterval(() => { void sync(); }, 60_000);
    // Debounce reflections before taking a snapshot; successful sends are at least five minutes apart.
    let debounce: number | undefined;
    const update = () => { window.clearTimeout(debounce); debounce = window.setTimeout(() => { void sync(); }, 5000); };
    window.addEventListener("jiu-journal-updated", update);
    window.addEventListener("storage", update);
    window.addEventListener("focus", update);
    update();
    return () => { stopped = true; clearInterval(timer); window.clearTimeout(debounce); window.removeEventListener("jiu-journal-updated", update); window.removeEventListener("storage", update); window.removeEventListener("focus", update); };
  }, []);
  if (silent) return null;
  return <p className="jiu-storage" role="status">{status} {!enabled && <a href="/jiu/admin">관리자 로그인 →</a>}</p>;
}
