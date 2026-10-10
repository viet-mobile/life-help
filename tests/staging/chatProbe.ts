import type { Page } from "@playwright/test";

/**
 * Chat propagation probe for the staging journey. It records, per page, only SAFE facts about the chat HTTP calls: method class
 * (send / poll), HTTP status, a short error CODE, how many messages a poll returned and whether the run's marker text is among them.
 * It never records URLs with ids/tokens, cookies, headers or bodies. The marker is the RUN_ID message text (safe by design).
 */
export interface SendObs { status: number; code?: string; at: number }
export interface PollObs { status: number; at: number; count: number; hasMarker: boolean }
export interface ChatObs { sends: SendObs[]; polls: PollObs[] }

const MESSAGES_URL = /\/api\/svc\/(?:c|h)\/requests\/[0-9a-f-]{36}\/messages/;

export function watchChat(page: Page, marker: string): ChatObs {
  const obs: ChatObs = { sends: [], polls: [] };
  page.on("response", async (res) => {
    if (!MESSAGES_URL.test(res.url())) return;
    const method = res.request().method();
    const at = Date.now();
    let body: unknown = null;
    try { body = await res.json(); } catch { /* an empty or non-JSON answer is fine */ }
    if (method === "POST") {
      const code = res.status() >= 400 && body && typeof (body as { error?: unknown }).error === "string" && /^[A-Z_]{3,40}$/.test((body as { error: string }).error) ? (body as { error: string }).error : undefined;
      obs.sends.push({ status: res.status(), code, at });
    } else if (method === "GET") {
      const list = body && Array.isArray((body as { messages?: unknown }).messages) ? ((body as { messages: Array<{ body?: unknown }> }).messages) : [];
      obs.polls.push({ status: res.status(), at, count: list.length, hasMarker: list.some((m) => typeof m?.body === "string" && m.body.includes(marker)) });
    }
  });
  return obs;
}

/** What the segments looked like during one delivery attempt. */
export interface Evidence {
  sendEmitted: boolean;
  sendStatus: number | null;
  sendCode: string | null;
  persisted: boolean | null;       // the marker message exists in svc_messages for this request (null = could not be checked)
  pollsInWindow: number;           // receiver polls observed between the send and the end of the wait
  pollStatuses: number[];
  anyPollHasMessage: boolean;
  uiShowsMessage: boolean;
  partyOk: boolean | null;         // receiver is the approved, assigned helper / the owner at the time (null = could not be checked)
  reloadShowsMessage: boolean | null; // diagnostic only; never part of the passing expectation
}
export type Verdict =
  | "OK"
  | "SEND_NOT_EMITTED"
  | "SEND_HTTP_FAILED"
  | "SEND_OK_BUT_NOT_PERSISTED"
  | "RECEIVER_AUTHORIZATION_FAILED"
  | "PERSISTED_BUT_NO_POLL"
  | "POLL_EMPTY_BUT_PERSISTED"
  | "POLL_HAS_MESSAGE_UI_NOT_RENDERED"
  | "UNDETERMINED";

export function classifyChat(e: Evidence): Verdict {
  if (e.uiShowsMessage) return "OK";
  if (!e.sendEmitted) return "SEND_NOT_EMITTED";
  if (e.sendStatus === null || e.sendStatus >= 300) return "SEND_HTTP_FAILED";
  if (e.persisted === false) return "SEND_OK_BUT_NOT_PERSISTED";
  if (e.pollStatuses.some((s) => s === 401 || s === 403 || s === 404) || e.partyOk === false) return "RECEIVER_AUTHORIZATION_FAILED";
  if (e.persisted === true && e.pollsInWindow === 0) return "PERSISTED_BUT_NO_POLL";
  if (e.anyPollHasMessage) return "POLL_HAS_MESSAGE_UI_NOT_RENDERED";
  if (e.persisted === true && e.pollsInWindow > 0) return "POLL_EMPTY_BUT_PERSISTED";
  return "UNDETERMINED";
}

export const median = (xs: number[]) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : null);

/** The secret-free report printed when a delivery fails (also the keys the operator reads). */
export function report(label: string, e: Evidence, polls: PollObs[]): string {
  const gaps = polls.slice(1).map((p, i) => p.at - polls[i].at);
  const hist: Record<string, number> = {};
  for (const p of polls) hist[p.status] = (hist[p.status] ?? 0) + 1;
  return [
    `${label}: ${classifyChat(e)}`,
    `CHAT_SEND_HTTP=${e.sendEmitted ? `${e.sendStatus ?? "no response"}${e.sendCode ? ` ${e.sendCode}` : ""}` : "not emitted"}`,
    `CHAT_MESSAGE_PERSISTED=${e.persisted === null ? "unchecked" : e.persisted}`,
    `HELPER_POLL_ACTIVE=${e.pollsInWindow > 0} (polls in window ${e.pollsInWindow}, median interval ${median(gaps) ?? "n/a"} ms)`,
    `HELPER_POLL_HTTP=${JSON.stringify(hist)}`,
    `HELPER_POLL_HAS_MESSAGE=${e.anyPollHasMessage}`,
    `HELPER_UI_RENDERED_MESSAGE=${e.uiShowsMessage}`,
    `RECEIVER_PARTY_OK=${e.partyOk === null ? "unchecked" : e.partyOk}`,
    `RELOAD_SHOWS_MESSAGE=${e.reloadShowsMessage === null ? "not tried" : e.reloadShowsMessage} (diagnostic only)`,
  ].join("\n");
}
