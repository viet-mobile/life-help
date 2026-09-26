"use client";

import { useEffect, useState } from "react";

export type PushToggleLabels = { enable: string; enabled: string; disable: string; blocked: string; unavailable: string };
type State = "idle" | "working" | "on" | "blocked" | "unavailable";

function supported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function applicationServerKey(publicKey: string): Uint8Array<ArrayBuffer> {
  const normalized = publicKey.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - (normalized.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function registration(): Promise<ServiceWorkerRegistration> {
  return (await navigator.serviceWorker.getRegistration("/")) ?? (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));
}

/**
 * "Enable notifications" control. Permission is requested only inside the click handler (a user
 * gesture); nothing is requested on page load. Ownership is decided by the server from the
 * device-owner cookie (customer) or Supabase Auth (helper), never by anything sent from here.
 */
export function PushToggle({ audience, labels }: { audience: "customer" | "helper"; labels: PushToggleLabels }) {
  const [state, setState] = useState<State>("idle");

  // Passive check only: reflects an existing subscription without prompting or re-registering.
  useEffect(() => {
    const check = async () => {
      if (!supported()) return "unavailable" as const;
      if (Notification.permission === "denied") return "blocked" as const;
      if (Notification.permission !== "granted") return null;
      const reg = await navigator.serviceWorker.getRegistration("/");
      return reg && (await reg.pushManager.getSubscription()) ? "on" as const : null;
    };
    let active = true;
    void check().then((next) => { if (active && next) setState((current) => (current === "idle" ? next : current)); }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const enable = async () => {
    if (!supported()) { setState("unavailable"); return; }
    setState("working");
    try {
      const config = await fetch("/api/push/config", { cache: "no-store" }).then((response) => response.json()).catch(() => null);
      if (!config?.enabled || typeof config.publicKey !== "string") { setState("unavailable"); return; }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState(permission === "denied" ? "blocked" : "idle"); return; }
      const reg = await registration();
      await navigator.serviceWorker.ready;
      const key = applicationServerKey(config.publicKey);
      let subscription = await reg.pushManager.getSubscription();
      const currentKey = subscription?.options.applicationServerKey ? new Uint8Array(subscription.options.applicationServerKey) : null;
      if (subscription && (!currentKey || currentKey.join() !== key.join())) {
        await subscription.unsubscribe();
        subscription = null;
      }
      subscription ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      const response = await fetch("/api/push/subscription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ audience, subscription: subscription.toJSON() }) });
      setState(response.ok ? "on" : "idle");
    } catch {
      setState("idle");
    }
  };

  // Removes only this audience's server-side subscription. The browser subscription is kept, since
  // the same browser may also be registered for the other audience.
  const disable = async () => {
    setState("working");
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const subscription = await reg?.pushManager.getSubscription();
      if (subscription) await fetch("/api/push/subscription", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ audience, endpoint: subscription.endpoint }) });
    } finally {
      setState("idle");
    }
  };

  if (state === "unavailable") return <p data-testid={`push-${audience}-unavailable`} className="mt-3 text-xs font-semibold text-slate-500">{labels.unavailable}</p>;
  if (state === "blocked") return <p data-testid={`push-${audience}-blocked`} className="mt-3 text-xs font-semibold text-amber-700">{labels.blocked}</p>;
  if (state === "on") {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span data-testid={`push-${audience}-on`} className="text-xs font-bold text-emerald-700">{labels.enabled}</span>
        <button type="button" data-testid={`push-${audience}-disable`} onClick={() => void disable()} className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700">{labels.disable}</button>
      </div>
    );
  }
  return (
    <button type="button" data-testid={`push-${audience}-enable`} disabled={state === "working"} onClick={() => void enable()} className="mt-3 rounded bg-blue-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
      {labels.enable}
    </button>
  );
}
