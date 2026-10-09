"use client";

import type { SvcHelper, SvcMessage, SvcNotification, SvcRequest, SvcEvent } from "./clientTypes";

export class ApiError extends Error {
  constructor(readonly code: string, readonly status: number) {
    super(code);
  }
}

async function call<T>(method: string, path: string, body?: unknown, token?: string | null): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/svc${path}`, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}), ...(token ? { "x-svc-token": token } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("NETWORK", 0);
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new ApiError(String(data.error ?? "INTERNAL"), res.status);
  return data as T;
}

export type ChatKind = "CUSTOMER" | "HELPER" | "ADMIN";
const chatBase = (kind: ChatKind, id: string) => (kind === "CUSTOMER" ? `/c/requests/${id}` : kind === "HELPER" ? `/h/requests/${id}` : `/a/requests/${id}`);

export const chatApi = {
  list: (kind: ChatKind, id: string, after: number, locale: string, token?: string | null) =>
    call<{ messages: SvcMessage[] }>("GET", `${chatBase(kind, id)}/messages?after=${after}&locale=${encodeURIComponent(locale)}`, undefined, token).then((r) => r.messages),
  send: (kind: ChatKind, id: string, body: string, locale: string, token?: string | null) =>
    call<{ message: SvcMessage }>("POST", `${chatBase(kind, id)}/messages`, { body, locale }, token).then((r) => r.message),
};

export const customerApi = {
  create: (input: { serviceSlug: string; country: string; sido: string; gungu: string; address: string; description: string; locale: string; selectedOptions: string[] }) =>
    call<{ request: SvcRequest; eligibleHelpers: number; token: string }>("POST", "/c/requests", input),
  list: () => call<{ requests: SvcRequest[] }>("GET", "/c/requests").then((r) => r.requests),
  get: (id: string, token?: string | null) => call<{ request: SvcRequest; events: SvcEvent[] }>("GET", `/c/requests/${id}`, undefined, token),
  cancel: (id: string, token?: string | null) => call<{ request: SvcRequest }>("POST", `/c/requests/${id}/cancel`, {}, token).then((r) => r.request),
  notifications: (after: number) => call<{ notifications: SvcNotification[] }>("GET", `/c/notifications?after=${after}`).then((r) => r.notifications),
};

export const helperApi = {
  register: (input: { name: string; email?: string; primaryLocale: string; spokenLocales: string[]; services: string[]; regions: Array<{ country: string; sido: string; gungu: string }> }) =>
    call<{ helper: SvcHelper; credential: string }>("POST", "/h/register", input),
  login: (credential: string) => call<{ helper: SvcHelper }>("POST", "/h/login", { credential }),
  logout: () => call<{ ok: true }>("POST", "/h/logout", {}),
  me: () => call<{ helper: SvcHelper }>("GET", "/h/me").then((r) => r.helper),
  update: (patch: { name?: string; primaryLocale?: string; spokenLocales?: string[]; services?: string[]; regions?: Array<{ country: string; sido: string; gungu: string }> }) =>
    call<{ helper: SvcHelper }>("PATCH", "/h/me", patch).then((r) => r.helper),
  setAvailable: (available: boolean) => call<{ helper: SvcHelper }>("POST", "/h/available", { available }).then((r) => r.helper),
  requests: () => call<{ available: SvcRequest[]; mine: SvcRequest[] }>("GET", "/h/requests"),
  act: (id: string, action: "accept" | "start" | "complete") => call<{ request: SvcRequest }>("POST", `/h/requests/${id}/${action}`, {}).then((r) => r.request),
  notifications: (after: number) => call<{ notifications: SvcNotification[] }>("GET", `/h/notifications?after=${after}`).then((r) => r.notifications),
};

export const adminApi = {
  requests: (status?: string) => call<{ requests: SvcRequest[] }>("GET", `/a/requests${status ? `?status=${status}` : ""}`).then((r) => r.requests),
  request: (id: string) => call<{ request: SvcRequest; events: SvcEvent[]; eligibleHelpers: string[] }>("GET", `/a/requests/${id}`),
  helpers: (status?: string) => call<{ helpers: SvcHelper[] }>("GET", `/a/helpers${status ? `?status=${status}` : ""}`).then((r) => r.helpers),
  setHelperStatus: (id: string, status: string) => call<{ helper: SvcHelper }>("POST", `/a/helpers/${id}/status`, { status }).then((r) => r.helper),
  assign: (requestId: string, helperId: string) => call<{ request: SvcRequest }>("POST", `/a/requests/${requestId}/assign`, { helperId }).then((r) => r.request),
  cancel: (requestId: string) => call<{ request: SvcRequest }>("POST", `/a/requests/${requestId}/cancel`, {}).then((r) => r.request),
  notifications: (after: number) => call<{ notifications: SvcNotification[] }>("GET", `/a/notifications?after=${after}`).then((r) => r.notifications),
};

/** Cache ONLY (never authority): the request links this browser created, so "my requests" can reopen them with their access token. */
const TOKENS_KEY = "life_help_svc_tokens_v1";
export function rememberRequestToken(id: string, token: string) {
  try {
    const all = JSON.parse(localStorage.getItem(TOKENS_KEY) ?? "{}") as Record<string, string>;
    all[id] = token;
    localStorage.setItem(TOKENS_KEY, JSON.stringify(all));
  } catch { /* cache only */ }
}
export function requestToken(id: string): string | null {
  try {
    return (JSON.parse(localStorage.getItem(TOKENS_KEY) ?? "{}") as Record<string, string>)[id] ?? null;
  } catch {
    return null;
  }
}
