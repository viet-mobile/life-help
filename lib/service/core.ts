import type { ServiceDb } from "./db";
import { isSecret, newSecret, sha256Hex } from "./credentials";
import { ServiceError } from "./errors";
import { normalizeServiceSlug } from "./catalog";
import type { Translator } from "./translate";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type ActorKind = "CUSTOMER" | "HELPER";
export type TranslationStatus = "NONE" | "OK" | "FAILED" | "SAME_LANGUAGE";

export interface MessageView {
  id: string;
  seq: number;
  requestId: string;
  senderKind: "CUSTOMER" | "HELPER" | "ADMIN" | "SYSTEM";
  /** The original text exactly as written. */
  body: string;
  sourceLocale: string;
  createdAt: string;
  own: boolean;
  translation: { locale: string; text: string } | null;
  translationStatus: TranslationStatus;
}

export interface RegionInput { country: string; sido?: string | null; gungu?: string | null }
export interface CreateRequestInput {
  serviceSlug: unknown; country: unknown; sido: unknown; gungu?: unknown; address: unknown; description: unknown; locale: unknown; selectedOptions?: unknown;
}

const DAY_MS = 86_400_000;
const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const strings = (v: unknown, max: number, each: number) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((x) => x.trim().slice(0, each)).filter(Boolean).slice(0, max) : []);

/**
 * Orchestrates the svc_* database functions: turns raw credentials into hashes, creates credentials, adds machine translations
 * (cache beside the originals) and nothing else. Authorization, matching, state transitions and notifications all live in SQL.
 */
export class ServiceCore {
  /** (message|request, locale) -> time of the last failed translation: do not hammer a provider that just said no. */
  private failures = new Map<string, number>();

  constructor(
    private db: ServiceDb,
    private translator: Translator,
    private now: () => number = Date.now,
    private failureCooldownMs = 60_000,
  ) {}

  private async hash(raw: string | null | undefined): Promise<string | null> {
    return isSecret(raw) ? sha256Hex(raw) : null;
  }
  private async helperCred(raw: string | null | undefined): Promise<string> {
    return (await this.hash(raw)) ?? ""; // "" is rejected by the database as FORBIDDEN
  }

  /* ---------------------------------------------------------------- customer */

  async createRequest(credRaw: string | null, input: CreateRequestInput) {
    const slug = normalizeServiceSlug(input.serviceSlug);
    const locale = text(input.locale, 16);
    if (!slug || !locale) throw new ServiceError("INVALID_INPUT");
    const credential = isSecret(credRaw) ? credRaw : newSecret(); // a new anonymous customer gets a new credential
    const token = newSecret();
    const out = await this.db.rpc<{ request: any; eligibleHelpers: number }>("svc_c_create_request", {
      p_cred: await sha256Hex(credential),
      p_token: await sha256Hex(token),
      p_locale: locale,
      p_service: slug,
      p_country: text(input.country, 2).toUpperCase(),
      p_sido: text(input.sido, 60),
      p_gungu: text(input.gungu, 60),
      p_address: text(input.address, 300),
      p_description: text(input.description, 2000),
      p_options: strings(input.selectedOptions, 20, 80),
    });
    return { ...out, token, credential: isSecret(credRaw) ? null : credential };
  }

  async getCustomerRequest(credRaw: string | null, tokenRaw: string | null, id: string) {
    return this.db.rpc<{ request: any; events: any[] }>("svc_c_get_request", { p_cred: await this.hash(credRaw), p_token: await this.hash(tokenRaw), p_request: id });
  }
  async listCustomerRequests(credRaw: string | null) {
    return this.db.rpc<any[]>("svc_c_list_requests", { p_cred: await this.hash(credRaw) });
  }
  async cancelCustomerRequest(credRaw: string | null, tokenRaw: string | null, id: string) {
    return this.db.rpc<any>("svc_c_cancel_request", { p_cred: await this.hash(credRaw), p_token: await this.hash(tokenRaw), p_request: id });
  }

  /* ------------------------------------------------------------------ helper */

