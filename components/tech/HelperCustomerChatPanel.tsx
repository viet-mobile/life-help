"use client";

import { useState, useEffect, useCallback } from "react";
import { type Locale } from "@/messages";
import {
  getProviderChatSessionsForHelper,
  sendProviderChatMessage,
  markSessionRead,
  getUnreadCountForHelper,
  type ProviderChatSession,
} from "@/lib/chat/providerChatStore";

const CHAT_EVENT = "life_help_provider_chat_update";

interface Props {
  helperId: string;
  providerName: string;
  providerLocale: Locale;
  isKorean: boolean;
  formatBilingual: (en: string, ko: string) => string;
  onClose: () => void;
  initialSessionId?: string | null;
}

export function HelperCustomerChatPanel({
  helperId,
  providerName,
  providerLocale,
  isKorean,
  formatBilingual,
  onClose,
  initialSessionId,
}: Props) {
  const [sessions, setSessions] = useState<ProviderChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(initialSessionId || null);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const refresh = useCallback(() => {
    setSessions(getProviderChatSessionsForHelper(helperId));
  }, [helperId]);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener(CHAT_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(CHAT_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, [refresh]);

  const openSession = (id: string) => {
    setActiveId(id);
    markSessionRead(id, "provider");
    refresh();
  };

  useEffect(() => {
    if (initialSessionId) {
      openSession(initialSessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSessionId]);

  const active = sessions.find((s) => s.id === activeId) || null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !active || isSending) return;
    const body = text.trim();
    setText("");
    setIsSending(true);
    try {
      await sendProviderChatMessage(active.id, "provider", providerName, providerLocale, body);
      refresh();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative flex flex-col h-[600px] max-h-[90vh] w-full max-w-2xl droplet-card border border-slate-700 bg-slate-900/95 shadow-2xl text-white overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-5 py-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {active && (
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="droplet-btn p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer shrink-0"
                title={formatBilingual("Back to list", "목록으로")}
              >
                ←
              </button>
            )}
            <span className="flex h-9 w-9 items-center justify-center droplet-pill bg-emerald-600 text-xs font-black text-white shadow-xs shrink-0">
              💬
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5 truncate">
                <span>
                  {active
                    ? active.customerName
                    : formatBilingual("Customer Messages", "고객 실시간 메시지")}
                </span>
                <span className="droplet-pill bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-800/50 shrink-0">
                  {formatBilingual("Live", "실시간")}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                {active
                  ? `${active.serviceName} · ${active.sido} ${active.gungu}`
                  : formatBilingual(
                      `${sessions.length} chat rooms connected to you`,
                      `현재 연결된 고객 대화방 ${sessions.length}건`,
                    )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="droplet-btn p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {!active ? (
          /* Session List */
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {sessions.length === 0 ? (
              <div className="grid h-full place-content-center text-center text-xs text-slate-500">
                <p className="text-2xl mb-2">📭</p>
                <p>
                  {formatBilingual(
                    "No customer requests connected yet.",
                    "아직 연결된 고객 요청이 없습니다.",
                  )}
                </p>
                <p className="text-slate-600 mt-1">
                  {formatBilingual(
                    "When a customer submits a request in your service area, a live chat room appears here automatically.",
                    "담당 지역·서비스로 고객이 요청을 접수하면 실시간 대화방이 자동으로 생성됩니다.",
                  )}
                </p>
              </div>
            ) : (
              sessions.map((s) => {
                const unread = getUnreadCountForHelper(s);
                const lastMsg = s.messages[s.messages.length - 1];
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => openSession(s.id)}
                    className="w-full text-left droplet-card p-3.5 border border-slate-800 bg-slate-800/50 hover:border-blue-600/60 hover:bg-slate-800 transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-bold text-white truncate">
                          {s.customerName}
                        </span>
                        <span className="droplet-pill bg-blue-950/70 px-2 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-800/50 shrink-0">
                          {s.serviceName}
                        </span>
                      </div>
                      {unread > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 truncate">
                      📍 {s.sido} {s.gungu}
                      {lastMsg ? ` · ${lastMsg.sender === "customer" ? lastMsg.text : lastMsg.translatedText || lastMsg.text}` : ""}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <>
            {/* Message History Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {active.messages.map((msg) => {
                if (msg.sender === "system") {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="droplet-card bg-blue-100/10 border border-blue-800/40 px-4 py-2 text-xs font-medium text-blue-200 max-w-lg text-center leading-relaxed">
                        🔔 {msg.text}
                      </div>
                    </div>
                  );
                }

                const isProvider = msg.sender === "provider";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isProvider ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                      <span className="font-bold text-slate-300">
                        {msg.senderName} · {isProvider ? formatBilingual("You", "나") : formatBilingual("Customer", "고객")}
                      </span>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div
                      className={`max-w-[80%] droplet-card px-4 py-2.5 text-xs leading-relaxed ${
                        isProvider
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
                          : "bg-slate-800 border border-slate-700 text-white shadow-xs"
                      }`}
                    >
                      <p className="font-semibold">
                        {isProvider ? msg.text : msg.translatedText || msg.text}
                      </p>
                      {!isProvider && msg.translatedText && msg.translatedText !== msg.text && (
                        <div className="mt-2 pt-2 border-t border-slate-700 text-[11px] text-slate-400">
                          <span className="font-bold opacity-75">
                            {formatBilingual("Customer original: ", "고객 원문: ")}
                          </span>
                          <span>{msg.text}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Bar */}
            <div className="border-t border-slate-800 bg-slate-950 p-3 shrink-0">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={formatBilingual(
                    "Type a reply... auto-translated to the customer's language",
                    "답변을 입력하세요. 고객의 언어로 자동 번역되어 전달됩니다.",
                  )}
                  className="droplet-input flex-1 border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!text.trim() || isSending}
                  className="droplet-btn bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm shadow-blue-600/20 hover:brightness-105 active:scale-[0.98] disabled:opacity-50 transition cursor-pointer"
                >
                  {isSending ? formatBilingual("Sending...", "전송 중...") : formatBilingual("Send", "전송")}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
