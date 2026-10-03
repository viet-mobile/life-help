import fs from "node:fs";
import { expect, type Page } from "@playwright/test";
import mathDemo from "../../lib/learn/content/demo/math.json";
import englishDemo from "../../lib/learn/content/demo/english.json";
import mathElementary from "../../lib/learn/content/elementary/math.json";
import englishElementary from "../../lib/learn/content/elementary/english.json";
import { ko } from "../../lib/learn/i18n/ko";
import { vi } from "../../lib/learn/i18n/vi";

/**
 * Shared pieces of the STAGING-only real-browser suites (tests/staging/*.staging.spec.ts).
 * The target host and the Supabase project ref are pinned here: every suite imports this module first, so nothing runs (and nothing
 * is mutated) unless the staging identity checks pass. Keys come from the gitignored .env.staging.local and are never printed.
 */
export const BASE = "https://life-help-staging.simpl2eye.workers.dev";
export const REF = "wreebowcbiymodswajwe";
export const PRODUCTION_REF = "wstdbymmkrqgtsibhcjz";
/** Every question the learning sites can serve (elementary + middle / high) with its canonical answer key: the data the server judges against. */
export const DEMO = {
  math: { questions: [...mathElementary.questions, ...mathDemo.questions] },
  english: { questions: [...englishElementary.questions, ...englishDemo.questions] },
} as const;
export type Locale = "ko" | "vi";
export type Grade = "E1" | "E2" | "E3" | "E4" | "E5" | "E6" | "M1" | "M2" | "M3" | "H1" | "H2" | "H3";
export type Opts = { locale?: Locale; grade?: Grade };
export const dict = (locale: Locale) => (locale === "vi" ? vi : ko);
export type Site = "math" | "english";
export type Q = {
  id: string;
  type: string;
  options?: { id: string; text: string }[];
  answer: { kind: string; id?: string; value?: number; accepted?: string[]; ids?: string[] };
};

export const env = Object.fromEntries(
  fs.readFileSync(".env.staging.local", "utf8").split(/\r?\n/).map((l) => l.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/)).filter((m): m is RegExpMatchArray => !!m).map((m) => [m[1], m[2].trim()]),
);
export const SUPABASE = (env.TEST_SUPABASE_URL ?? "").replace(/\/$/, "");
export const SERVICE = env.TEST_SUPABASE_SERVICE_ROLE_KEY ?? "";
export const ANON = env.TEST_SUPABASE_ANON_KEY ?? "";
// Fail closed: the browser target must be the staging Worker, the database must be the staging project, never production.
if (
  new URL(BASE).host !== "life-help-staging.simpl2eye.workers.dev" ||
  !SUPABASE.includes(REF) ||
  SUPABASE.includes(PRODUCTION_REF) ||
  !SERVICE ||
  [SERVICE, ANON, SUPABASE].some((v) => v.includes(PRODUCTION_REF))
) throw new Error("staging pin failed: refusing to run");

export const svcHeaders = (): Record<string, string> => ({ apikey: SERVICE, ...(SERVICE.startsWith("sb_") ? {} : { Authorization: `Bearer ${SERVICE}` }), "Content-Type": "application/json" });
export const url = (site: Site, p = "") => `${BASE}/study/${site}${p}`;
export const isApi = (name: string) => (r: { url(): string }) => r.url().endsWith(`/api/learn/${name}`);

/** Called at every distinct screen so a suite can audit it (overflow, console, ...). */
export type ScreenHook = (label: string) => Promise<void>;

/** The payload the API expects for a question's correct answer (the demo content bundle holds the answer keys; the server holds its own). */
export function correctPayload(q: Q): string | string[] {
  const k = q.answer;
  if (q.type === "multiple_choice" || q.type === "true_false") return k.id!;
  if (q.type === "numeric") return String(k.value);
  if (q.type === "short_answer" || q.type === "fill_blank") return k.accepted![0];
  if (q.type === "ordering") return k.ids!;
  throw new Error(`unsupported question type ${q.type}`);
}

export type Snapshot = { totalXp: number; mastery: number; lessons: number; profile: string | null };
export const summarize = (state: { totalXp: number; mastery?: object; lessons?: object; profile?: { nickname?: string } | null }): Snapshot => ({
  totalXp: state.totalXp, mastery: Object.keys(state.mastery ?? {}).length, lessons: Object.keys(state.lessons ?? {}).length, profile: state.profile?.nickname ?? null,
});
/** Account: the learner state the server returns for this browser session (same-origin API call; no secrets). */
export async function snapshot(page: Page, site: Site): Promise<Snapshot> {
  const state = await page.evaluate(async (s) => {
    const r = await fetch(`/api/learn/state`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ site: s }) });
    return (await r.json()).state;
  }, site);
  return summarize(state);
}
/** Guest: progress lives in this browser's localStorage (the server only echoes the state the client sends). */
export async function guestSnapshot(page: Page, site: Site): Promise<Snapshot> {
  const state = await page.evaluate((s) => {
    const key = Object.keys(window.localStorage).find((k) => k.endsWith(`:${s}`));
    return key ? JSON.parse(window.localStorage.getItem(key)!) : null;
  }, site);
  expect(state, "guest state is stored in this browser").toBeTruthy();
  return summarize(state);
}

/* ------------------------------ staging database (server key, fixtures only) ------------------------------ */
export async function authUserId(email: string): Promise<string | null> {
  const list = await (await fetch(`${SUPABASE}/auth/v1/admin/users?per_page=1000`, { headers: svcHeaders() })).json();
  return (list.users ?? []).find((u: { email: string }) => u.email === email)?.id ?? null;
}
export async function authUsersWithEmail(email: string): Promise<number> {
  const list = await (await fetch(`${SUPABASE}/auth/v1/admin/users?per_page=1000`, { headers: svcHeaders() })).json();
  return (list.users ?? []).filter((u: { email: string }) => u.email === email).length;
}
export async function restRows<T = Record<string, unknown>>(table: string, query: string): Promise<T[]> {
  const r = await fetch(`${SUPABASE}/rest/v1/${table}?${query}`, { headers: svcHeaders() });
  const body = await r.json();
  if (!Array.isArray(body)) throw new Error(`${table}: ${JSON.stringify(body).slice(0, 200)}`);
  return body as T[];
}
export async function exactCount(table: string): Promise<number> {
  const r = await fetch(`${SUPABASE}/rest/v1/${table}?select=*`, { method: "HEAD", headers: { ...svcHeaders(), Prefer: "count=exact", Range: "0-0" } });
  const m = (r.headers.get("content-range") ?? "").match(/\/(\d+|\*)$/);
  if (!m || m[1] === "*") throw new Error(`${table}: no count (${r.status})`);
  return Number(m[1]);
}
export const LEARN_TABLES = ["learn_student_profiles", "learn_sessions", "learn_attempts", "learn_skill_mastery", "learn_lesson_progress", "learn_xp_ledger", "learn_streaks", "learn_daily_quests", "learn_student_achievements", "learn_progress_meta"];
export async function deleteFixtureUser(userId: string | null) {
  if (!userId) return;
  const del = await fetch(`${SUPABASE}/auth/v1/admin/users/${userId}`, { method: "DELETE", headers: svcHeaders() });
  expect(del.status, "fixture user deleted").toBeLessThan(300);
  for (const table of LEARN_TABLES) expect(await restRows(table, `user_id=eq.${userId}&select=user_id&limit=1`), `${table} purged with the user`).toEqual([]);
}