  /** Registers an applicant (PENDING). The credential is created here, shown once, and only its hash is stored. */
  async registerHelper(input: { name: unknown; primaryLocale: unknown; spokenLocales?: unknown; services: unknown; regions: unknown; email?: unknown }) {
    const capabilities = [...new Set(strings(input.services, 30, 64).map(normalizeServiceSlug).filter((s): s is string => !!s))];
    const regions = (Array.isArray(input.regions) ? input.regions : []).slice(0, 50).map((r: any) => ({
      country: text(r?.country ?? "KR", 2).toUpperCase(), sido: text(r?.sido, 60) || null, gungu: text(r?.gungu, 60) || null,
    }));
    const credential = newSecret();
    const helper = await this.db.rpc<any>("svc_h_register", {
      p_cred: await sha256Hex(credential),
      p_expires: new Date(this.now() + 90 * DAY_MS).toISOString(),
      p_name: text(input.name, 60),
      p_primary_locale: text(input.primaryLocale, 16),
      p_spoken: strings(input.spokenLocales, 20, 16),
      p_capabilities: capabilities,
      p_regions: regions,
      p_email: text(input.email, 120) || null,
    });
    return { helper, credential };
  }
  async helperMe(credRaw: string | null) {
    return this.db.rpc<any>("svc_h_me", { p_cred: await this.helperCred(credRaw) });
  }
  async setAvailable(credRaw: string | null, available: boolean) {
    return this.db.rpc<any>("svc_h_set_available", { p_cred: await this.helperCred(credRaw), p_available: !!available });
  }
  async updateHelperProfile(credRaw: string | null, patch: { name?: unknown; primaryLocale?: unknown; spokenLocales?: unknown; services?: unknown; regions?: unknown }) {
    const caps = patch.services === undefined ? null : [...new Set(strings(patch.services, 30, 64).map(normalizeServiceSlug).filter((s): s is string => !!s))];
    return this.db.rpc<any>("svc_h_update_profile", {
      p_cred: await this.helperCred(credRaw),
      p_name: patch.name === undefined ? null : text(patch.name, 60),
      p_primary_locale: patch.primaryLocale === undefined ? null : text(patch.primaryLocale, 16),
      p_spoken: patch.spokenLocales === undefined ? null : strings(patch.spokenLocales, 20, 16),
      p_capabilities: caps,
      p_regions: patch.regions === undefined ? null : (patch.regions as any[]).map((r) => ({ country: text(r?.country ?? "KR", 2).toUpperCase(), sido: text(r?.sido, 60) || null, gungu: text(r?.gungu, 60) || null })),
    });
  }
  async listHelperRequests(credRaw: string | null) {
    const cred = await this.helperCred(credRaw);
    const me = await this.db.rpc<any>("svc_h_me", { p_cred: cred });
    const out = await this.db.rpc<{ available: any[]; mine: any[] }>("svc_h_list_requests", { p_cred: cred });
    let budget = 8;
    for (const r of [...out.available, ...out.mine]) budget -= (await this.describe(r, me.primaryLocale, budget)) ? 1 : 0;
    return out;
  }
  async getHelperRequest(credRaw: string | null, id: string) {
    const cred = await this.helperCred(credRaw);
    const me = await this.db.rpc<any>("svc_h_me", { p_cred: cred });
    const r = await this.db.rpc<any>("svc_h_get_request", { p_cred: cred, p_request: id });
    await this.describe(r, me.primaryLocale, 1);
    return r;
  }
  async helperAction(action: "accept" | "start" | "complete", credRaw: string | null, id: string) {
    const fn = { accept: "svc_h_accept", start: "svc_h_start_request", complete: "svc_h_complete_request" }[action];
    return this.db.rpc<any>(fn, { p_cred: await this.helperCred(credRaw), p_request: id });
  }

  /* -------------------------------------------------------------------- chat */

  async sendMessage(kind: ActorKind, credRaw: string | null, tokenRaw: string | null, id: string, body: unknown, locale: unknown) {
    const m = await this.db.rpc<any>("svc_msg_send", {
      p_kind: kind, p_cred: kind === "HELPER" ? await this.helperCred(credRaw) : await this.hash(credRaw), p_token: await this.hash(tokenRaw),
      p_request: id, p_body: text(body, 2000), p_locale: text(locale, 16),
    });
    return { ...m, own: true, translation: null, translationStatus: "NONE" as TranslationStatus } as MessageView;
  }
  async listMessages(kind: ActorKind, credRaw: string | null, tokenRaw: string | null, id: string, after: number, readerLocale: string) {
    const rows = await this.db.rpc<any[]>("svc_msg_list", {
      p_kind: kind, p_cred: kind === "HELPER" ? await this.helperCred(credRaw) : await this.hash(credRaw), p_token: await this.hash(tokenRaw),
      p_request: id, p_after: after, p_target_locale: readerLocale,
    });
    return this.withTranslations(rows, kind, readerLocale);
  }

  /** Adds the cached or fresh machine translation to messages written by someone else in another language. Originals are never touched. */
  private async withTranslations(rows: any[], reader: ActorKind | "ADMIN", locale: string): Promise<MessageView[]> {
    let budget = 8;
    const views: MessageView[] = [];
    for (const m of rows) {
      const own = m.senderKind === reader;
      const base = { id: m.id, seq: Number(m.seq), requestId: m.requestId, senderKind: m.senderKind, body: m.body, sourceLocale: m.sourceLocale, createdAt: m.createdAt, own };
      if (own) { views.push({ ...base, translation: null, translationStatus: "NONE" }); continue; }
      if (m.sourceLocale === locale) { views.push({ ...base, translation: null, translationStatus: "SAME_LANGUAGE" }); continue; }
      if (m.translation) { views.push({ ...base, translation: { locale, text: m.translation }, translationStatus: "OK" }); continue; }
      const key = `M:${m.id}:${locale}`;
      const last = this.failures.get(key);
      if (budget <= 0 || (last !== undefined && this.now() - last < this.failureCooldownMs)) { views.push({ ...base, translation: null, translationStatus: "FAILED" }); continue; }
      budget -= 1;
      const res = await this.translator.translate(m.body, m.sourceLocale, locale);
      if (res.ok) {
        await this.db.rpc("svc_translation_put", { p_entity: "MESSAGE", p_id: m.id, p_target: locale, p_body: res.text, p_provider: res.provider });
        views.push({ ...base, translation: { locale, text: res.text }, translationStatus: "OK" });
      } else {
        this.failures.set(key, this.now());
        views.push({ ...base, translation: null, translationStatus: "FAILED" });
      }
    }
    return views;
  }

