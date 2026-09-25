"use client";

import { useEffect, useState } from "react";
import { RewardPayoutPanel } from "@/components/chat/RewardPayoutPanel";
import { useLocale } from "@/lib/i18n/LocaleContext";

export function DbChatPanel({ requestId, capability }: { requestId: string; capability: string }) {
  const { t } = useLocale();
  const [messages, setMessages] = useState<Array<{ id: string; sender_role: string; original_text: string; translated_text: string | null; translation_status: string; created_at: string }>>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const load = async () => {
    const response = await fetch(`/api/chat?requestId=${requestId}&capability=${encodeURIComponent(capability)}`, { cache: "no-store" });
    const data = await response.json().catch(() => null);
    if (!response.ok) { setError(t("chat.closedNotice")); return; }
    setMessages(data.messages ?? []);
  };
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 3000); return () => window.clearInterval(timer); }, [requestId, capability]);
  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    setText("");
    await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId, capability, originalLanguage: document.documentElement.lang || "en", originalText: value }) });
    await load();
  };
  return <main className="min-h-screen bg-slate-50 px-4 py-8"><div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h1 className="text-xl font-black text-slate-900">{t("chat.title")}</h1><p className="mt-1 text-xs text-slate-500">{t("chat.desc")}</p>{error && <p className="mt-4 text-sm font-bold text-red-700">{error}</p>}<div className="my-5 space-y-3">{messages.map((message) => <article key={message.id} className="rounded-lg border border-slate-200 p-3"><p className="text-xs font-bold text-slate-500">{message.sender_role} · {new Date(message.created_at).toLocaleString()}</p><p className="mt-1 text-sm text-slate-900">{message.original_text}</p>{message.translated_text && <p className="mt-1 border-t pt-1 text-sm text-slate-600">{message.translated_text}</p>}</article>)}</div><form onSubmit={send} className="flex gap-2"><input value={text} onChange={(event) => setText(event.target.value)} className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2" placeholder={t("chat.inputPlaceholder")} /><button className="rounded bg-blue-700 px-4 py-2 font-bold text-white">{t("chat.send")}</button></form><RewardPayoutPanel requestId={requestId} capability={capability} /></div></main>;
}
