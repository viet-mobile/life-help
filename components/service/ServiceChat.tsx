"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { ApiError, chatApi, type ChatKind } from "@/lib/service/client";
import type { SvcMessage } from "@/lib/service/clientTypes";
import { usePoll } from "@/lib/service/usePoll";

interface Props {
  requestId: string;
  kind: ChatKind;
  /** the customer's request access token (for opening the request on another device) */
  token?: string | null;
  canSend: boolean;
  tone?: "light" | "dark";
  /** how often the other side's messages are fetched */
  pollMs?: number;
}

/**
 * Server-persisted chat. Messages live in the database; this view only fetches them (cursor = last seq) and posts new ones, so a refresh,
 * a new tab or another device shows the same conversation. The ORIGINAL text is always shown; a machine translation, when there is
 * one, is shown next to it and marked as such. A failed translation says so - it is never replaced by a made-up one.
 */
export function ServiceChat({ requestId, kind, token = null, canSend, tone = "light", pollMs = 2000 }: Props) {
  const { locale, t } = useLocale();
  const [messages, setMessages] = useState<SvcMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const cursor = useRef(0);
  const seen = useRef(new Set<string>());
  const bottom = useRef<HTMLDivElement>(null);
  const dark = tone === "dark";

  const merge = useCallback((incoming: SvcMessage[]) => {
    const fresh = incoming.filter((m) => !seen.current.has(m.id));
    for (const m of incoming) cursor.current = Math.max(cursor.current, m.seq);
    if (fresh.length === 0) return;
    for (const m of fresh) seen.current.add(m.id);
    setMessages((cur) => [...cur, ...fresh].sort((a, b) => a.seq - b.seq));
  }, []);

  // reading in another language: start over so every message is shown in the new reader language
  useEffect(() => {
    cursor.current = 0;
    seen.current = new Set();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrates from the server / browser cache after mount
    setMessages([]);
  }, [requestId, locale]);

  usePoll(async () => {
    merge(await chatApi.list(kind, requestId, cursor.current, locale, token));
    setProblem(null);
  }, pollMs, true, (e) => setProblem(e instanceof ApiError && e.status === 404 ? "gone" : "retry"));

  useEffect(() => { bottom.current?.scrollIntoView({ block: "end" }); }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending || !canSend) return;
    setSending(true);
    try {
      const m = await chatApi.send(kind, requestId, body, locale, token);
      setText("");
      merge([{ ...m, own: true, translation: null, translationStatus: "NONE" }]);
      setProblem(null);
    } catch (err) {
      setProblem(err instanceof ApiError && err.code === "RATE_LIMITED" ? "rate" : "send");
    } finally {
      setSending(false);
    }
  };

  const wrap = dark ? "border-slate-700 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900";
  const mine = dark ? "bg-emerald-600 text-white" : "bg-blue-600 text-white";
  const theirs = dark ? "bg-slate-800 text-slate-100" : "bg-slate-100 text-slate-900";
  const muted = dark ? "text-slate-400" : "text-slate-500";

  return (
    <section className={`flex flex-col rounded-2xl border ${wrap}`} data-testid="service-chat" aria-label={t("svc.chat.title")}>
      <div className={`flex items-center justify-between px-4 py-2 text-[11px] font-bold ${muted}`}>
        <span>{t("svc.chat.title")}</span>
        <span>{t("svc.chat.autoRefresh")}</span>
      </div>
      <div className="flex max-h-[55vh] min-h-40 flex-col gap-2 overflow-y-auto px-3 pb-3" role="log" aria-live="polite" data-testid="chat-log">
        {messages.length === 0 && <p className={`py-6 text-center text-xs ${muted}`}>{t("svc.chat.empty")}</p>}
        {messages.map((m) => {
          const shown = !m.own && m.translationStatus === "OK" && m.translation ? m.translation.text : m.body;
          return (
            <div key={m.id} className={`flex ${m.own ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.own ? mine : theirs}`} data-testid={`msg-${m.senderKind.toLowerCase()}`} data-own={m.own}>
                <div className={`mb-0.5 text-[10px] font-black uppercase opacity-70`}>{t(`svc.chat.sender.${m.senderKind}`)}</div>
                <p dir="auto" className="whitespace-pre-wrap break-words" data-testid="msg-shown">{shown}</p>
                {!m.own && m.translationStatus === "OK" && (
                  <p dir="auto" className="mt-1.5 border-t border-current/20 pt-1 text-[11px] opacity-80 whitespace-pre-wrap break-words" data-testid="msg-original">
                    <span className="font-bold">{t("svc.chat.original")}: </span>{m.body}
                  </p>
                )}
                {!m.own && m.translationStatus === "FAILED" && (
                  <p className="mt-1 text-[10px] font-bold opacity-80" data-testid="msg-translation-failed">{t("svc.chat.translationFailed")}</p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      {problem && (
        <p role="alert" data-testid="chat-problem" className="px-4 pb-2 text-[11px] font-bold text-amber-500">
          {problem === "gone" ? t("svc.chat.gone") : problem === "rate" ? t("svc.chat.rate") : problem === "send" ? t("svc.chat.sendFailed") : t("svc.chat.retrying")}
        </p>
      )}
      {canSend ? (
        <form onSubmit={send} className={`flex gap-2 border-t p-3 ${dark ? "border-slate-700" : "border-slate-200"}`}>
          <input data-testid="chat-input" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} dir="auto" placeholder={t("svc.chat.placeholder")} aria-label={t("svc.chat.placeholder")}
            className={`min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm outline-none ${dark ? "border-slate-700 bg-slate-800 text-white" : "border-slate-300 bg-white text-slate-900"}`} />
          <button type="submit" data-testid="chat-send" disabled={sending || !text.trim()} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50 cursor-pointer">{t("svc.chat.send")}</button>
        </form>
      ) : (
        <p className={`border-t p-3 text-center text-[11px] font-bold ${muted} ${dark ? "border-slate-700" : "border-slate-200"}`}>{t("svc.chat.closed")}</p>
      )}
    </section>
  );
}