  /** Adds `descriptionTranslation` to a request for a reader whose language differs from the customer's. True if a provider call was made. */
  private async describe(r: any, locale: string, budget: number): Promise<boolean> {
    if (!r || r.sourceLocale === locale) { if (r) r.descriptionTranslation = null; return false; }
    const cached = await this.db.rpc<string | null>("svc_request_translation", { p_request: r.id, p_target: locale });
    if (cached) { r.descriptionTranslation = { locale, text: cached, status: "OK" }; return false; }
    const key = `R:${r.id}:${locale}`;
    const last = this.failures.get(key);
    if (budget <= 0 || (last !== undefined && this.now() - last < this.failureCooldownMs)) { r.descriptionTranslation = { locale, text: null, status: "FAILED" }; return false; }
    const res = await this.translator.translate(r.description, r.sourceLocale, locale);
    if (res.ok) {
      await this.db.rpc("svc_translation_put", { p_entity: "REQUEST", p_id: r.id, p_target: locale, p_body: res.text, p_provider: res.provider });
      r.descriptionTranslation = { locale, text: res.text, status: "OK" };
    } else {
      this.failures.set(key, this.now());
      r.descriptionTranslation = { locale, text: null, status: "FAILED" };
    }
    return true;
  }

  /* ---------------------------------------------------------- notifications */

  async notifications(kind: ActorKind, credRaw: string | null, after: number) {
    return this.db.rpc<any[]>("svc_notifications_list", { p_kind: kind, p_cred: kind === "HELPER" ? await this.helperCred(credRaw) : await this.hash(credRaw), p_after: after });
  }
  async markNotificationsRead(kind: ActorKind, credRaw: string | null, upTo: number) {
    return this.db.rpc<number>("svc_notifications_mark_read", { p_kind: kind, p_cred: kind === "HELPER" ? await this.helperCred(credRaw) : await this.hash(credRaw), p_up_to: upTo });
  }

  /* ------------------------------------------------------------------- admin */
  // The caller has verified the signed admin session; `admin` is that verified identity.

  async adminListRequests(status: string | null) {
    const list = await this.db.rpc<any[]>("svc_a_list_requests", { p_status: status, p_limit: 200 });
    for (const r of list.filter((x) => x.sourceLocale !== "ko").slice(0, 8)) await this.describe(r, "ko", 1);
    return list;
  }
  async adminGetRequest(id: string) {
    const out = await this.db.rpc<any>("svc_a_get_request", { p_request: id });
    await this.describe(out.request, "ko", 1);
    return out;
  }
  async adminListHelpers(status: string | null) {
    return this.db.rpc<any[]>("svc_a_list_helpers", { p_status: status });
  }
  async adminSetHelperStatus(admin: string, helperId: string, status: string) {
    return this.db.rpc<any>("svc_a_set_helper_status", { p_admin: admin, p_helper: helperId, p_status: status });
  }
  async adminUpdateHelper(admin: string, helperId: string, patch: { services?: unknown; regions?: unknown }) {
    const caps = patch.services === undefined ? null : [...new Set(strings(patch.services, 30, 64).map(normalizeServiceSlug).filter((s): s is string => !!s))];
    const regions = patch.regions === undefined ? null : (patch.regions as any[]).map((r) => ({ country: text(r?.country ?? "KR", 2).toUpperCase(), sido: text(r?.sido, 60) || null, gungu: text(r?.gungu, 60) || null }));
    return this.db.rpc<any>("svc_a_update_helper", { p_admin: admin, p_helper: helperId, p_capabilities: caps, p_regions: regions });
  }
  async adminAssign(admin: string, id: string, helperId: string) {
    return this.db.rpc<any>("svc_a_assign", { p_admin: admin, p_request: id, p_helper: helperId });
  }
  async adminCancel(admin: string, id: string) {
    return this.db.rpc<any>("svc_a_cancel_request", { p_admin: admin, p_request: id });
  }
  async adminSendMessage(admin: string, id: string, body: unknown, locale: unknown) {
    const m = await this.db.rpc<any>("svc_a_msg_send", { p_admin: admin, p_request: id, p_body: text(body, 2000), p_locale: text(locale, 16) });
    return { ...m, own: true, translation: null, translationStatus: "NONE" as TranslationStatus } as MessageView;
  }
  async adminListMessages(id: string, after: number, readerLocale: string) {
    const rows = await this.db.rpc<any[]>("svc_a_msg_list", { p_request: id, p_after: after, p_target_locale: readerLocale });
    return this.withTranslations(rows, "ADMIN", readerLocale);
  }
  async adminNotifications(after: number) {
    return this.db.rpc<any[]>("svc_a_notifications_list", { p_after: after });
  }
}
