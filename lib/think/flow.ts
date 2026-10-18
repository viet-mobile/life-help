/**
 * The "10 regular questions -> 1 thinking challenge" flow. Pure state transitions; storage and UI live in components/think/ThinkOffer.tsx.
 *
 * Counting rule (the one the screens and docs state): a regular question counts ONCE per cycle when the learner has solved it or has
 * finished it by reading its explanation (the server answered `correct` or `revealed`). Wrong tries, retries, double submits, a refresh
 * and re-opening the same question never add to the count. Diagnostic, placement and onboarding questions do not count.
 *
 * After OFFER_EVERY counted questions one challenge is OFFERED (never forced): "try now" opens it, "later" keeps it owed. Viewing or
 * skipping a task is not completing it: only the player's onComplete marks a task tried (that record is learn:think:<site>, owned by the hub).
 */
export const OFFER_EVERY = 10;
/** how many of the most recently offered tasks are not offered again, so the same challenge does not come back at once */
export const RECENT_WINDOW = 12;
const MAX_DONE = 60;
const MAX_LIST = 80;

export interface FlowLedger {
  v: 1;
  /** ids of the regular questions counted in the current cycle (set semantics, order = first completion) */
  done: string[];
  /** ids of the tasks offered so far, newest last (bounded) */
  offered: string[];
  /** offered, the learner chose "later", not tried yet; oldest first */
  deferred: string[];
  /** the task being offered right now (survives a reload) */
  pending: string | null;
}

export const emptyLedger = (): FlowLedger => ({ v: 1, done: [], offered: [], deferred: [], pending: null });

const strList = (v: unknown, max: number): string[] => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === "string" && x.length > 0 && x.length < 100))].slice(-max) : []);

/** Defensive parse of whatever storage holds. Anything malformed is an empty ledger. */
export function parseLedger(raw: unknown): FlowLedger {
  let o: unknown = raw;
  if (typeof raw === "string") { try { o = JSON.parse(raw); } catch { return emptyLedger(); } }
  if (!o || typeof o !== "object" || (o as { v?: unknown }).v !== 1) return emptyLedger();
  const r = o as Record<string, unknown>;
  return {
    v: 1,
    done: strList(r.done, MAX_DONE),
    offered: strList(r.offered, MAX_LIST),
    deferred: strList(r.deferred, MAX_LIST),
    pending: typeof r.pending === "string" && r.pending.length < 100 ? r.pending : null,
  };
}

export interface RecordResult { ledger: FlowLedger; counted: boolean; reached: boolean }

/** A regular question was solved or revealed. Idempotent per question id within a cycle. */
export function recordCompleted(l: FlowLedger, questionId: string): RecordResult {
  if (!questionId || l.done.includes(questionId)) return { ledger: l, counted: false, reached: l.done.length >= OFFER_EVERY && !l.pending };
  const done = [...l.done, questionId].slice(-MAX_DONE);
  const ledger = { ...l, done };
  return { ledger, counted: true, reached: done.length >= OFFER_EVERY && !l.pending };
}

export interface Candidate { id: string; topic?: string; status?: string }

/**
 * Choose the task to offer. Never a task already tried, never one of the last RECENT_WINDOW offered (unless the learner deferred it:
 * a deferred task is offered again first, oldest first). Among the rest the choice is deterministic for a given history, prefers
 * tasks that were blind-reviewed, and avoids repeating the topic of the previous offer. null = nothing is ready (keep learning).
 */
export function chooseTask(candidates: Candidate[], l: FlowLedger, tried: ReadonlySet<string>): string | null {
  const byId = new Map(candidates.map((c) => [c.id, c]));
  for (const id of l.deferred) if (byId.has(id) && !tried.has(id)) return id;
  const recent = new Set(l.offered.slice(-RECENT_WINDOW));
  const pool = candidates.filter((c) => !tried.has(c.id) && !recent.has(c.id));
  if (pool.length === 0) return null;
  const lastTopic = l.offered.length ? byId.get(l.offered[l.offered.length - 1])?.topic : undefined;
  const rank = (c: Candidate) => (c.status === "reviewed-ai" ? 0 : 1) * 2 + (lastTopic && c.topic === lastTopic ? 1 : 0);
  const best = Math.min(...pool.map(rank));
  const top = pool.filter((c) => rank(c) === best).sort((a, b) => (a.id < b.id ? -1 : 1));
  return top[l.offered.length % top.length].id;
}

/** The cycle reached its count and a task was chosen: offer it. The count restarts, so a refresh cannot offer a second one. */
export function startOffer(l: FlowLedger, taskId: string): FlowLedger {
  return { ...l, pending: taskId, done: [], offered: [...l.offered.filter((x) => x !== taskId), taskId].slice(-MAX_LIST), deferred: l.deferred.filter((x) => x !== taskId) };
}

/** Nothing ready for this learner: restart the count and carry on with regular learning. */
export function noTaskAvailable(l: FlowLedger): FlowLedger {
  return { ...l, done: [] };
}

/** "Later": the task stays owed (offered again first the next time), the learner is never blocked. */
export function chooseLater(l: FlowLedger): FlowLedger {
  if (!l.pending) return l;
  return { ...l, deferred: [...l.deferred.filter((x) => x !== l.pending), l.pending].slice(-MAX_LIST), pending: null };
}

/** "Try now": the offer is consumed; completion is recorded by the player (tried), not here. */
export function chooseNow(l: FlowLedger): FlowLedger {
  return l.pending ? { ...l, pending: null } : l;
}

/** The task was completed (any way): it is no longer owed. */
export function taskCompleted(l: FlowLedger, taskId: string): FlowLedger {
  return { ...l, deferred: l.deferred.filter((x) => x !== taskId), pending: l.pending === taskId ? null : l.pending };
}

export interface FlowView { toNext: number; owed: number }
/** What the dashboard and hub show: questions left in this cycle, and challenges waiting (offered now or deferred). */
export function flowView(l: FlowLedger): FlowView {
  return { toNext: Math.max(1, OFFER_EVERY - l.done.length), owed: l.deferred.length + (l.pending ? 1 : 0) };
}

export const flowKey = (site: string) => `learn:thinkflow:${site}`;
