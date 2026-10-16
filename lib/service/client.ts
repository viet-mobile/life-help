"use client";

import type { SvcHelper, SvcMessage, SvcNotification, SvcRequest, SvcEvent } from "./clientTypes";

export class ApiError extends Error {
  constructor(readonly code: string, readonly status: number) {
    super(code);
  }
}

/** Reads (GET) are cut off after this long. A request that never answers must fail, so the caller (the polling loop) can recover. */
export const READ_TIMEOUT_MS = 15_000;

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  // only reads are timed out here: a write that is cut off client-side may still have been stored, and is retried by its own idempotency key
  const signal = method === "GET" ? AbortSignal.timeout(READ_TIMEOUT_MS) : undefined;
  try {
    res = await fetch(`/api/svc${path}`, {
      ...(signal ? { signal } : {}),
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    throw new ApiError((e as { name?: string })?.name === "TimeoutError" ? "TIMEOUT" : "NETWORK", 0);
  }
  // the body read is part of the request: a response whose body stalls must not hang the caller either
  const data = (await res.json().catch(() => { if (signal?.aborted) throw new ApiError("TIMEOUT", 0); return {}; })) as Record<string, unknown>;
  if (!res.ok) throw new ApiError(String(data.error ?? "INTERNAL"), res.status);
  return data as T;
}

export type ChatKind = "CUSTOMER" | "HELPER" | "ADMIN";
const chatBase = (kind: ChatKind, id: string) => (kind === "CUSTOMER" ? `/c/requests/${id}` : kind === "HELPER" ? `/h/requests/${id}` : `/a/requests/${id}`);

export const chatApi = {
  list: (kind: ChatKind, id: string, after: number, locale: string) =>
    call<{ messages: SvcMessage[] }>("GET", `${chatBase(kind, id)}/messages?after=${after}&locale=${encodeURIComponent(locale)}`).then((r) => r.messages),
  send: (kind: ChatKind, id: string, body: string, locale: string, clientId?: string) =>
    call<{ message: SvcMessage }>("POST", `${chatBase(kind, id)}/messages`, { body, locale, clientId }).then((r) => r.message),
};

export const customerApi = {
  create: (input: { serviceSlug: string; country: string; sido: string; gungu: string; address: string; description: string; locale: string; selectedOptions: string[] }) =>
    call<{ request: SvcRequest; eligibleHelpers: number; token: string }>("POST", "/c/requests", input),
  /** One-time exchange of the link token for an HttpOnly cookie; the token is never kept in JS-readable storage. */
  claim: (id: string, token: string) => call<{ request: SvcRequest }>("POST", `/c/requests/${id}/claim`, { token }).then((r) => r.request),
  list: () => call<{ requests: SvcRequest[] }>("GET", "/c/requests").then((r) => r.requests),
  get: (id: string) => call<{ request: SvcRequest; events: SvcEvent[] }>("GET", `/c/requests/${id}`),
  cancel: (id: string) => call<{ request: SvcRequest }>("POST", `/c/requests/${id}/cancel`, {}).then((r) => r.request),
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
